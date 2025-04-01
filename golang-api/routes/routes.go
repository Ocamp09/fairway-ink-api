package routes

import (
	"database/sql"

	"github.com/ocamp09/fairway-ink-api/golang-api/handlers"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, db *sql.DB, logger *zap.SugaredLogger, stripe *services.StripePaymentService) {
	r.GET("/designs", handlers.ListDesigns)
	r.GET("/designs/:filename", handlers.GetDesign)
	r.GET("/output/:ssid/:filename", handlers.OutputSTL)
	r.POST("/upload", handlers.UploadFile)
	r.POST("/generate", handlers.GenerateStl)
	r.POST("/cart", func(c *gin.Context) {
		handlers.AddToCart(c, db, logger)
	})
	r.POST("/create-payment-intent", func(c *gin.Context) {
		handlers.CreatePaymentIntent(c, logger, stripe)
	})
	r.POST("/handle-order", handlers.HandleOrder)
}
