package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type RequestBody struct {
	SSID         string `json:"ssid" binding:"required"`
	StlURL       string `json:"stlUrl" binding:"required"`
	Quantity     int    `json:"quantity" binding:"required"`
	TemplateType string `json:"templateType" binding:"required"`
}

func AddToCart(c *gin.Context, db *sql.DB, logger *zap.SugaredLogger) {
	var reqBody RequestBody

	if err := c.ShouldBindJSON(&reqBody); err != nil {
		logger.Error("Invalid request body: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Data is missing from request"})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		logger.Error("Failed to start transaction: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failure"})
		return
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	query := `INSERT INTO cart_items (browser_ssid, stl_url, quantity, template_type) VALUES (?, ?, ?, ?)`
	_, err = tx.Exec(query, reqBody.SSID, reqBody.StlURL, reqBody.Quantity, reqBody.TemplateType)
	if err != nil {
		logger.Error("Failed to insert into cart: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to cart"})
		return
	}

	err = tx.Commit()
	if err != nil {
		logger.Error("Failed to commit transaction: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	logger.Info("Item successfully added to cart")
	c.JSON(http.StatusOK, gin.H{"success": true})
}
