package services

import (
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/EasyPost/easypost-go/v4"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stretchr/testify/assert"
)

func TestProcessOrder(t *testing.T) {
	tests := []struct {
		desc string
		orderInfo structs.OrderInfo
		mockDB func(sqlmock.Sqlmock)
		wantErr bool
		wantErrMsg string
		wantOrderInfo structs.OrderInfo
	}{
		{
			desc: "successfully processed order",
			orderInfo: structs.OrderInfo{

			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
			},	
			wantErr: false,
			wantOrderInfo: structs.OrderInfo{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			// create mock DB
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to mock db: %v", err)
			}
			defer db.Close()

			// set up mock expectations
			tt.mockDB(mock)

			// create service w/ mock
			service := NewOrderService(db)

			// call service method
			orderInfo, err := service.ProcessOrder(&tt.orderInfo)

			// Assertions
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
			} else {
				assert.Equal(t, tt.wantOrderInfo, orderInfo, "order info does not match")
				assert.NoError(t, err)
			}
		})
	}
}

func TestInsertOrder(t *testing.T) {
	tests := []struct {
		desc        string
		mockDB      func(sqlmock.Sqlmock)
		orderInfo   *structs.OrderInfo
		total       float64
		wantErr     bool
		wantErrMsg  string
	}{
		{
			desc: "successfully insert order",
			orderInfo: &structs.OrderInfo{
				Email:          "test@example.com",
				Name:           "John Doe",
				Address:        structs.AddressInfo{Line1: "123 St", Line2: "", City: "City", State: "ST", PostalCode: "12345", Country: "US"},
				BrowserSSID:    "ssid123",
				PaymentIntentID: "pi_123",
				PaymentStatus:  "paid",
			},
			total: 10.0,
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO orders").
					WithArgs("test@example.com", "John Doe", "123 St", "", "City", "ST", "12345", "US", "ssid123", "pi_123", 10.0, "paid").
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			wantErr: false,
		},
		{
			desc: "query fails",
			orderInfo: &structs.OrderInfo{
				Email:          "fail@example.com",
				Name:           "Jane Doe",
				Address:        structs.AddressInfo{Line1: "123 St", Line2: "", City: "City", State: "ST", PostalCode: "12345", Country: "US"},
				BrowserSSID:    "ssid456",
				PaymentIntentID: "pi_456",
				PaymentStatus:  "paid",
			},
			total: 20.0,
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO orders").
					WillReturnError(errors.New("insert failed"))
			},
			wantErr:    true,
			wantErrMsg: "failed to insert order into database:",
		},
		{
			desc: "fail to get last insert id",
			orderInfo: &structs.OrderInfo{
				Email:          "noid@example.com",
				Name:           "Jake Doe",
				Address:        structs.AddressInfo{Line1: "321 St", Line2: "", City: "Town", State: "TS", PostalCode: "54321", Country: "US"},
				BrowserSSID:    "ssid789",
				PaymentIntentID: "pi_789",
				PaymentStatus:  "paid",
			},
			total: 30.0,
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO orders").
					WithArgs("noid@example.com", "Jake Doe", "321 St", "", "Town", "TS", "54321", "US", "ssid789", "pi_789", 30.0, "paid").
					WillReturnResult(sqlmock.NewErrorResult(errors.New("last insert id error")))
			},
			wantErr:    true,
			wantErrMsg: "failed to retrieve order ID:",
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			tt.mockDB(mock)

			service := &OrderServiceImpl{DB: db}
			tx, err := db.Begin()
			if err != nil {
				t.Fatalf("failed to begin transaction: %v", err)
			}


			orderID, err := service.insertOrder(tx, tt.orderInfo, tt.total)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
				assert.Equal(t, int64(-1), orderID)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, int64(1), orderID)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}		
		})
	}
}

func TestInsertShipping(t *testing.T) {
	tests := []struct {
		desc        string
		mockDB      func(sqlmock.Sqlmock)
		orderID   int64
		shipment *easypost.Shipment
		wantErr     bool
		wantErrMsg  string
	}{
		{
			desc: "successfully insert order",
			orderID: 7,
			shipment: &easypost.Shipment{
				ID: "2",
				TrackingCode: "123",
				SelectedRate: &easypost.Rate{
					Rate: "1.50",
					Carrier: "usps",
					Service: "ground_advantage",
				},
				PostageLabel: &easypost.PostageLabel{LabelURL: "test.com"},
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO shipping").
					WithArgs(7, "2", "usps", "ground_advantage", "123", "1.50", "test.com").
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			wantErr: false,
		},
		{
			desc: "query fails",
			orderID: 7,
			shipment: &easypost.Shipment{
				ID: "2",
				TrackingCode: "123",
				SelectedRate: &easypost.Rate{
					Rate: "1.50",
					Carrier: "usps",
					Service: "ground_advantage",
				},
				PostageLabel: &easypost.PostageLabel{LabelURL: "test.com"},
			},
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO shipping").
					WillReturnError(errors.New("insert failed"))
			},
			wantErr:    true,
			wantErrMsg: "failed to insert shipping info:",
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			tt.mockDB(mock)

			service := &OrderServiceImpl{DB: db}
			tx, err := db.Begin()
			if err != nil {
				t.Fatalf("failed to begin transaction: %v", err)
			}


			err = service.insertShipping(tx, tt.orderID, tt.shipment)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
			} else {
				assert.NoError(t, err)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}		
		})
	}
}

func TestInsertJob(t *testing.T) {
	tests := []struct {
		desc        string
		mockDB      func(sqlmock.Sqlmock)
		orderID   	int64
		wantErr     bool
		wantErrMsg  string
	}{
		{
			desc: "successfully insert order",
			orderID: 7,
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO print_jobs").
					WithArgs(7, "queued").
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			wantErr: false,
		},
		{
			desc: "query fails",
			orderID: 8,
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO print_jobs").
					WillReturnError(errors.New("insert failed"))
			},
			wantErr:    true,
			wantErrMsg: "failed to insert print job:",
		},
		{
			desc: "fail to get last insert id",
			orderID: 9,
			mockDB: func(mock sqlmock.Sqlmock) {
				mock.ExpectBegin()
				mock.ExpectExec("INSERT INTO print_jobs").
				WithArgs(9, "queued").
				WillReturnResult(sqlmock.NewErrorResult(errors.New("last insert id error")))
			},
			wantErr:    true,
			wantErrMsg: "failed to retrieve job ID:",
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("failed to create mock db: %v", err)
			}
			defer db.Close()

			tt.mockDB(mock)

			service := &OrderServiceImpl{DB: db}
			tx, err := db.Begin()
			if err != nil {
				t.Fatalf("failed to begin transaction: %v", err)
			}


			jobID, err := service.insertJob(tx, tt.orderID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
				assert.Equal(t, int64(-1), jobID)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, int64(1), jobID)
			}

			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("there were unfulfilled expectations: %s", err)
			}		
		})
	}
}
