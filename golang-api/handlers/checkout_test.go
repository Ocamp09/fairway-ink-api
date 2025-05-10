package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/services"
	"github.com/stretchr/testify/assert"
	"github.com/stripe/stripe-go/v75"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

type requestPayload struct {
	Cart []CartItem `json:"cart"`
}

type testFields struct {
	desc string
	request requestPayload
	mockStripe func(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error)
	wantStatus int
	wantSuccess bool
	wantLogs []observer.LoggedEntry
}

func TestPaymentIntent(t *testing.T) {
	tests := []testFields {
		{
			desc: "No request body",
			request: requestPayload{},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Error parsing request: ",
					},
				},
			},
		},
		{
			desc: "Empty cart",
			request: requestPayload{
				[]CartItem{},
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Cart is empty",
					},
				},
			},
		},
		{
			desc: "Missing quantity",
			request: requestPayload{
				[]CartItem{
					{
						Type: "custom",
					},
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid cart item: missing positive quantity",
					},
				},
			},
		},
		{
			desc: "Invalid quantity",
			request: requestPayload{
				[]CartItem{
					{
						Quantity: 0,
						Type: "custom",
					},
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid cart item: missing positive quantity",
					},
				},
			},
		},
		{
			desc: "Missing type",
			request: requestPayload{
				[]CartItem{
					{
						Quantity: 1,
					},
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid item type in cart",
					},
				},
			},
		},
		{
			desc: "Invalid type",
			request: requestPayload{
				[]CartItem{
					{
						Quantity: 1,
						Type: "fail",
					},
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Invalid item type in cart",
					},
				},
			},
		},
		{
			desc: "Payment intent creation error",
			request: requestPayload{
				[]CartItem{
					{
						Quantity: 1,
						Type: "custom",
					},
				},
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Error creating Stripe payment intent:",
					},
				},
			},
			mockStripe: func(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error) {
				return nil, errors.New("stripe API failure")
			},
		},
		{
			desc: "Successful response",
			request: requestPayload{
				[]CartItem{
					{
						Quantity: 1,
						Type: "custom",
					},
					{
						Quantity: 3,
						Type: "solid",
					},
					{
						Quantity: 2,
						Type: "text",
					},
				},
			},
			wantStatus: http.StatusOK,
			wantSuccess: true,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.InfoLevel,
						Message: "Successfully created payment intent",
					},
				},
			},
			mockStripe: func(params *stripe.PaymentIntentParams) (*stripe.PaymentIntent, error) {
				return &stripe.PaymentIntent{
					ID: "1234",
					ClientSecret: "test_secret",
				}, nil
			},
		},
	}
	core, observedLogs := observer.New(zap.DebugLevel)
	logger := zap.New(core)
	sugar := logger.Sugar()

	gin.SetMode(gin.TestMode)

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			observedLogs.TakeAll()

			// mock stripe
			mockService := &services.MockPaymentService{
				MockCreatePaymentIntent: tt.mockStripe,
			}

			// set the router
			router := gin.Default()
			router.POST("/create-payment-intent", func(c *gin.Context) {CreatePaymentIntent(c, sugar, mockService)})

			// convert payload to json
			jsonData, err := json.Marshal(tt.request)
			if err != nil {
				t.Fatalf("Failed to get response json: %v", err)
			}

			// make request
			req, err := http.NewRequest("POST", "/create-payment-intent", bytes.NewBuffer(jsonData))
			if err != nil {
				t.Fatalf("Failed to create http request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)

			// assert proper status code and success message
			assert.Equal(t, tt.wantStatus, w.Code)

			if success, exists := response["success"]; exists {
				assert.Equal(t, tt.wantSuccess, success, "Success codes do not match")
			} else {
				assert.False(t, tt.wantSuccess, "Expected success but key not found in response")
			}

			// assert proper logs
			allLogs := observedLogs.All()
			assert.Equal(t, len(tt.wantLogs), len(allLogs), "Log counts do not match")

			for i, log := range tt.wantLogs {
				if i >= len(allLogs) {
					break
				}

				assert.Equal(t, log.Entry.Level, allLogs[i].Entry.Level, "Log levels do not match")
				assert.Contains(t, allLogs[i].Entry.Message, log.Entry.Message, "Log messages do not match")
			}
		})
	}
}