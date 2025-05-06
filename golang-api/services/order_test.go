package services

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/EasyPost/easypost-go/v4"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockEasyPostClient struct {
	mock.Mock
}

func (m *MockEasyPostClient) CreateShipment(shipment *easypost.Shipment) (*easypost.Shipment, error) {
	args := m.Called(shipment)
	return args.Get(0).(*easypost.Shipment), args.Error(1)
}

func (m *MockEasyPostClient) LowestShipmentRate(shipment *easypost.Shipment) (*easypost.Rate, error) {
	args := m.Called(shipment)
	return args.Get(0).(*easypost.Rate), args.Error(1)
}

func (m *MockEasyPostClient) BuyShipment(shipmentID string, rate *easypost.Rate, insurance string) (*easypost.Shipment, error) {
	args := m.Called(shipmentID, rate, insurance)
	return args.Get(0).(*easypost.Shipment), args.Error(1)
}

func TestProcessOrder(t *testing.T) {
    tests := []struct {
        desc         string
        orderInfo    structs.OrderInfo
        setupMocks   func(*OrderServiceImpl)
        mockDB       func(sqlmock.Sqlmock)
        wantOrderInfo structs.OrderInfo
        wantErr      bool
        wantErrMsg   string
    }{
        {
            desc: "successfully processed order",
            orderInfo: structs.OrderInfo{
                PaymentIntentID: "pi_123",
                BrowserSSID:     "ssid123",
                Amount:         1000, // $10.00
                PaymentStatus:   "requires_capture",
                Name:           "John Doe",
                Email:          "test@example.com",
                Address: structs.AddressInfo{
                    Line1:      "123 Main St",
                    City:       "Boston",
                    State:      "MA",
                    PostalCode: "02108",
                    Country:    "US",
                },
            },
            setupMocks: func(svc *OrderServiceImpl) {
                // Mock insertOrder
                svc.insertOrderFunc = func(tx *sql.Tx, orderInfo *structs.OrderInfo, total float64) (int64, error) {
                    return 1, nil
                }
                
                // Mock buyShippingLabel
                svc.buyShippingLabelFunc = func(orderInfo *structs.OrderInfo) (*easypost.Shipment, structs.ShippingInfo, error) {
                    return &easypost.Shipment{
                            TrackingCode: "TRACK123",
                            SelectedRate: &easypost.Rate{
                                Carrier:        "USPS",
                                EstDeliveryDays: 2,
                            },
                        }, 
                        structs.ShippingInfo{
                            TrackingNumber: "TRACK123",
                            Carrier:        "USPS",
                            EstimatedDelivery: 2,
                        }, 
                        nil
                }
                
                // Mock insertShipping
                svc.insertShippingFunc = func(tx *sql.Tx, orderID int64, shipment *easypost.Shipment) error {
                    return nil
                }
                
                // Mock insertJob
                svc.insertJobFunc = func(tx *sql.Tx, orderID int64) (int64, error) {
                    return 1, nil
                }
            },
            mockDB: func(mock sqlmock.Sqlmock) {
                mock.ExpectBegin()
                // Mock the cart items query
                mock.ExpectQuery(`SELECT stl_url, quantity FROM cart_items WHERE browser_ssid = ?`).
                    WithArgs("ssid123").
                    WillReturnRows(sqlmock.NewRows([]string{"stl_url", "quantity"}))
                mock.ExpectCommit()
            },
            wantOrderInfo: structs.OrderInfo{
                PaymentIntentID: "pi_123",
                BrowserSSID:     "ssid123",
                Amount:         1000,
                PaymentStatus:   "requires_capture",
                Name:           "John Doe",
                Email:          "test@example.com",
                Address: structs.AddressInfo{
                    Line1:      "123 Main St",
                    City:       "Boston",
                    State:      "MA",
                    PostalCode: "02108",
                    Country:    "US",
                },
                ShippingInfo: structs.ShippingInfo{
                    TrackingNumber: "TRACK123",
                    Carrier:        "USPS",
                    EstimatedDelivery: 2,
                },
            },
            wantErr: false,
        },
        {
            desc: "failed to insert order",
            orderInfo: structs.OrderInfo{
                PaymentIntentID: "pi_123",
                BrowserSSID:     "ssid123",
            },
            setupMocks: func(svc *OrderServiceImpl) {
                svc.insertOrderFunc = func(tx *sql.Tx, orderInfo *structs.OrderInfo, total float64) (int64, error) {
                    return 0, errors.New("database error")
                }
            },
            mockDB: func(mock sqlmock.Sqlmock) {
                mock.ExpectBegin()
                mock.ExpectRollback()
            },
            wantErr:    true,
            wantErrMsg: "database error",
        },
        // Add more test cases as needed
    }

    for _, tt := range tests {
        t.Run(tt.desc, func(t *testing.T) {
            // Create mock DB
            db, mock, err := sqlmock.New()
            if err != nil {
                t.Fatalf("failed to mock db: %v", err)
            }
            defer db.Close()

            // Set up DB expectations
            tt.mockDB(mock)

            // Create service with mock EasyPost client
            mockClient := new(MockEasyPostClient)
            service := NewOrderService(db, mockClient).(*OrderServiceImpl)

            // Override the function implementations
            tt.setupMocks(service)

            // Call the method
            result, err := service.ProcessOrder(&tt.orderInfo)

            // Assertions
            if tt.wantErr {
                assert.Error(t, err)
                assert.Contains(t, err.Error(), tt.wantErrMsg)
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tt.wantOrderInfo, result)
            }

            // Verify all expectations were met
            if err := mock.ExpectationsWereMet(); err != nil {
                t.Errorf("there were unfulfilled expectations: %s", err)
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

func TestBuyShippingLabel(t *testing.T) {
	tests := []struct {
		desc         string
		orderInfo    structs.OrderInfo
		mockEasyPost func(*MockEasyPostClient)
		wantShipInfo structs.ShippingInfo
		wantErr      bool
		wantErrMsg   string
	}{
		{
			desc: "successfully create label",
			orderInfo: structs.OrderInfo{
				Name: "John Doe",
				Address: structs.AddressInfo{
					Line1:      "123 St",
					Line2:      "",
					City:       "City",
					State:      "ST",
					PostalCode: "12345",
					Country:    "US",
				},
			},
			mockEasyPost: func(m *MockEasyPostClient) {
				// Create expected rate that will be returned and used
				expectedRate := &easypost.Rate{
					ID:             "rate_1",
					Carrier:        "USPS",
					Service:        "Priority",
					Rate:           "10.00",
					EstDeliveryDays: 2,
				}

				// Mock CreateShipment
				m.On("CreateShipment", mock.AnythingOfType("*easypost.Shipment")).
					Return(&easypost.Shipment{
						ID:           "shp_123",
						TrackingCode: "TRACK123",
						Rates:        []*easypost.Rate{expectedRate},
					}, nil)

				// Mock LowestShipmentRate
				m.On("LowestShipmentRate", mock.AnythingOfType("*easypost.Shipment")).
					Return(expectedRate, nil)

				// Mock BuyShipment - use mock.MatchedBy to match the rate
				m.On("BuyShipment", "shp_123", mock.MatchedBy(func(rate *easypost.Rate) bool {
					return rate.ID == "rate_1"
				}), "").
					Return(&easypost.Shipment{
						ID:            "shp_123",
						TrackingCode: "TRACK123",
						SelectedRate:  expectedRate,
						PostageLabel: &easypost.PostageLabel{
							LabelURL: "https://example.com/label.pdf",
						},
					}, nil)
			},
			wantShipInfo: structs.ShippingInfo{
				TrackingNumber: "TRACK123",
				ToAddress: easypost.Address{
					Name:    "John Doe",
					Street1: "123 St",
					Street2: "",
					City:    "City",
					State:   "ST",
					Zip:     "12345",
					Country: "US",
				},
				Carrier:           "USPS",
				EstimatedDelivery: 2,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			mockClient := new(MockEasyPostClient)
			tt.mockEasyPost(mockClient)
			service := &OrderServiceImpl{ShipClient: mockClient}
			_, shipInfo, err := service.buyShippingLabel(&tt.orderInfo)
			
			if tt.wantErr {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErrMsg)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.wantShipInfo.TrackingNumber, shipInfo.TrackingNumber)
				assert.Equal(t, tt.wantShipInfo.Carrier, shipInfo.Carrier)
				assert.Equal(t, tt.wantShipInfo.EstimatedDelivery, shipInfo.EstimatedDelivery)
				assert.Equal(t, tt.wantShipInfo.ToAddress.Name, shipInfo.ToAddress.Name)
				assert.Equal(t, tt.wantShipInfo.ToAddress.Street1, shipInfo.ToAddress.Street1)
				assert.Equal(t, tt.wantShipInfo.ToAddress.City, shipInfo.ToAddress.City)
				assert.Equal(t, tt.wantShipInfo.ToAddress.State, shipInfo.ToAddress.State)
				assert.Equal(t, tt.wantShipInfo.ToAddress.Zip, shipInfo.ToAddress.Zip)
				assert.Equal(t, tt.wantShipInfo.ToAddress.Country, shipInfo.ToAddress.Country)
			}

			mockClient.AssertExpectations(t)
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
