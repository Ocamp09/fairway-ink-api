package handlers

import (
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

type MockDesignService struct {
	ListDesignsFn func() ([]structs.Design, error)
	GetFilePathFn func(filename string) string
	FileExistsFn func(path string) bool
}

func (m *MockDesignService) ListDesigns() ([]structs.Design, error) {
	if m.ListDesignsFn != nil {
		return m.ListDesignsFn()
	}

	return nil, errors.New("designs error")
}

func (m *MockDesignService) GetFilePath(filename string, ssid string) string {
	if m.GetFilePathFn != nil {
		return m.GetFilePathFn(filename)
	}

	return ""
}

func (m *MockDesignService) FileExists(path string) bool {
	if m.FileExistsFn != nil {
		return m.FileExistsFn(path)
	}
	
	return false
}

// func TestGetDesign(t *testing.T) {
// 	tests := []struct {
// 		desc        string
// 		mockService func() *MockDesignService
// 		filename    string
// 		wantStatus  int
// 		wantLogs    []observer.LoggedEntry
// 		cleanup func(path string)
// 	}{
// 		{
// 			desc:     "file does not exist",
// 			filename: "missing.stl",
// 			mockService: func() *MockDesignService {
// 				return &MockDesignService{
// 					GetFilePathFn: func(filename string) string {
// 						return "/fake/path/" + filename
// 					},
// 					FileExistsFn: func(path string) bool {
// 						return false
// 					},
// 				}
// 			},
// 			wantStatus: http.StatusBadRequest,
// 			wantLogs: []observer.LoggedEntry{
// 				{
// 					Entry: zapcore.Entry{
// 						Level:   zapcore.ErrorLevel,
// 						Message: "file not found",
// 					},
// 				},
// 			},
// 		},
// 		{
// 			desc:     "non-existant filepath",
// 			filename: "missing.stl",
// 			mockService: func() *MockDesignService {
// 				return &MockDesignService{
// 					GetFilePathFn: func(filename string) string {
// 						return ""
// 					},
// 				}
// 			},
// 			wantStatus: http.StatusBadRequest,
// 			wantLogs: []observer.LoggedEntry{
// 				{
// 					Entry: zapcore.Entry{
// 						Level:   zapcore.ErrorLevel,
// 						Message: "path does not exist",
// 					},
// 				},
// 			},
// 		},
// 		{
// 			desc:     "file exists and is returned",
// 			filename: "existing.stl",
// 			mockService: func() *MockDesignService {
// 				// Create a temp file to simulate a real STL file
// 				tmpFile, err := os.CreateTemp("", "test-*.stl")
// 				assert.NoError(t, err)
// 				tmpFile.WriteString("solid fake_stl_data")
// 				tmpFile.Close()
		
// 				return &MockDesignService{
// 					GetFilePathFn: func(filename string) string {
// 						return tmpFile.Name()
// 					},
// 					FileExistsFn: func(path string) bool {
// 						return true
// 					},
// 				}
// 			},
// 			wantStatus: http.StatusOK,
// 			wantLogs: []observer.LoggedEntry{
// 				{
// 					Entry: zapcore.Entry{
// 						Level:   zapcore.InfoLevel,
// 						Message: "file found",
// 					},
// 				},
// 			},
// 			cleanup: func(path string) {
// 				os.Remove(path)
// 			},
// 		},
// 	}

// 	core, observedLogs := observer.New(zap.DebugLevel)
// 	logger := zap.New(core)
// 	sugar := logger.Sugar()

// 	gin.SetMode(gin.TestMode)

// 	for _, tt := range tests {
// 		t.Run(tt.desc, func(t *testing.T) {
// 			observedLogs.TakeAll()
	
// 			var tmpPath string
// 			mockService := tt.mockService()
// 			if tt.filename == "existing.stl" {
// 				tmpPath = mockService.GetFilePath(tt.filename, "")
// 				defer os.Remove(tmpPath)
// 			}
	
// 			router := gin.Default()
// 			handler := NewDesignHandler(mockService, sugar)
// 			router.GET("/designs/:filename", handler.GetDesign)
	
// 			req, err := http.NewRequest("GET", "/designs/"+tt.filename, nil)
// 			assert.NoError(t, err)
	
// 			w := httptest.NewRecorder()
// 			router.ServeHTTP(w, req)
	
// 			assert.Equal(t, tt.wantStatus, w.Code, "Status codes do not match")
	
// 			allLogs := observedLogs.All()
// 			assert.Equal(t, len(tt.wantLogs), len(allLogs), "Log counts do not match")
	
// 			for i, wantLog := range tt.wantLogs {
// 				if i >= len(allLogs) {
// 					break
// 				}
// 				assert.Equal(t, wantLog.Entry.Level, allLogs[i].Entry.Level)
// 				assert.Contains(t, allLogs[i].Entry.Message, wantLog.Entry.Message)
// 			}
// 		})
// 	}
	
// }

func TestListDesigns(t *testing.T) {
	tests := []struct {
		desc string
		mockService func() *MockDesignService
		wantStatus int
		wantLogs []observer.LoggedEntry	
	}{
		{
			desc: "file does not exist",
			mockService: func() *MockDesignService {
				return &MockDesignService{
					ListDesignsFn: func() ([]structs.Design, error) {
						return nil, errors.New("service error")
					},
				}
			},
			wantStatus: 500,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.ErrorLevel,
						Message: "error fetching designs",
					},
				},
			},
		},
		{
			desc: "successfully returned design",
			mockService: func() *MockDesignService {
				return &MockDesignService{
					ListDesignsFn: func() ([]structs.Design, error) {
						return []structs.Design{
							{
								Name: "test",
								URLs: map[string]string{"sm": "test.stl"},
							},
						}, nil
					},
				}
			},
			wantStatus: 200,
			wantLogs: []observer.LoggedEntry{
				{
					Entry: zapcore.Entry{
						Level: zapcore.InfoLevel,
						Message: "designs found",
					},
				},
			},
		},
	}

	core, observedLogs := observer.New(zap.DebugLevel)
	logger := zap.New(core)
	sugar := logger.Sugar()

	gin.SetMode(gin.TestMode)

	for _, tt := range(tests) {
		t.Run(tt.desc, func(t *testing.T) {
			observedLogs.TakeAll()

			mockService := tt.mockService()

			// setup router w/ mock db and logger
			router := gin.Default()
			handler := NewDesignHandler(mockService, sugar)
			router.GET("/designs", handler.ListDesigns)

			req, err := http.NewRequest("GET", "/designs", nil)
			if err != nil {
				t.Fatalf("Failed to create http request: %v", err)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// Parse response body
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)

			assert.Equal(t, tt.wantStatus, w.Code, "Status codes do not match")
			
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