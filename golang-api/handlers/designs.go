package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"go.uber.org/zap"
)

type DesignHandler struct {
	Service services.DesignService
	Logger *zap.SugaredLogger
}

func NewDesignHandler(service services.DesignService, logger *zap.SugaredLogger) *DesignHandler {
	return &DesignHandler{
		Service: service,
		Logger: logger,
	}
}

const DESIGN_FOLDER = "../designs"
const OUTPUT_FOLDER = "./output"

func (h *DesignHandler) GetDesign(c *gin.Context) {
	filename := c.Param("filename")
	filePath := h.Service.GetFilePath(filename)

	if !h.Service.FileExists(filePath) {
		h.Logger.Error("file not found")
		services.ReturnError(c, h.Logger, "file does not exists", nil)
		return
	}

	h.Logger.Info("file found")
	c.File(filePath)
}

// GetDesigns lists all design files in the "designs/" folder
func (h *DesignHandler) ListDesigns(c *gin.Context) {
	urls, err := h.Service.ListDesigns()
	if err != nil {
		h.Logger.Errorf("error fetching designs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not list designs", "details": err.Error()})
		return
	}

	h.Logger.Info("designs found")
	c.JSON(http.StatusOK, gin.H{"designs": urls})
}
