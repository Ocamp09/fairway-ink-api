package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/routes"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle OPTIONS method for CORS preflight request
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusOK)
			return
		}

		c.Next()
	}
}

func main() {
	r := gin.Default()

	// Apply CORS middleware
	r.Use(CORSMiddleware())

	// Load environment and database
	config.ConnectDB()

	// Register routes
	routes.RegisterRoutes(r)

	log.Println("Server running on port 5000")
	r.Run(":5000")
}
