package services

import (
	"bytes"
	"database/sql"
	"errors"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestGenerateStl(t *testing.T) {
    tests := []struct{
        desc string
        ssid string
        stlKey string
        file io.Reader
        filename string
        scale string
        setupMocks func(*GenerateStlServiceImpl)
        wantErr bool
        wantUrl string
        wantErrMsg string
    }{
        {
            desc: "failed old STL cleaning call",
            ssid: "123",
            stlKey: "1",
            file: bytes.NewBufferString(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
            </svg>`),
            filename: "test.svg",
            scale: "1",
            setupMocks: func(svc *GenerateStlServiceImpl) {
                svc.cleanOldStlFunc = func(ssid, stlKey, filename string) error {
                    return errors.New("failed stl clean")
                }
            },
            wantErr: true,
            wantErrMsg: "failed to clean old STL: failed stl clean",
        },
        {
            desc: "failed save svg call",
            ssid: "123",
            stlKey: "1",
            file: bytes.NewBufferString(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
            </svg>`),
            filename: "test.svg",
            scale: "1",
            setupMocks: func(svc *GenerateStlServiceImpl) {
                svc.cleanOldStlFunc = func(ssid, stlKey, filename string) error {
                    return nil
                }
                svc.saveSvgFunc = func(file io.Reader, filename, ssid string) (string, string, error) {
                    return "", "", errors.New("fail save svg")
                }
            },
            wantErr: true,
            wantErrMsg: "failed to save svg: fail save svg",
        },
		{
			desc: "error generating STL",
			ssid: "123",
			stlKey: "1",
			file: bytes.NewBufferString(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
				<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
			</svg>`),
			filename: "fail.svg",
			scale: "1",
			setupMocks: func(svc *GenerateStlServiceImpl) {
				svc.cleanOldStlFunc = func(ssid, stlKey, filename string) error {
					return nil
				}
				svc.saveSvgFunc = func(file io.Reader, filename, ssid string) (string, string, error) {
					// Return a valid path but ensure Blender fails on execution
					return "invalid/path/to/fail.svg", "output/123", nil
				}
			},
			wantErr: true,
			wantErrMsg: "error generating STL:",
		},
		
    }

    for _, tt := range tests {
        t.Run(tt.desc, func(t *testing.T) {
            svc := &GenerateStlServiceImpl{}
            if tt.setupMocks != nil {
                tt.setupMocks(svc)
            }

            url, err := svc.GenerateStl(tt.ssid, tt.stlKey, tt.file, tt.filename, tt.scale)

            if tt.wantErr {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.wantErrMsg, "returned error does not match expected")
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tt.wantUrl, url, "stl url's do not match")
            }
        })
    }
}

func TestCleanOldSTL(t *testing.T) {
	tests := []struct{
		desc string
		ssid string
		stlKey string
		filename string
		setup func() string
		verify func(string)
		mockDB func(sqlmock.Sqlmock)
		wantErr bool
		wantErrMsg string
	}{
		{
			desc: "DB transaction failed",
			ssid: "123",
			stlKey: "1",
			filename: "test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin().WillReturnError(sql.ErrConnDone)
			},
			wantErr: true,
			wantErrMsg: "transaction failed:",
		},
		{
			desc: "Failed to fetch cart items",
			ssid: "123",
			stlKey: "1",
			filename: "test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid=?`).
					WithArgs("123").
					WillReturnError(errors.New("query failed"))
			},
			wantErr: true,
			wantErrMsg: "unable to fetch cart items:",
		},
		{
			desc:     "No stlUrl provided with row",
			ssid:     "123",
			stlKey:   "1",
			filename: "test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"ssid", "stl_url"}).AddRow("123", "test.com/test.stl")
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid = ?`).
					WithArgs("123").
					WillReturnRows(rows)
			},
			wantErr:    true,
			wantErrMsg: "unable to find items stlUrl:",
		},
		{
			desc:     "Invalid stl Key",
			ssid:     "123",
			stlKey:   "seven",
			filename: "test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"ssid"}).AddRow("123")
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid = ?`).
					WithArgs("123").
					WillReturnRows(rows)
			},
			wantErr:    true,
			wantErrMsg: "error converting STL key to int:",
		},
		{
			desc: "Valid file exists and NOT in cart → deleted",
			ssid: "abc123",
			stlKey: "2",
			filename: "g-test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				// simulate no STL in cart
				rows := sqlmock.NewRows([]string{"stl_url"})
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid = ?`).
					WithArgs("abc123").
					WillReturnRows(rows)
			},
			wantErr: false,
			setup: func() string {
				// create the file to be deleted
				os.MkdirAll("output/abc123", os.ModePerm)
				prevFile := "1g-test.stl"
				fullPath := filepath.Join("output", "abc123", prevFile)
				os.WriteFile(fullPath, []byte("dummy"), 0644)
				return fullPath
			},
			verify: func(path string) {
				if _, err := os.Stat(path); err == nil {
					t.Errorf("Expected file to be deleted, but it still exists")
				}
			},
		},
		{
			desc: "Valid file exists and IS in cart → not deleted",
			ssid: "abc123",
			stlKey: "2",
			filename: "g-test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				prevFile := "1g-test.stl"
				url := "https://api.fairway-ink.com/output/abc123/" + prevFile
				rows := sqlmock.NewRows([]string{"stl_url"}).AddRow(url)
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid = ?`).
					WithArgs("abc123").
					WillReturnRows(rows)
			},
			wantErr: false,
			setup: func() string {
				// create file that should NOT be deleted
				os.MkdirAll("output/abc123", os.ModePerm)
				prevFile := "1g-test.stl"
				fullPath := filepath.Join("output", "abc123", prevFile)
				os.WriteFile(fullPath, []byte("dummy"), 0644)
				return fullPath
			},
			verify: func(path string) {
				if _, err := os.Stat(path); os.IsNotExist(err) {
					t.Errorf("Expected file to NOT be deleted, but it was")
				}
			},
		},
		{
			desc: "stlKey is 0 → skip deletion",
			ssid: "abc123",
			stlKey: "0",
			filename: "g-test.svg",
			mockDB: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"stl_url"})
				mock.ExpectBegin()
				mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid = ?`).
					WithArgs("abc123").
					WillReturnRows(rows)
			},
			wantErr: false,
		},
		
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			// create mock db
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			// set up mock expectations
			tt.mockDB(mock)

			var testFile string
			if tt.setup != nil {
				testFile = tt.setup()
				defer os.RemoveAll("output") // cleanup after each test
			}

			svc := &GenerateStlServiceImpl{DB: db}

			// call helper function
			err = svc.cleanOldStl(tt.ssid, tt.stlKey, tt.filename)

			// assert proper errors thrown
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
			} else {
				assert.NoError(t, err)
			}

			if tt.verify != nil {
				tt.verify(testFile)
			}

			//assert mock db expectations met
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled db expectations: %s", err)
			}
		})
	}
}