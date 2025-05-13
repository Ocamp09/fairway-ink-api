package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"go.uber.org/zap"
)

type OrderHandler struct {
	Service       services.OrderService
	StripeService services.StripeService
	Logger        *zap.SugaredLogger
}

func NewOrderHandler(orderService services.OrderService, stripeService services.StripeService, logger *zap.SugaredLogger) *OrderHandler {
	return &OrderHandler{
		Service:       orderService,
		StripeService: stripeService,
		Logger:        logger,
	}
}

func (h *OrderHandler) HandleOrder(c *gin.Context) {
	var requestBody struct {
		PaymentIntentID string `json:"intent_id"`
		BrowserSSID     string `json:"browser_ssid"`
		Name            string `json:"name"`
		Email           string `json:"email"`
		Address         struct {
			Line1      string `json:"line1"`
			Line2      string `json:"line2"`
			City       string `json:"city"`
			State      string `json:"state"`
			PostalCode string `json:"postal_code"`
			Country    string `json:"country"`
		} `json:"address"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		h.Logger.Errorf("invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	intent, err := h.StripeService.GetPaymentIntent(requestBody.PaymentIntentID)
	if err != nil {
		h.Logger.Errorf("stripe error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if intent.Status != "requires_capture" {
		h.Logger.Errorf("payment not authorized")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment is not authorized"})
		return
	}

	orderInfo := structs.OrderInfo{
		PaymentIntentID: requestBody.PaymentIntentID,
		BrowserSSID:     requestBody.BrowserSSID,
		Amount:          float32(intent.Amount),
		PaymentStatus:   string(intent.Status),
		Name:            requestBody.Name,
		Email:           requestBody.Email,
		Address:         requestBody.Address,
	}

	orderInfo, err = h.Service.ProcessOrder(&orderInfo)
	if err != nil {
		h.Logger.Errorf("unable to process order: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	capturedIntent, err := h.StripeService.CapturePaymentIntent(requestBody.PaymentIntentID)
	if err != nil {
		h.Logger.Errorf("failed to capture payment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	orderInfo.PaymentStatus = string(capturedIntent.Status)

	h.Logger.Infof("Order processed: intentID=%s, email=%s", requestBody.PaymentIntentID, requestBody.Email)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"order":   orderInfo,
	})
}
