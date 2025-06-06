package services

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/EasyPost/easypost-go/v4"
	"github.com/aws/aws-sdk-go/aws"
	aws_session "github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/ocamp09/fairway-ink-api/golang-api/structs"
	"github.com/ocamp09/fairway-ink-api/golang-api/utils"
)

type OrderServiceImpl struct {
	DB *sql.DB
	ShipClient EasyPostClient

	insertOrderFunc      func(tx *sql.Tx, orderInfo *structs.OrderInfo, total float64) (int64, error)
	buyShippingLabelFunc func(orderInfo *structs.OrderInfo) (*easypost.Shipment, structs.ShippingInfo, error)
	insertShippingFunc   func(tx *sql.Tx, orderID int64, shipment *easypost.Shipment) error
	insertJobFunc        func(tx *sql.Tx, orderID int64) (int64, error)
}

func NewOrderService(db *sql.DB, shipClient EasyPostClient) OrderService {
	svc := &OrderServiceImpl{DB: db, ShipClient: shipClient}
	svc.insertOrderFunc = svc.insertOrder
	svc.buyShippingLabelFunc = svc.buyShippingLabel
	svc.insertShippingFunc = svc.insertShipping
	svc.insertJobFunc = svc.insertJob
	return svc
}

func (os *OrderServiceImpl) ProcessOrder(orderInfo *structs.OrderInfo) (structs.OrderInfo, error) {
	// Extract order details
	total := float64(orderInfo.Amount) / 100.0

	tx, err := os.DB.Begin()
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer tx.Rollback()

	orderID, err := os.insertOrderFunc(tx, orderInfo, total)
	if err != nil {
		return *orderInfo, err
	}

	shipment, shipInfo, err := os.buyShippingLabelFunc(orderInfo)
	if err != nil {
		return *orderInfo, err
	}

	orderInfo.ShippingInfo = shipInfo

	err = os.insertShippingFunc(tx, orderID, shipment)
	if err != nil {
		return *orderInfo, err
	}
	
	jobID, err := os.insertJobFunc(tx, orderID)
	if err != nil {
		return *orderInfo, err
	}

	// Upload STL files and associate with job
	cartQuery := `SELECT stl_url, quantity FROM cart_items WHERE browser_ssid = ?`
	rows, err := tx.Query(cartQuery, orderInfo.BrowserSSID)
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to retrieve cart items: %w", err)
	}
	defer rows.Close()

	var cartItems []structs.CartItem

	// read the rows into our cart items slice
	for rows.Next() {
		var item structs.CartItem
		if err := rows.Scan(&item.StlURL, &item.Quantity); err != nil {
			return *orderInfo, fmt.Errorf("failed to scan cart item: %w", err)
		}
		cartItems = append(cartItems, item)
	}
	rows.Close() 

	// loop through cart items and upload them
	for _, item := range cartItems {
		filename := getFilenameFromURL(item.StlURL)
		dir, err := getOutputDir(orderInfo.BrowserSSID, filename)
		if err != nil {
			return *orderInfo, err
		}

		s3Key := fmt.Sprintf("%s/%s", orderInfo.BrowserSSID, filename)

		if err := uploadToS3(dir + filename, s3Key); err != nil {
			return *orderInfo, fmt.Errorf("failed to upload STL file: %w", err)
		}

		// Insert into `stl_files` table
		stlQuery := `INSERT INTO stl_files (browser_ssid, file_name, job_id, quantity) VALUES (?, ?, ?, ?)`
		if _, err := tx.Exec(stlQuery, orderInfo.BrowserSSID, filename, jobID, item.Quantity); err != nil {
			return *orderInfo, fmt.Errorf("failed to insert STL file record: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return *orderInfo, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return *orderInfo, nil
}

func (os *OrderServiceImpl) insertOrder(tx *sql.Tx, orderInfo *structs.OrderInfo, total float64) (int64, error) {
	// Insert into `orders` table
	orderQuery := `
		INSERT INTO orders (
			purchaser_email, purchaser_name, address_1, address_2, city, state, zipcode, country,
			browser_ssid, stripe_ssid, total_amount, payment_status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := tx.Exec(
		orderQuery,
		orderInfo.Email, orderInfo.Name, orderInfo.Address.Line1, orderInfo.Address.Line2, orderInfo.Address.City, orderInfo.Address.State, orderInfo.Address.PostalCode, orderInfo.Address.Country,
		orderInfo.BrowserSSID, orderInfo.PaymentIntentID, total, orderInfo.PaymentStatus,
	)
	if err != nil {
		return -1, fmt.Errorf("failed to insert order into database: %w", err)
	}

	// Get inserted order ID
	orderID, err := result.LastInsertId()
	if err != nil {
		return -1, fmt.Errorf("failed to retrieve order ID: %w", err)
	}

	return orderID, nil
}

func (os *OrderServiceImpl) buyShippingLabel(orderInfo *structs.OrderInfo) (*easypost.Shipment, structs.ShippingInfo, error) {
	// Generate shipping label
	toAddress := &easypost.Address{
		Name:    orderInfo.Name,
		Street1: orderInfo.Address.Line1,
		Street2: orderInfo.Address.Line2,
		City:    orderInfo.Address.City,
		State:   orderInfo.Address.State,
		Zip:     orderInfo.Address.PostalCode,
		Country: orderInfo.Address.Country,
	}

	parcel := &easypost.Parcel{Length: 8, Width: 7, Height: 1.25, Weight: 15}
	shipment, err := os.ShipClient.CreateShipment(&easypost.Shipment{FromAddress: &config.SENDER_ADDRESS, ToAddress: toAddress, Parcel: parcel})
	if err != nil {
		return nil, structs.ShippingInfo{}, fmt.Errorf("failed to create shipping label: %w", err)
	}

	lowestShipping, err := os.ShipClient.LowestShipmentRate(shipment)
	if err != nil {
		return nil, structs.ShippingInfo{}, fmt.Errorf("failed to get lowest shipping rate: %w", err)
	}

	shipment, err = os.ShipClient.BuyShipment(shipment.ID, &easypost.Rate{ID: lowestShipping.ID}, "")
	if err != nil {
		return nil, structs.ShippingInfo{}, fmt.Errorf("failed to buy shipping label: %w", err)
	}

	shipInfo := structs.ShippingInfo{
		TrackingNumber: shipment.TrackingCode,
		ToAddress: *toAddress,
		Carrier:  shipment.SelectedRate.Carrier,
		EstimatedDelivery: shipment.SelectedRate.EstDeliveryDays,
	}

	return shipment, shipInfo, nil
}

func (os *OrderServiceImpl) insertShipping(tx *sql.Tx, orderID int64, shipment *easypost.Shipment) (error) {
	// Insert into `shipping` table
	shipQuery := `INSERT INTO shipping (order_id, easypost_id, carrier, service, tracking_number, ship_rate, shipping_label_url) VALUES(?, ?, ?, ?, ?, ?, ?)`
	_, err := tx.Exec(shipQuery, orderID, shipment.ID, shipment.SelectedRate.Carrier, shipment.SelectedRate.Service, shipment.TrackingCode, shipment.SelectedRate.Rate, shipment.PostageLabel.LabelURL)
	if err != nil {
		return fmt.Errorf("failed to insert shipping info: %w", err)
	}

	return nil
}

func (os *OrderServiceImpl) insertJob(tx *sql.Tx, orderID int64) (int64, error) {
	// Insert print job
	jobQuery := `INSERT INTO print_jobs (order_id, status) VALUES (?, ?)`
	jobResult, err := tx.Exec(jobQuery, orderID, "queued")
	if err != nil {
		return -1, fmt.Errorf("failed to insert print job: %w", err)
	}

	// Get the inserted job ID
	jobID, err := jobResult.LastInsertId()
	if err != nil {
		return -1, fmt.Errorf("failed to retrieve job ID: %w", err)
	}

	return jobID, nil
}

func uploadToS3(localPath, s3Key string) error {
	// Initialize AWS session
	sess, err := aws_session.NewSession(&aws.Config{
		Region:      aws.String(config.S3_REGION),
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %v", err)
	}

	// Create S3 service client
	s3Client := s3.New(sess)

	// Open the file
	file, err := os.Open(localPath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Upload the file to S3
	_, err = s3Client.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(config.STL_S3_BUCKET),
		Key:    aws.String(s3Key),
		Body:   file,
	})
	if err != nil {
		return fmt.Errorf("failed to upload file to S3: %v", err)
	}

	log.Printf("Successfully uploaded %s to S3 with key %s\n", localPath, s3Key)
	return nil
}

func getFilenameFromURL(url string) string {
	parts := strings.Split(url, "/")
	return parts[len(parts)-1]
}

func getOutputDir(ssid string, filename string) (string, error) {
	// Validate filename & ssid
	if !utils.SafeFilepathElement(filename) || !utils.SafeFilepathElement(ssid){
		return "", fmt.Errorf("invalid filename or ssid")
	}

	dir := "./output/" + ssid + "/"
	if strings.Contains(filename, "design") {
		dir = "../designs/"
	}
	return dir, nil
}