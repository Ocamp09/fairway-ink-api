package handlers

import (
	"database/sql"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"
)

type GenerateHandler struct {
	Service services.GenerateStlService
	Logger *zap.SugaredLogger
}

func NewGenerateHandler(service services.GenerateStlService, logger *zap.SugaredLogger, db *sql.DB) *GenerateHandler {
	return &GenerateHandler{
		Service: service,
		Logger: logger,
	}
}

func (h *GenerateHandler) GenerateStl(c *gin.Context) {
	// Get session id from headers
	ssid := c.DefaultPostForm("ssid", "")

	if ssid == "" {
		services.ReturnError(c, h.Logger, "No session ID provided", nil)
		return
	}

	// Get SVG file from the form
	file, handler, err := c.Request.FormFile("svg")
	if err != nil {
		services.ReturnError(c, h.Logger, "No SVG file provided", nil)
		return
	}
	defer file.Close()

	filename := handler.Filename

	// Get scale (default 1)
	scale := c.DefaultPostForm("scale", "1")

	stlKey := c.DefaultPostForm("stlKey", "-1")

	err = h.Service.CleanOldSTL(ssid, stlKey, filename)
	if err != nil {
		services.ReturnError(c, h.Logger, "Unable to clean old files: ", err)
	}

	stlURL, err := h.Service.GenerateStl(ssid, file, filename, scale, h.Logger)
	if err != nil {
		services.ReturnError(c, h.Logger, "Unable to generate STL: ", err)
	}

	// Return success with the STL URL
	h.Logger.Info("Successfully returned URL")
	c.JSON(http.StatusOK, gin.H{"success": true, "stlUrl": stlURL})
}
