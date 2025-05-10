package services

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stretchr/testify/assert"
)

type TestFields struct {
	desc        string
	input       structs.CartItem
	mockDB      func(sqlmock.Sqlmock)
	wantErr     bool
	wantErrMsg  string
}

func TestInsertCartItem(t *testing.T) {
	tests := []TestFields{
		{
			desc: "successful insert",
			input: structs.CartItem{
				SSID:         "1234",
				StlURL:       "example.com/test.stl",
				Quantity:     1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec(`INSERT INTO cart_items`).
					WithArgs("1234", "example.com/test.stl", 1, "custom").
					WillReturnResult(sqlmock.NewResult(1, 1))
				mock.ExpectCommit()
			},
			wantErr: false,
		},
		{
			desc: "failed to begin transaction",
			input: structs.CartItem{
				SSID:         "1234",
				StlURL:       "example.com/test.stl",
				Quantity:     1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin().WillReturnError(sql.ErrConnDone)
			},
			wantErr:    true,
			wantErrMsg: "transaction failed: sql: connection is already closed",
		},
		{
			desc: "failed to insert item",
			input: structs.CartItem{
				SSID:         "1234",
				StlURL:       "example.com/test.stl",
				Quantity:     1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec(`INSERT INTO cart_items`).
					WithArgs("1234", "example.com/test.stl", 1, "custom").
					WillReturnError(errors.New("constraint violation"))
				mock.ExpectRollback()
			},
			wantErr:    true,
			wantErrMsg: "insert failed: constraint violation",
		},
		{
			desc: "failed to commit transaction",
			input: structs.CartItem{
				SSID:         "1234",
				StlURL:       "example.com/test.stl",
				Quantity:     1,
				TemplateType: "custom",
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec(`INSERT INTO cart_items`).
					WithArgs("1234", "example.com/test.stl", 1, "custom").
					WillReturnResult(sqlmock.NewResult(1, 1))
				mock.ExpectCommit().WillReturnError(errors.New("commit error"))
			},
			wantErr:    true,
			wantErrMsg: "commit failed: commit error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			// Create mock DB
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			// Set up mock expectations
			tt.mockDB(mock)

			// Create service with mock DB
			service := NewCartService(db)

			// Call the method
			err = service.InsertCartItem(tt.input)

			// Assertions
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
			} else {
				assert.NoError(t, err)
			}

			// Ensure all expectations were met
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}
		})
	}
}