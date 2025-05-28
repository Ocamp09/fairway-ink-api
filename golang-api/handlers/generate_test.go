package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

type GeneratePayload struct {
	SSID   string `json:"ssid"`
	Scale  string `json:"scale"`
	StlKey string `json:"stlKey"`
}

type MockGenerateService struct {
	GenerateStlFn func(ssid string, stlKey string, file io.Reader, filename string, scale string, stlName string) (string, error)
}

func (m *MockGenerateService) GenerateStl(ssid string, stlKey string, file io.Reader, filename string, scale string, stlName string) (string, error) {
	if m.GenerateStlFn != nil {
		return m.GenerateStlFn(ssid, stlKey, file, filename, scale, stlName)
	}
	return "", nil
}

func TestGenerateStl(t *testing.T) {
	tests := []struct {
		desc        string
		request     GeneratePayload
		includeFile bool
		mockService func() *MockGenerateService
		wantStatus  int
		wantSuccess bool
		wantLogs    []observer.LoggedEntry
	}{
		{
			desc:        "Missing SSID",
			includeFile: true,
			request:     GeneratePayload{},
			mockService: func() *MockGenerateService {
				return &MockGenerateService{}
			},
			wantStatus:  http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level:   zapcore.ErrorLevel,
						Message: "no session ID provided",
					},
				},
			},
		},
		{
			desc:    "Missing SVG file",
			request: GeneratePayload{SSID: "123"},
			// no file
			includeFile: false,
			mockService: func() *MockGenerateService {
				return &MockGenerateService{}
			},
			wantStatus:  http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level:   zapcore.ErrorLevel,
						Message: "no SVG file provided",
					},
				},
			},
		},
		{
			desc:        "Failed STL generation",
			includeFile: true,
			request:     GeneratePayload{SSID: "123", Scale: "1", StlKey: "test-key"},
			mockService: func() *MockGenerateService {
				return &MockGenerateService{
					GenerateStlFn: func(ssid, stlKey string, file io.Reader, filename, scale string, stlName string) (string, error) {
						return "", errors.New("unable to generate STL")
					},
				}
			},
			wantStatus:  http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level:   zapcore.ErrorLevel,
						Message: "unable to generate STL",
					},
				},
			},
		},
		{
			desc:        "Successful STL generation",
			includeFile: true,
			request:     GeneratePayload{SSID: "123", Scale: "1", StlKey: "test-key"},
			mockService: func() *MockGenerateService {
				return &MockGenerateService{
					GenerateStlFn: func(ssid, stlKey string, file io.Reader, filename, scale string, stlName string) (string, error) {
						return "successful.stl", nil
					},
				}
			},
			wantStatus:  http.StatusOK,
			wantSuccess: true,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level:   zapcore.InfoLevel,
						Message: "Successfully returned URL",
					},
				},
			},
		},
	}

	core, observedLogs := observer.New(zapcore.DebugLevel)
	logger := zap.New(core)
	sugar := logger.Sugar()

	gin.SetMode(gin.TestMode)

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			observedLogs.TakeAll()
			mockService := tt.mockService()

			router := gin.Default()
			handler := NewGenerateHandler(mockService, sugar)
			router.POST("/generate", handler.GenerateStl)

			body := &bytes.Buffer{}
			writer := multipart.NewWriter(body)

			if tt.request.SSID != "" {
				_ = writer.WriteField("ssid", tt.request.SSID)
			}
			if tt.request.Scale != "" {
				_ = writer.WriteField("scale", tt.request.Scale)
			}
			if tt.request.StlKey != "" {
				_ = writer.WriteField("stlKey", tt.request.StlKey)
			}

			if tt.includeFile {
				part, err := writer.CreateFormFile("svg", "test.svg")
				assert.NoError(t, err)
				_, err = part.Write([]byte("<svg></svg>"))
				assert.NoError(t, err)
			}

			err := writer.Close()
			assert.NoError(t, err)

			req, err := http.NewRequest("POST", "/generate", body)
			assert.NoError(t, err)
			req.Header.Set("Content-Type", writer.FormDataContentType())

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			var response map[string]interface{}
			_ = json.Unmarshal(w.Body.Bytes(), &response)

			assert.Equal(t, tt.wantStatus, w.Code)

			if success, exists := response["success"]; exists {
				assert.Equal(t, tt.wantSuccess, success)
			} else {
				assert.False(t, tt.wantSuccess)
			}

			allLogs := observedLogs.All()
			assert.Equal(t, len(tt.wantLogs), len(allLogs))

			for i, wantLog := range tt.wantLogs {
				if i >= len(allLogs) {
					break
				}
				assert.Equal(t, wantLog.Entry.Level, allLogs[i].Entry.Level)
				assert.Contains(t, allLogs[i].Entry.Message, wantLog.Entry.Message)
			}
		})
	}
}
