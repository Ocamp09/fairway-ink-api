package routes

import (
	"database/sql"

	"github.com/ocamp09/fairway-ink-api/golang-api/handlers"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, db *sql.DB, logger *zap.SugaredLogger, stripe *services.StripePaymentService) {
	cartService := services.NewCartService(db)
	generateService := services.NewGenerateStlService(db)
	designService := services.NewDesignService("../designs", "https://api.fairway-ink.com")
	outputService := services.NewDesignService("./output", "https://api.fairway-ink.com")

	cartHandler := handlers.NewCartHandler(cartService, logger)
	generateHandler := handlers.NewGenerateHandler(generateService, logger)
	designHandler := handlers.NewDesignHandler(designService, logger)
	outputHandler := handlers.NewDesignHandler(outputService, logger)
	
	r.GET("/designs", designHandler.ListDesigns)
	r.GET("/designs/:filename", designHandler.GetDesign)
	r.GET("/output/:ssid/:filename", outputHandler.GetDesign)
	r.POST("/upload", handlers.UploadFile)
	r.POST("/generate", generateHandler.GenerateStl)
	r.POST("/cart", cartHandler.AddToCart)
	r.POST("/create-payment-intent", func(c *gin.Context) {
		handlers.CreatePaymentIntent(c, logger, stripe)
	})
	r.POST("/handle-order", handlers.HandleOrder)
}
