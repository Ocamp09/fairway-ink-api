package handlers

import (
	"net/http"

	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type CartHandler struct {
	Service services.CartService
	Logger *zap.SugaredLogger
}

func NewCartHandler(service services.CartService, logger *zap.SugaredLogger) *CartHandler {
	return &CartHandler{
		Service: service,
		Logger:  logger,
	}
}

func (h *CartHandler) AddToCart(c *gin.Context) {
	var reqBody structs.CartItem

	if err := c.ShouldBindJSON(&reqBody); err != nil {
		h.Logger.Error("Invalid request body: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Data is missing from request"})
		return
	}

	err := h.Service.InsertCartItem(reqBody)
	if err != nil {
		h.Logger.Error("Unable to insert into DB: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to insert into DB"})
		return
	}

	h.Logger.Info("Item successfully added to cart")
	c.JSON(http.StatusOK, gin.H{"success": true})
}
