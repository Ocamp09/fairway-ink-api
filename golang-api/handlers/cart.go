package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
)

func AddToCart(c *gin.Context) {
	ssid := c.DefaultPostForm("ssid", "")
	stlUrl := c.DefaultPostForm("stlUrl", "")
	quantity := c.DefaultPostForm("quantity", "")
	templateType := c.DefaultPostForm("templateType", "")
	if ssid == "" || stlUrl == "" || quantity == "" || templateType == "" {
		println("Invalid input")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Data is missing from request"})
		return
	}

	query := `INSERT INTO cart_items (browser_ssid, stl_url, quantity, template_type) VALUES (?, ?, ?, ?)`
	_, err := config.DB.Exec(query, ssid, stlUrl, quantity, templateType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to cart"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
