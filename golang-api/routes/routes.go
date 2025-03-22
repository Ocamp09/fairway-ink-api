package routes

import (
	"github.com/ocamp09/fairway-ink-api/golang-api/handlers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	r.GET("/designs", handlers.ListDesigns)
	r.GET("/designs/:filename", handlers.GetDesign)
	r.GET("/output/:ssid/:filename", handlers.OutputSTL)
	r.POST("/upload", handlers.UploadFile)
	r.POST("/generate", handlers.GenerateStl)
	r.POST("/cart", handlers.AddToCart)
	r.POST("/create-payment-intent", handlers.CreatePaymentIntent)
	r.POST("/handle-order", handlers.HandleOrder)
}
