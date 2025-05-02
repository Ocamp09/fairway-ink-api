package services

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestCleanOldSTL(t *testing.T) {
	tests := []struct{
		desc string
		ssid string
		stlKey string
		filename string
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
		// {
		// 	desc:     "No stlUrl provided with row",
		// 	ssid:     "123",
		// 	stlKey:   "1",
		// 	filename: "test.svg",
		// 	mockDB: func(mock sqlmock.Sqlmock) {
		// 		rows := sqlmock.NewRows([]string{"ssid"}).AddRow("123")
		// 		mock.ExpectBegin()
		// 		mock.ExpectQuery(`SELECT stl_url FROM cart_items WHERE browser_ssid = ?`).
		// 			WithArgs("123").
		// 			WillReturnRows(rows)
		// 	},
		// 	wantErr:    true,
		// 	wantErrMsg: "unable to find items stlUrl:",
		// },
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

			// call helper function
			err = cleanOldSTL(tt.ssid, tt.stlKey, tt.filename, db)

			// assert proper errors thrown
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
			} else {
				assert.NoError(t, err)
			}

			//assert mock db expectations met
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled db expectations: %s", err)
			}
		})
	}
}