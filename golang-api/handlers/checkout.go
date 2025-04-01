package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
	"go.uber.org/zap"
)

const (
	SOLID_PRICE  = 599
	TEXT_PRICE   = 599
	CUSTOM_PRICE = 799 
)

type CartItem struct {
	Type string `json:"type"`
	Quantity int `json:"quantity"`
}

func CreatePaymentIntent(c *gin.Context, logger *zap.SugaredLogger) {
	var requestBody struct {
		Cart string `form:"cart"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		logger.Error("Error parsing request: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "No cart provided"})
		return
	}

	var cart []CartItem
	if err := json.Unmarshal([]byte(requestBody.Cart), &cart); err != nil {
		logger.Error("Error parsing cart JSON:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Invalid cart format"})
		return
	}

	if len(cart) == 0 {
		logger.Error("Failed to get cart items")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to get cart items"})
		return
	}

	// Prepare line items
	totalAmount := 0

	for _, item := range cart {
		var price int
		switch item.Type {
		case "solid":
			price = SOLID_PRICE
		case "text":
			price = TEXT_PRICE
		case "custom":
			price = CUSTOM_PRICE
		default:
			logger.Error("Invalid item type in cart")
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Invalid item type in cart"})
			return
		}

		totalAmount += price * int(item.Quantity)
	}

	if totalAmount <= 0 {
		logger.Error("Invalid order amount")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Invalid order amount"})
		return
	}

	stripe.Key = config.STRIPE_KEY

	params := &stripe.PaymentIntentParams{
		Amount: stripe.Int64(int64(totalAmount)),
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		PaymentMethodTypes: []*string{stripe.String("card")},
		CaptureMethod: stripe.String(string(stripe.PaymentIntentCaptureMethodManual)),
	}

	intent, err := paymentintent.New(params)
	if err != nil {
		logger.Error("Error creating Stripe paymentIntent:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ERROR"})
		return
	}

	logger.Info("Successfully created payment intent")
	c.JSON(http.StatusOK, gin.H{"payment_intent": intent.ID, "client_secret": intent.ClientSecret})
}
