package services

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func ReturnError(c *gin.Context, logger *zap.SugaredLogger, msg string, err error) {
	logger.Error(msg, err)
	c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": msg})
}