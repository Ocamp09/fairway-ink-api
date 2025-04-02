package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/routes"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"
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
	// set up logging
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("could not initialize zap logger: %v", err)
	}
	defer logger.Sync()

	// initialize db connection
	db, err := config.ConnectDB()
	if err != nil {
		logger.Fatal("failed to connect to the db", zap.Error(err))
	}

	// initialize stripe service
	stripeService := &services.StripePaymentService{}

	r := gin.Default()

	// Apply CORS middleware
	r.Use(CORSMiddleware())

	// load environment
	config.LoadEnv()

	// Register routes
	routes.RegisterRoutes(r, db, logger.Sugar(), stripeService)

	log.Println("Server running on port 5000")
	r.Run(":5000")
}
