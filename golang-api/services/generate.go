package services

import (
	"database/sql"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strconv"
	"strings"

	"go.uber.org/zap"
)

type GenerateStlServiceImpl struct{
	DB *sql.DB
}

func NewGenerateStlService(db *sql.DB) GenerateStlService {
	return &GenerateStlServiceImpl{DB: db}
}

// GenerateStl processes the SVG file, interacts with the database, and runs Blender to generate the STL file
func (s *GenerateStlServiceImpl) GenerateStl(ssid string, stlKey string, file io.Reader, filename string, scale string, logger *zap.SugaredLogger) (string, error) {
	// Clean old files first
	if err := cleanOldSTL(ssid, stlKey, filename, s.DB); err != nil {
		return "", fmt.Errorf("failed to clean old STL: %w", err)
	}

	outputSvgPath, outputDir, err := saveSVG(file, filename, ssid)
	if err != nil {
		return "", fmt.Errorf("failed to save svg: %w", err)
	}

	// Execute Blender to generate the STL
	blenderPath := getBlenderPath()

	outputSvgPath = strings.ReplaceAll(outputSvgPath, "\\", "/")
	blenderCommand := []string{
		blenderPath,
		"--background",
		"--python", "./blender/blender_v1.py", outputSvgPath, scale,
	}

	cmd := exec.Command(blenderCommand[0], blenderCommand[1:]...)
	cmdOutput, err := cmd.CombinedOutput()
	if err != nil {
		logger.Error(fmt.Sprintf("Error running Blender: %v", err))
		return "", fmt.Errorf("error generating STL: %w", err)
	}

	logger.Debug(fmt.Sprintf("Blender output: %s", string(cmdOutput)))

	// Remove original SVG file after conversion
	os.Remove(outputSvgPath)

	// Generate the STL file path
	stlFilename := strings.TrimSuffix(filename, filepath.Ext(filename)) + ".stl"
	stlFilePath := filepath.Join(outputDir, stlFilename)

	// Check if the file exists
	if _, err := os.Stat(stlFilePath); os.IsNotExist(err) {
		return "", fmt.Errorf("STL file was not generated")
	}

	// Generate the URL for the STL file
	stlURL := fmt.Sprintf("https://api.fairway-ink.com/output/%s/%s", ssid, stlFilename)
	return stlURL, nil
}

func cleanOldSTL(ssid string, stlKey string, filename string, db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("transaction failed: %w", err)
	}

	// Get cart items from DB
	var cartStls []string
	query := `SELECT stl_url FROM cart_items WHERE browser_ssid = ?`
	rows, err := tx.Query(query, ssid)
	if err != nil {
		return fmt.Errorf("unable to fetch cart items: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var stlURL string
		if err := rows.Scan(&stlURL); err != nil {
			return fmt.Errorf("unable to find items stlUrl: %w", err)
		}
		cartStls = append(cartStls, stlURL)
	}

	// remove old SVG's not in cart
	key, err := strconv.Atoi(stlKey)
	if err != nil {
		return fmt.Errorf("error converting STL key to int: %w", err)
	}

	if key > 0 {
		prevKey := key - 1
		prevFile := fmt.Sprintf("%d%s.stl", prevKey, filename[strings.Index(filename, "g"):])
		filePath := filepath.Join("output", ssid, prevFile)
		if _, err := os.Stat(filePath); err == nil {
			fileUrl := fmt.Sprintf("https://api.fairway-ink.com/output/%s/%s", ssid, prevFile)
			if !slices.Contains(cartStls, fileUrl) {
				os.Remove(filePath)
			}
		}
	}

	return nil
}

// getBlenderPath returns the correct path for Blender depending on the operating system
func getBlenderPath() string {
	blenderPath := "/home/ec2-user/blender-4.3.2-linux-x64/blender"
	if runtime.GOOS == "darwin" {
		blenderPath = "/Applications/Blender.app/Contents/MacOS/blender"
	} else if runtime.GOOS == "windows" {
		blenderPath = `C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe`
	}
	return blenderPath
}

func saveSVG(file io.Reader, filename string, ssid string) (string, string, error) {
	// Save the SVG file
	outputDir := filepath.Join("output", ssid)
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		return "", "", fmt.Errorf("failed to create output directory: %w", err)
	}

	outputSvgPath := filepath.Join(outputDir, filename)
	outFile, err := os.Create(outputSvgPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create SVG file: %w", err)
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, file); err != nil {
		return "", "", fmt.Errorf("failed to save SVG file: %w", err)
	}

	return strings.ReplaceAll(outputSvgPath, "\\", "/"), outputDir, nil
}
