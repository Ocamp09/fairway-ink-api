package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/paymentintent"
)

var (
	SOLID_PRICE  = 599
	TEXT_PRICE   = 599
	CUSTOM_PRICE = 799 
)

func CreatePaymentIntent(c *gin.Context) {
	var requestBody struct {
		Cart string `form:"cart"`
	}

	if err := c.ShouldBind(&requestBody); err != nil {
		log.Println("Error parsing request:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "No cart provided"})
		return
	}

	if requestBody.Cart == "" {
		c.JSON(http.StatusNotImplemented, gin.H{"success": false, "error": "No cart provided"})
		return
	}

	var cart []map[string]interface{}
	if err := json.Unmarshal([]byte(requestBody.Cart), &cart); err != nil {
		log.Println("Error parsing cart JSON:", err)
		c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "Invalid cart format"})
		return
	}

	if len(cart) == 0 {
		c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "Cart is empty"})
		return
	}

	// Prepare line items
	totalAmount := 0

	for _, item := range cart {
		itemType, ok := item["type"].(string)
		if !ok {
			c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "Invalid item type in cart"})
			return
		}

		quantity, ok := item["quantity"].(float64) // JSON unmarshalling gives float64 by default
		if !ok {
			c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "Invalid quantity in cart"})
			return
		}

		var price int
		switch itemType {
		case "solid":
			price = SOLID_PRICE
		case "text":
			price = TEXT_PRICE
		case "custom":
			price = CUSTOM_PRICE
		default:
			c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "Invalid item type in cart"})
			return
		}


		totalAmount += price * int(quantity)
	}

	if totalAmount <= 0 {
		c.JSON(http.StatusBadGateway, gin.H{"success": false, "error": "Invalid order amount"})
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
		log.Println("Error creating Stripe paymentIntent:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ERROR"})
		return
	}

	println(intent.ID, intent.ClientSecret)
	c.JSON(http.StatusOK, gin.H{"payment_intent": intent.ID, "client_secret": intent.ClientSecret})
}
