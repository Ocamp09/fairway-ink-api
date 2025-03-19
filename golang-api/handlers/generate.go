package handlers

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strconv"
	"strings"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
)

func GenerateStl(c *gin.Context) {
	// Get session id from headers
	ssid := c.DefaultPostForm("ssid", "")

	if ssid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "No session ID"})
		return
	}

	// Get SVG file from the form
	file, handler, err := c.Request.FormFile("svg")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "No SVG file provided"})
		return
	}
	defer file.Close()

	filename := handler.Filename

	// Get scale (default 1)
	scale := c.DefaultPostForm("scale", "1")

	// Get cart items from DB
	var cartStls []string
	query := `SELECT stl_url FROM cart_items WHERE browser_ssid = ?`
	rows, err := config.DB.Query(query, ssid)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"success": false, "error": "Unable to connect to database"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var stlURL string
		if err := rows.Scan(&stlURL); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart items"})
			return
		}
		cartStls = append(cartStls, stlURL)
	}

	// remove old SVG's not in cart
	stlKey := c.DefaultPostForm("stlKey", "-1")
	key, err := strconv.Atoi(stlKey)
	if err != nil {
		fmt.Println("Error converting STL key to int")
		return
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

	// Save the SVG file
	outputDir := filepath.Join("output", ssid)
	if err := os.MkdirAll(outputDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create output directory"})
		return
	}

	outputSvgPath := filepath.Join(outputDir, filename)
	outFile, err := os.Create(outputSvgPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create SVG file"})
		return
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to save SVG file"})
		return
	}
	// Execute Blender to generate STL
	blenderPath := "/home/ec2-user/blender-4.3.2-linux-x64/blender"
	if runtime.GOOS == "darwin" {
		blenderPath = "/Applications/Blender.app/Contents/MacOS/blender"
	} else if runtime.GOOS == "windows" {
		blenderPath = `C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe`
	}

	outputSvgPath = strings.ReplaceAll(outputSvgPath, "\\", "/")
	blenderCommand := []string{
		blenderPath,
		"--background",
		"--python", "./blender_v1.py", outputSvgPath, scale,
	}

	cmd := exec.Command(blenderCommand[0], blenderCommand[1:]...)
	cmdOutput, _ := cmd.CombinedOutput()
	//TODO: fix blender script in future to not erroneously throw this error
	// if err != nil {
	// 	log.Printf("%s", fmt.Sprintf("Error running Blender: %v", err))
	// 	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Error generating STL"})
	// 	return
	// }
	log.Printf("%s", fmt.Sprintf("Blender output: %s", string(cmdOutput)))

	// Remove original SVG file after conversion
	os.Remove(outputSvgPath)

	// Generate the STL file path
	stlFilename := strings.TrimSuffix(filename, filepath.Ext(filename)) + ".stl"
	stlFilePath := filepath.Join(outputDir, stlFilename)

	// Check if the file exists
	if _, err := os.Stat(stlFilePath); os.IsNotExist(err) {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "STL file not generated"})
		return
	}

	// Generate the URL for the STL file
	stlURL := fmt.Sprintf("https://api.fairway-ink.com/output/%s/%s", ssid, stlFilename)

	// Use localhost if not running in production
	if runtime.GOOS != "linux" {
		stlURL = fmt.Sprintf("http://localhost:5000/output/%s/%s", ssid, stlFilename)
	}

	// Return success with the STL URL
	c.JSON(http.StatusOK, gin.H{"success": true, "stlUrl": stlURL})
}
