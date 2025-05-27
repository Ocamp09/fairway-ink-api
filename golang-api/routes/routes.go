package routes

import (
	"database/sql"
	"net/http"
	"runtime"

	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/handlers"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, db *sql.DB, logger *zap.SugaredLogger) {
	cartService := services.NewCartService(db)
	generateService := services.NewGenerateStlService(db, "output", runtime.GOOS)
	designService := services.NewDesignService("../designs", "https://api.fairway-ink.com")
	outputService := services.NewDesignService("./output", "https://api.fairway-ink.com")

	easypostClient := services.NewEasyPostClient(config.EASYPOST_KEY)
	stripeClient := services.NewStripeService(config.STRIPE_KEY)
	orderService := services.NewOrderService(db, easypostClient)

	cartHandler := handlers.NewCartHandler(cartService, logger)
	generateHandler := handlers.NewGenerateHandler(generateService, logger)
	designHandler := handlers.NewDesignHandler(designService, logger)
	outputHandler := handlers.NewDesignHandler(outputService, logger)
	orderHandler := handlers.NewOrderHandler(orderService, stripeClient, logger)
	checkoutHandler := handlers.NewCheckoutHandler(stripeClient, logger)

	r.GET("/health", func(c *gin.Context) {c.JSON(http.StatusOK, gin.H{"success": true})})
	r.GET("/designs", designHandler.ListDesigns)
	r.GET("/designs/:filename", designHandler.GetDesign)
	r.GET("/output/:ssid/:filename", outputHandler.GetDesign)
	r.POST("/upload", handlers.UploadFile)
	r.POST("/generate", generateHandler.GenerateStl)
	r.POST("/cart", cartHandler.AddToCart)
	r.POST("/create-payment-intent", checkoutHandler.BeginCheckout)
	r.POST("/handle-order", orderHandler.HandleOrder)
}
