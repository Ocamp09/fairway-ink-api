package handlers

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strconv"
	"strings"

	"net/http"

	"github.com/gin-gonic/gin"
)

func extractNumber(str string) (int, error) {
	re := regexp.MustCompile(`^\d+`) // Match leading digits
	match := re.FindString(str)

	if match == "" {
		return 0, fmt.Errorf("no leading number found")
	}

	return strconv.Atoi(match) // Convert string to integer
}

func GenerateStl(c *gin.Context) {
	// Get session id from headers
	ssid := c.DefaultPostForm("ssid", "")

	if ssid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "No session ID"})
		return
	}

	// Get SVG file from the form
	file, _, err := c.Request.FormFile("svg")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "No SVG file provided"})
		return
	}
	defer file.Close()

	// Get scale (default 1)
	scale := c.DefaultPostForm("scale", "1")

	// Save the SVG file
	outputDir := "../designs/"
	files, err := os.ReadDir(outputDir)
	if err != nil {
		fmt.Println("Error reading directory: ", err)
	}

	var filenames []string
	for _, file := range files {
		filenames = append(filenames, file.Name())
	}

	println(strings.Join(filenames, ", "))

	sort.Strings(filenames)
	var lastFile string
	if len(filenames) <= 0 {
		fmt.Println("dir was empty")	
	}

	lastFile = filenames[len(filenames)-1]
	fmt.Println("Last file alphabetically:", lastFile)

	newKey, err := extractNumber(lastFile)
	if err != nil {
		newKey = 0
	}

	newKey += 1

	println(newKey)

	filename := fmt.Sprintf("%d_design_", newKey)
	println(filename)

	outputSvgPath := filepath.Join(outputDir, filename)

	designFiles := []string{outputSvgPath + "small.svg", outputSvgPath + "medium.svg", outputSvgPath + "large.svg"}

	// Execute Blender to generate STL
	blenderPath := "/home/ec2-user/blender-4.3.2-linux-x64/blender"
	if runtime.GOOS == "darwin" {
		blenderPath = "/Applications/Blender.app/Contents/MacOS/blender"
	} else if runtime.GOOS == "windows" {
		blenderPath = `C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe`
	}

	for index, path := range designFiles {
		outFile, err := os.Create(path)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create SVG file"})
			return
		}
	
		file.Seek(0, 0)
		if _, err := io.Copy(outFile, file); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to save SVG file"})
			return
		}
	
		outFile.Close() // Ensure each file closes properly

		var floatScale float64
		floatScale, err = strconv.ParseFloat(scale, 64)
			if err != nil {
				log.Println("Unable to convert to float")
			}
		if index == 0 {
			floatScale *= .65
		} else if index == 2 {
			floatScale *= 1.35
		} 

		path = strings.ReplaceAll(path, "\\", "/")
		blenderCommand := []string{
		blenderPath,
			"--background",
			"--python", "./blender/blender_v1.py", path, fmt.Sprintf("%.2f", floatScale),
		}

		cmd := exec.Command(blenderCommand[0], blenderCommand[1:]...)
		cmdOutput, _ := cmd.CombinedOutput()
		log.Printf("%s", fmt.Sprintf("Blender output: %s", string(cmdOutput)))
		os.Remove(path)
	}
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
		stlURL = "http://localhost:5000/designs/1_design_medium"
	}

	// Return success with the STL URL
	c.JSON(http.StatusOK, gin.H{"success": true, "stlUrl": stlURL})
}
