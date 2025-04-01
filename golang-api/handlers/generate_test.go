package handlers

import (
	"testing"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

func TestGenerateStl(t *testing.T) {
	tests := []testFields {

	}

	core, observedLogs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)
	sugar := logger.Sugar()

	gin.SetMode(gin.TestMode)
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			observedLogs.TakeAll()

			// set the router
			router := gin.Default()
			router.POST("/generate", func(c *gin.Context) {GenerateStl(c)})
		})
	}
}