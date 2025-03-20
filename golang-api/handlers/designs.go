package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/gin-gonic/gin"
)

const DESIGN_FOLDER = "../designs"
const OUTPUT_FOLDER = "./output"

func GetDesign(c *gin.Context) {
	filename := c.Param("filename")
	filePath := filepath.Join(DESIGN_FOLDER, filename)

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(filePath)
}

// GetDesigns lists all design files in the "designs/" folder
func ListDesigns(c *gin.Context) {
	files, err := os.ReadDir(DESIGN_FOLDER)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not list designs", "details": err.Error()})
		return
	}

	var fileURLs []string
	for _, file := range files {
		if !file.IsDir() && strings.Contains(file.Name(), "medium") {
			url := fmt.Sprintf("https://api.fairway-ink.com/designs/%s", file.Name())

			// Use localhost URL for development
			if runtime.GOOS != "linux" {
				url = fmt.Sprintf("http://localhost:5000/designs/%s", file.Name())
			}
			fileURLs = append(fileURLs, url)
		}
	}

	c.JSON(http.StatusOK, gin.H{"designs": fileURLs})
}

func OutputSTL(c *gin.Context) {
	ssid := c.Param("ssid")
	filename := c.Param("filename")
	filePath := filepath.Join(OUTPUT_FOLDER, ssid, filename)

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(filePath)
}
