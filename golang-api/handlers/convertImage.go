package handlers

import (
	"context"
	"io"
	"log"
	"net/http"

	pb "github.com/ocamp09/fairway-ink-api/golang-api/pb"
	"google.golang.org/grpc"

	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	log.Println("UploadFile: Request received")

	// Get the uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("UploadFile: No file uploaded - %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	log.Printf("UploadFile: File '%s' received\n", file.Filename)

	// Open the file
	fileData, err := file.Open()
	if err != nil {
		log.Printf("UploadFile: Failed to open file - %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}
	defer fileData.Close()
	log.Println("UploadFile: File opened successfully")

	// Read the file into a byte slice
	imageData, err := io.ReadAll(fileData)
	if err != nil {
		log.Printf("UploadFile: Failed to read file data - %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}
	log.Printf("UploadFile: File data read successfully (%d bytes)\n", len(imageData))

	// Get the method from the form data
	method := c.DefaultPostForm("method", "solid")
	log.Printf("UploadFile: Method '%s' selected\n", method)

	// Call the gRPC client to convert the image to SVG
	svgData, err := ConvertImageToSVG(imageData, method)
	if err != nil {
		log.Printf("UploadFile: Failed to convert image to SVG - %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process image"})
		return
	}
	log.Println("UploadFile: Image successfully converted to SVG")

	// Return the SVG data in the response
	c.JSON(http.StatusOK, gin.H{"success": true, "svgData": svgData})
	log.Println("UploadFile: Response sent successfully")
}

func ConvertImageToSVG(imageData []byte, method string) (string, error) {
	log.Println("ConvertImageToSVG: Attempting to connect to gRPC server")

	// Connect to the Python gRPC server
	conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
	if err != nil {
		log.Printf("ConvertImageToSVG: Failed to connect to gRPC server - %v\n", err)
		return "", err
	}
	defer conn.Close()
	log.Println("ConvertImageToSVG: Connected to gRPC server")

	// Create a gRPC client
	client := pb.NewImageToSvgClient(conn)
	log.Println("ConvertImageToSVG: gRPC client created")

	// Call the gRPC method to convert the image
	log.Printf("ConvertImageToSVG: Sending request to gRPC server (method: %s)\n", method)
	response, err := client.ConvertImage(context.Background(), &pb.ImageRequest{
		ImageData: imageData,
		Method:    method,
	})
	if err != nil {
		log.Printf("ConvertImageToSVG: gRPC call failed - %v\n", err)
		return "", err
	}
	log.Println("ConvertImageToSVG: gRPC call successful")

	// Return the SVG data
	log.Printf("ConvertImageToSVG: Received SVG data (%d characters)\n", len(response.SvgData))
	return response.SvgData, nil
}