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

	"github.com/ocamp09/fairway-ink-api/golang-api/config"
)

type GenerateStlServiceImpl struct{
	DB *sql.DB
	OUT_PATH string
	OS string

	cleanOldStlFunc func(ssid string, stlKey string, filename string) error
	saveSvgFunc func(file io.Reader, filename string, ssid string) (string, string, error)
	commandExecutor func(name string, arg ...string) *exec.Cmd

	mkdirAllFunc   func(path string, perm os.FileMode) error}

func NewGenerateStlService(db *sql.DB, outPath string, os string) GenerateStlService {
	svc := &GenerateStlServiceImpl{
		DB: db, 
		OUT_PATH: outPath,
		OS: os,
		commandExecutor: exec.Command,
	}
	svc.cleanOldStlFunc = svc.cleanOldStl
	svc.saveSvgFunc = svc.saveSvg
	return svc
}

// GenerateStl processes the SVG file, interacts with the database, and runs Blender to generate the STL file
func (s *GenerateStlServiceImpl) GenerateStl(ssid string, stlKey string, file io.Reader, filename string, scale string) (string, error) {
	// Clean old files first
	if err := s.cleanOldStlFunc(ssid, stlKey, filename); err != nil {
		return "", fmt.Errorf("failed to clean old STL: %w", err)
	}

	outputSvgPath, outputDir, err := s.saveSvgFunc(file, filename, ssid)
	if err != nil {
		return "", fmt.Errorf("failed to save svg: %w", err)
	}

	// Execute Blender to generate the STL
	blenderPath := s.getBlenderPath()

	outputSvgPath = strings.ReplaceAll(outputSvgPath, "\\", "/")
	blenderCommand := []string{
		blenderPath,
		"--background",
		"--python", "./blender/blender_v1.py", outputSvgPath, scale,
	}

	cmd := s.commandExecutor(blenderCommand[0], blenderCommand[1:]...)
    _, _ = cmd.CombinedOutput()
	// if err != nil {
	// 	return "", fmt.Errorf("error generating STL: %w", err)
	// }

	// Remove original SVG file after conversion
	os.Remove(outputSvgPath)

	// Generate the STL file path
	stlFilename := strings.TrimSuffix(filename, filepath.Ext(filename)) + ".stl"
	stlFilePath := filepath.Join(outputDir, stlFilename)

	// Check if the file exists
	if _, err := os.Stat(stlFilePath); os.IsNotExist(err) {
		return "", fmt.Errorf("STL file was not generated")
	}

	domain := "https://api.fairway-ink.com"
	if runtime.GOOS != "linux" {
		domain = fmt.Sprintf("http://localhost:%s", config.PORT)
	}

	// Generate the URL for the STL file
	stlURL := fmt.Sprintf("%s/output/%s/%s", domain, ssid, stlFilename)
	return stlURL, nil
}

func (s *GenerateStlServiceImpl)cleanOldStl(ssid string, stlKey string, filename string) error {
	tx, err := s.DB.Begin()
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
	
		base := filepath.Base(filename)
		name := strings.TrimSuffix(base, filepath.Ext(base))
		prevFile := fmt.Sprintf("%d%s.stl", prevKey, name)
		filePath := filepath.Join("output", ssid, prevFile)
	
		if _, err := os.Stat(filePath); err == nil {
			domain := "https://api.fairway-ink.com"
			if runtime.GOOS != "linux" {
				domain = fmt.Sprintf("http://localhost:%s", config.PORT) 
			}
			fileUrl := fmt.Sprintf("%s/output/%s/%s", domain, ssid, prevFile)
			
			if !slices.Contains(cartStls, fileUrl) {
				os.Remove(filePath)
			}
		}
	}

	return nil
}

// getBlenderPath returns the correct path for Blender depending on the operating system
func(s *GenerateStlServiceImpl) getBlenderPath() string {
	blenderPath := "/home/ec2-user/blender-4.3.2-linux-x64/blender"
	if s.OS == "darwin" {
		blenderPath = "/Applications/Blender.app/Contents/MacOS/blender"
	} else if s.OS == "windows" {
		blenderPath = `C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe`
	}
	return blenderPath
}

func (s *GenerateStlServiceImpl)saveSvg(file io.Reader, filename string, ssid string) (string, string, error) {
	// Save the SVG file
	outputDir := filepath.Join(s.OUT_PATH, ssid)

	// setup our func as MkdirAll
	mkdir := s.mkdirAllFunc
	if mkdir == nil {
		mkdir = os.MkdirAll
	}

	if err := mkdir(outputDir, os.ModePerm); err != nil {
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
