package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

type RequestPayload struct {
	SSID string `json:"ssid"`
	StlURL string `json:"stlUrl"`
	Quantity int `json:"quantity"`
	TemplateType string `json:"templateType"`
}

type TestFields struct {
	desc string
	request RequestPayload
	mockService func() *MockCartService
	wantStatus int
	wantSuccess bool
	wantLogs []observer.LoggedEntry
}

type MockCartService struct {
	InsertCartItemFn func(item structs.CartItem) error
}

func (m *MockCartService) InsertCartItem(item structs.CartItem) error {
	if m.InsertCartItemFn != nil {
		return m.InsertCartItemFn(item)
	}

	return nil
}

func TestAddToCart(t *testing.T) {
	tests := []TestFields{ 
		{
			desc: "Missing ssid",
			request: RequestPayload{
				StlURL: "example.com/test.stl",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockService: func() *MockCartService {
				return &MockCartService{}
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid request body: ",
					},
				},
			},
		},
		{
			desc: "Missing stl url",
			request: RequestPayload{
				SSID: "1234",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockService: func() *MockCartService {
				return &MockCartService{}
			},			
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid request body: ",
					},
				},
			},
		},
		{
			desc: "Missing quantity",
			request: RequestPayload{
				SSID: "1234",
				StlURL: "example.com/test.stl",
				TemplateType: "custom",
			},
			mockService: func() *MockCartService {
				return &MockCartService{}
			},		
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid request body: ",
					},
				},
			},
		},
		{
			desc: "Missing template type",
			request: RequestPayload{
				SSID: "1234",
				StlURL: "example.com/test.stl",
				Quantity: 1,
			},
			mockService: func() *MockCartService {
				return &MockCartService{}
			},				
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid request body: ",
					},
				},
			},
		},
		{
			desc: "failed service call",
			request: RequestPayload{
				SSID: "1234",
				StlURL: "example.com/test.stl",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockService: func() *MockCartService {
                return &MockCartService{
                    InsertCartItemFn: func(item structs.CartItem) error {
                        return errors.New("service error")
                    },
                }
            },
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Unable to insert into DB: service error",
					},
				},
			},
		},
		{
			desc: "successful cart upload",
			request: RequestPayload{
				SSID: "1234",
				StlURL: "example.com/test.stl",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockService: func() *MockCartService {
                return &MockCartService{
                    InsertCartItemFn: func(item structs.CartItem) error {
                        return nil
                    },
                }
            },	
			wantStatus: http.StatusOK,
			wantSuccess: true,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.InfoLevel,
						Message: "Item successfully added to cart",
					},
				},
			},
		},
	}

	core, observedLogs := observer.New(zap.DebugLevel)
	logger := zap.New(core)
	sugar := logger.Sugar()

	gin.SetMode(gin.TestMode)

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			observedLogs.TakeAll() // reset observed logs each call

			// set mock expectations
			mockService := tt.mockService()

			// setup router w/ mock db and logger
			router := gin.Default()
			handler := NewCartHandler(mockService, sugar)
			router.POST("/cart", handler.AddToCart)

			// convert request payload to json
			jsonData, err := json.Marshal(tt.request)
			if err != nil {
				t.Fatalf("Failed to get response json: %v", err)
			}

			req, err := http.NewRequest("POST", "/cart", bytes.NewBuffer(jsonData))
			if err != nil {
				t.Fatalf("Failed to create http request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Parse response body
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)

			assert.Equal(t, tt.wantStatus, w.Code, "Status codes do not match")

			if success, exists := response["success"]; exists {
				assert.Equal(t, tt.wantSuccess, success, "Success codes do not match")
			} else {
				assert.False(t, tt.wantSuccess, "Expected success but key not found in response")
			}
			
			allLogs := observedLogs.All()
			assert.Equal(t, len(tt.wantLogs), len(allLogs), "Log counts do not match")

			for i, wantLog := range tt.wantLogs {
				if i >= len(allLogs) {
					break
				}

				assert.Equal(t, wantLog.Entry.Level, allLogs[i].Entry.Level, "Log levels do not match")
				assert.Contains(t, allLogs[i].Entry.Message, wantLog.Entry.Message, "Log messages do not contain expected text")
			}
		})
	}
}