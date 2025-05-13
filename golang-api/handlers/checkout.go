package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"go.uber.org/zap"
)

type CheckoutHandler struct {
	StripeService services.StripeService
	Logger *zap.SugaredLogger
}

func NewCheckoutHandler( stripeService services.StripeService, logger *zap.SugaredLogger) *CheckoutHandler {
	return &CheckoutHandler{
		StripeService: stripeService,
		Logger: logger,
	}
}

func(h *CheckoutHandler) BeginCheckout(c *gin.Context) {
		var requestBody struct {
		Cart []structs.CartItem `json:"cart"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil || requestBody.Cart == nil {
		h.Logger.Error("Error parsing request: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "No cart provided"})
		return
	}

	cart := requestBody.Cart

	if len(cart) == 0 {
		h.Logger.Error("Cart is empty")
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Cart is empty"})
		return
	}

	intent, err := h.StripeService.CreatePaymentIntent(cart)
	if err != nil {
		h.Logger.Error("Error creating Stripe payment intent:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ERROR"})
		return
	}

	h.Logger.Info("Successfully created payment intent")
	c.JSON(http.StatusOK, gin.H{"success": true, "payment_intent": intent.ID, "client_secret": intent.ClientSecret})
}
