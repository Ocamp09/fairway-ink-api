package handlers

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"go.uber.org/zap"

	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
)

type OrderHandler struct {
	Service services.OrderService
	Logger *zap.SugaredLogger
}

func NewOrderHandler(service services.OrderService, logger *zap.SugaredLogger) *OrderHandler{
	return &OrderHandler{
		Service: service,
		Logger: logger,
	}
}

func (h *OrderHandler) HandleOrder(c *gin.Context) {
	// Parse JSON request body
	var requestBody struct {
		PaymentIntentID  string `json:"intent_id"`
		BrowserSSID string `json:"browser_ssid"`
		Name    string `json:"name"`
		Email string `json:"email"`
		Address         struct {
            Line1   string `json:"line1"`
            Line2   string `json:"line2"`
            City    string `json:"city"`
            State   string `json:"state"`
            PostalCode string `json:"postal_code"`
            Country string `json:"country"`
        } `json:"address"`

	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		log.Printf("Error getting body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	paymentIntentID := requestBody.PaymentIntentID
	browserSSID := requestBody.BrowserSSID

	// Retrieve the checkout session from Stripe
	stripe.Key = config.STRIPE_KEY

	intent, err := paymentintent.Get(paymentIntentID, nil)
	if err != nil {
		log.Printf("Stripe error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stripe error: %v", err)})
		return
	}

	if intent.Status != "requires_capture" {
		log.Printf("Payment not authorized")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment is not authorized"})
		return
	}

	var orderInfo = structs.OrderInfo{
		PaymentIntentID: paymentIntentID,
		BrowserSSID: browserSSID,
		Amount: float32(intent.Amount),
		PaymentStatus: string(intent.Status),
		Name: requestBody.Name,
		Email: requestBody.Email,
		Address: requestBody.Address,
	}

	orderInfo, err = h.Service.ProcessOrder(&orderInfo)
	if err != nil {
		print(fmt.Sprintf("Unable to process order: %v", err))
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Unable to process order: %v", err)})
		return
	}

	// take payment
	params := &stripe.PaymentIntentCaptureParams{}
	capturedIntent, err := paymentintent.Capture(paymentIntentID, params)
	if err != nil {
		log.Printf("Failed to capture payment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to capture payment: %v", err)})
		return
	}

	// Update order info with final payment status
	orderInfo.PaymentStatus = string(capturedIntent.Status)

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"order": orderInfo,
	})
}

