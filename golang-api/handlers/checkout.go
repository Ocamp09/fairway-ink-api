package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"github.com/stripe/stripe-go/v75"
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
func CreatePaymentIntent(c *gin.Context, logger *zap.SugaredLogger, paymentService services.PaymentService) {
		var requestBody struct {
		Cart []CartItem `json:"cart"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil || requestBody.Cart == nil {
		logger.Error("Error parsing request: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "No cart provided"})
		return
	}

	cart := requestBody.Cart

	if len(cart) == 0 {
		logger.Error("Cart is empty")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Cart is empty"})
		return
	}

	// Prepare line items
	totalAmount := 0

	for _, item := range cart {
		if item.Quantity <= 0  {
			logger.Error("Invalid cart item: missing positive quantity")
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Each cart item must have a quantity greater than 0"})
			return
		}

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

	stripe.Key = config.STRIPE_KEY

	params := &stripe.PaymentIntentParams{
		Amount: stripe.Int64(int64(totalAmount)),
		Currency: stripe.String(string(stripe.CurrencyUSD)),
		PaymentMethodTypes: []*string{stripe.String("card")},
		CaptureMethod: stripe.String(string(stripe.PaymentIntentCaptureMethodManual)),
	}

	intent, err := paymentService.CreatePaymentIntent(params)
	if err != nil {
		logger.Error("Error creating Stripe payment intent:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ERROR"})
		return
	}

	logger.Info("Successfully created payment intent")
	c.JSON(http.StatusOK, gin.H{"success": true, "payment_intent": intent.ID, "client_secret": intent.ClientSecret})
}
