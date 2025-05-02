package services

import (
	"database/sql"
	"errors"
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

func (s *GenerateStlServiceImpl) CleanOldSTL(ssid string, stlKey string, filename string) error{
	tx, err := s.DB.Begin()
	if err != nil {
		return errors.New("transaction failed: " + err.Error())

	}

	// Get cart items from DB
	var cartStls []string
	query := `SELECT stl_url FROM cart_items WHERE browser_ssid = ?`
	rows, err := tx.Query(query, ssid)
	if err != nil {
		return errors.New("Unable to fetch cart items: " + err.Error())
	}
	defer rows.Close()

	for rows.Next() {
		var stlURL string
		if err := rows.Scan(&stlURL); err != nil {
			return errors.New("Unable to find any cart items: " + err.Error())
		}
		cartStls = append(cartStls, stlURL)
	}

	// remove old SVG's not in cart
	key, err := strconv.Atoi(stlKey)
	if err != nil {
		return errors.New("Error converting STL key to int: " + err.Error())
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

// GenerateStl processes the SVG file, interacts with the database, and runs Blender to generate the STL file
func (s *GenerateStlServiceImpl) GenerateStl(ssid string, file io.Reader, filename string, scale string, logger *zap.SugaredLogger) (string, error) {
	// Save the SVG file
	outputDir := filepath.Join("output", ssid)
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create output directory: %w", err)
	}

	outputSvgPath := filepath.Join(outputDir, filename)
	outFile, err := os.Create(outputSvgPath)
	if err != nil {
		return "", fmt.Errorf("failed to create SVG file: %w", err)
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, file); err != nil {
		return "", fmt.Errorf("failed to save SVG file: %w", err)
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
