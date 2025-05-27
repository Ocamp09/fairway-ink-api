package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/routes"
	"go.uber.org/zap"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ui_domain := "https://fairway-ink.com"
		if config.APP_ENV != "prod" {
			ui_domain = "*"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", ui_domain) // Allow only our UI in prod
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

	// load environment
	config.LoadEnv()

	// initialize db connection
	db, err := config.ConnectDB()
	if err != nil {
		logger.Fatal("failed to connect to the db", zap.Error(err))
	}

	r := gin.Default()

	// Apply CORS middleware
	r.Use(CORSMiddleware())

	// Register routes
	routes.RegisterRoutes(r, db, logger.Sugar())

	log.Printf("Server running on port %s", config.PORT)
	r.Run(fmt.Sprintf(":%s", config.PORT))
}
