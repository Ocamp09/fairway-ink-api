package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"
)

type GenerateHandler struct {
	Service services.GenerateStlService
	Logger *zap.SugaredLogger
}

func NewGenerateHandler(service services.GenerateStlService, logger *zap.SugaredLogger) *GenerateHandler {
	return &GenerateHandler{
		Service: service,
		Logger: logger,
	}
}

func (h *GenerateHandler) GenerateStl(c *gin.Context) {
	// Get session id from headers
	ssid := c.DefaultPostForm("ssid", "")
	if ssid == "" {
		services.ReturnError(c, h.Logger, "no session ID provided", nil)
		return
	}

	// Get SVG file from the form
	file, handler, err := c.Request.FormFile("svg")
	if err != nil {
		services.ReturnError(c, h.Logger, "no SVG file provided", nil)
		return
	}
	defer file.Close()

	filename := handler.Filename

	// Get scale (default 1)
	scale := c.DefaultPostForm("scale", "1")

	stlKey := c.DefaultPostForm("stlKey", "-1")


	stlURL, err := h.Service.GenerateStl(ssid, stlKey, file, filename, scale, h.Logger)
	if err != nil {
		services.ReturnError(c, h.Logger, "unable to generate STL: ", err)
		return
	}

	// Return success with the STL URL
	h.Logger.Info("Successfully returned URL")
	c.JSON(http.StatusOK, gin.H{"success": true, "stlUrl": stlURL})
}
