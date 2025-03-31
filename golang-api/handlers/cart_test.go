package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
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
	mockDB func(sqlmock.Sqlmock)
	wantStatus int
	wantSuccess bool
	wantLogs []observer.LoggedEntry
}

func TestAddToCart(t *testing.T) {
	core, observedLogs := observer.New(zap.DebugLevel)
	logger := zap.New(core)
	sugar := logger.Sugar()

	tests := []TestFields{ 
		{
			desc: "Missing ssid",
			request: RequestPayload{
				StlURL: "example.com/test.stl",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockDB: func(s sqlmock.Sqlmock) {},
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
			mockDB: func(s sqlmock.Sqlmock) {},
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
			mockDB: func(s sqlmock.Sqlmock) {},
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
			mockDB: func(s sqlmock.Sqlmock) {},
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
			desc: "failed transaction begin",
			request: RequestPayload{
				SSID: "1234",
				StlURL: "example.com/test.stl",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin().WillReturnError(sql.ErrConnDone)
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Failed to start transaction:",
					},
				},
			},
		},
		{
			desc: "failed insert query",
			request: RequestPayload{
				SSID: "1234",
				StlURL: "example.com/test.stl",
				Quantity: 1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec(`INSERT INTO cart_items`).WithArgs("1234", "example.com/test.stl", 1, "custom").WillReturnError(sql.ErrTxDone)
				mock.ExpectRollback().WillReturnError(nil)
			},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "Failed to insert into cart",
					},
				},
			},
		},
		{
			desc: "Failed transaction commit",
			request: RequestPayload{
				SSID:         "1234",
				StlURL:       "example.com/test.stl",
				Quantity:     1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO cart_items").
					WithArgs("1234", "example.com/test.stl", 1, "custom").
					WillReturnResult(sqlmock.NewResult(1, 1))
				mock.ExpectCommit().WillReturnError(sql.ErrTxDone)
			},
			wantStatus:  http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level:   zapcore.ErrorLevel,
						Message: "Failed to commit transaction: ",
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
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO cart_items").
					WithArgs("1234", "example.com/test.stl", 1, "custom").
					WillReturnResult(sqlmock.NewResult(1, 1))
				mock.ExpectCommit()
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

	gin.SetMode(gin.TestMode)
	

	for _, tt := range tests {
		t.Run(tt.desc, func(t * testing.T) {
			observedLogs.TakeAll() // reset observed logs each call

			// mock db
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to mock db: %v", err)
			}
			defer db.Close()

			// set mock expectations
			tt.mockDB(mock)

			// setup router w/ mock db and logger
			router := gin.Default()
			router.POST("/cart", func(c *gin.Context) {AddToCart(c, db, sugar)})

			// convert request payload to json
			jsonData, _ := json.Marshal(tt.request)

			req,_ := http.NewRequest("POST", "/cart", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Parse response body
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)

			assert.Equal(t, tt.wantStatus, w.Code, "Status code does not match")

			if success, exists := response["success"]; exists {
				assert.Equal(t, tt.wantSuccess, success, "Success code does not match")
			} else {
				assert.False(t, tt.wantSuccess, "Expected success but key not found in response")
			}
			
			allLogs := observedLogs.All()
			assert.Equal(t, len(tt.wantLogs), len(allLogs), "Log counts do not match")

			for i, wantLog := range tt.wantLogs {
				if i >= len(allLogs) {
					break
				}

				assert.Equal(t, wantLog.Entry.Level, allLogs[i].Entry.Level, "Log level does not match")
				assert.Contains(t, allLogs[i].Entry.Message, wantLog.Entry.Message, "Log message does not contain expected text")
			}

			// Make sure all mock expectations were met
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}
		})
	}
}