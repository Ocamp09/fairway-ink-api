package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"mime/multipart"
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

func createMultipartRequest(ssid, filename, scale string) (*http.Request, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("ssid", ssid)
	writer.WriteField("scale", scale)

	fileWriter, err := writer.CreateFormFile("svg", filename)
	if err != nil {
		return nil, errors.New("Failed to create svg form file")
	}
	fileWriter.Write([]byte("<svg></svg>"))
	
	writer.Close()

	req, err := http.NewRequest("POST", "/generate", body)
    if err != nil {
        return nil, err
    }
    req.Header.Set("Content-Type", writer.FormDataContentType())

    return req, nil
}

func TestGenerateStl(t *testing.T) {
	tests := []struct {
		desc string
		ssid string
		scale string
		mockDB func(sqlmock.Sqlmock)
		wantStatus int
		wantSuccess bool
		wantLogs []observer.LoggedEntry
	}{
		{
			desc: "Missing SSID",
			mockDB: func(s sqlmock.Sqlmock) {},
			wantStatus: http.StatusInternalServerError,
			wantSuccess: false,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "No session ID provided",
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

			// mock db
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to mock db: %v", err)
			}

			tt.mockDB(mock)

			// set the router
			router := gin.Default()
			router.POST("/generate", func(c *gin.Context) {GenerateStl(c, db, sugar)})

			jsonData, err := json.Marshal(tt.request)
			if err != nil {
				t.Fatalf("Failed to get response json: %v", err)
			}

			req, err := http.NewRequest("POST", "/generate", bytes.NewBuffer(jsonData))
			if err != nil {
				t.Fatalf("Failed to create http request: %v", err)
			}
			req.Header.Set("Content-Type", "multipart/form-data")

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

			// Make sure all mock expectations were met
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}
		})
	}
}