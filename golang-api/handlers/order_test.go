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
	"github.com/stripe/stripe-go/v75"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

type MockStripeService struct {
	GetPaymentIntentFn     func(id string) (*stripe.PaymentIntent, error)
	CapturePaymentIntentFn func(id string) (*stripe.PaymentIntent, error)
}

func (m *MockStripeService) GetPaymentIntent(id string) (*stripe.PaymentIntent, error) {
	return m.GetPaymentIntentFn(id)
}

func (m *MockStripeService) CapturePaymentIntent(id string) (*stripe.PaymentIntent, error) {
	return m.CapturePaymentIntentFn(id)
}

type MockOrderService struct {
	ProcessOrderFn func(info *structs.OrderInfo) (structs.OrderInfo, error)
}

func (m *MockOrderService) ProcessOrder(info *structs.OrderInfo) (structs.OrderInfo, error) {
	return m.ProcessOrderFn(info)
}

func TestHandleOrder(t *testing.T) {
	core, observedLogs := observer.New(zap.DebugLevel)
	logger := zap.New(core).Sugar()

	gin.SetMode(gin.TestMode)

	tests := []struct {
		desc          string
		requestBody   interface{}
		stripeService *MockStripeService
		orderService  *MockOrderService
		wantStatus    int
		wantLogs []observer.LoggedEntry
	}{
		{
			desc:        "invalid request",
			requestBody: "not-a-json",
			wantStatus:  http.StatusBadRequest,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "invalid request body",
					},
				},
			},
		},
		{
			desc: "stripe error",
			requestBody: gin.H{
				"intent_id":    "pi_123",
				"browser_ssid": "ssid",
				"name":         "John",
				"email":        "john@example.com",
				"address": gin.H{
					"line1":       "123 St",
					"line2":       "",
					"city":        "City",
					"state":       "ST",
					"postal_code": "12345",
					"country":     "US",
				},
			},
			stripeService: &MockStripeService{
				GetPaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return nil, errors.New("stripe error")
				},
			},
			wantStatus: http.StatusBadRequest,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "stripe error",
					},
				},
			},
		},
		{
			desc: "payment not authorized",
			requestBody: gin.H{
				"intent_id":    "pi_123",
				"browser_ssid": "ssid",
				"name":         "John",
				"email":        "john@example.com",
				"address": gin.H{
					"line1":       "123 St",
					"line2":       "",
					"city":        "City",
					"state":       "ST",
					"postal_code": "12345",
					"country":     "US",
				},
			},
			stripeService: &MockStripeService{
				GetPaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return &stripe.PaymentIntent{Amount: 1000, Status: "requires_payment_method"}, nil
				},
			},
			wantStatus: http.StatusBadRequest,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "payment not authorized",
					},
				},
			},
		},
		{
			desc: "unable to process order info",
			requestBody: gin.H{
				"intent_id":    "pi_123",
				"browser_ssid": "ssid",
				"name":         "John",
				"email":        "john@example.com",
				"address": gin.H{
					"line1":       "123 St",
					"line2":       "",
					"city":        "City",
					"state":       "ST",
					"postal_code": "12345",
					"country":     "US",
				},
			},
			stripeService: &MockStripeService{
				GetPaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return &stripe.PaymentIntent{Amount: 1000, Status: "requires_capture"}, nil
				},
			},
			orderService: &MockOrderService{
				ProcessOrderFn: func(info *structs.OrderInfo) (structs.OrderInfo, error) {
					return structs.OrderInfo{}, errors.New("db error")
				},
			},
			wantStatus: http.StatusBadRequest,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "unable to process order",
					},
				},
			},
		},
		{
			desc: "fail to capture payment",
			requestBody: gin.H{
				"intent_id":    "pi_123",
				"browser_ssid": "ssid",
				"name":         "John",
				"email":        "john@example.com",
				"address": gin.H{
					"line1":       "123 St",
					"line2":       "",
					"city":        "City",
					"state":       "ST",
					"postal_code": "12345",
					"country":     "US",
				},
			},
			stripeService: &MockStripeService{
				GetPaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return &stripe.PaymentIntent{Amount: 1000, Status: "requires_capture"}, nil
				},
				CapturePaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return nil, errors.New("capture error")
				},
			},
			orderService: &MockOrderService{
				ProcessOrderFn: func(info *structs.OrderInfo) (structs.OrderInfo, error) {
					return *info, nil
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "failed to capture payment",
					},
				},
			},
		},
		{
			desc: "successfully processed order",
			requestBody: gin.H{
				"intent_id":    "pi_123",
				"browser_ssid": "ssid",
				"name":         "John",
				"email":        "john@example.com",
				"address": gin.H{
					"line1":       "123 St",
					"line2":       "",
					"city":        "City",
					"state":       "ST",
					"postal_code": "12345",
					"country":     "US",
				},
			},
			stripeService: &MockStripeService{
				GetPaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return &stripe.PaymentIntent{Amount: 1000, Status: "requires_capture"}, nil
				},
				CapturePaymentIntentFn: func(id string) (*stripe.PaymentIntent, error) {
					return &stripe.PaymentIntent{Amount: 1000, Status: "succeeded"}, nil
				},
			},
			orderService: &MockOrderService{
				ProcessOrderFn: func(info *structs.OrderInfo) (structs.OrderInfo, error) {
					return *info, nil
				},
			},
			wantStatus: http.StatusOK,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.InfoLevel,
						Message: "Order processed:",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			observedLogs.TakeAll()

			var bodyBytes []byte
			switch v := tt.requestBody.(type) {
			case string:
				bodyBytes = []byte(v)
			default:
				bodyBytes, _ = json.Marshal(tt.requestBody)
			}

			router := gin.Default()
			handler := NewOrderHandler(tt.orderService, tt.stripeService, logger)
			router.POST("/order", handler.HandleOrder)

			req, _ := http.NewRequest("POST", "/order", bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code, "Status codes do not match")
	
			allLogs := observedLogs.All()
			assert.Equal(t, len(tt.wantLogs), len(allLogs), "Log counts do not match")
	
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
