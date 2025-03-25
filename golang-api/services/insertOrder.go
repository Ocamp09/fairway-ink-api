package services

import (
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
)

func ProcessOrder(orderInfo *structs.OrderInfo) (structs.OrderInfo, error) {
	// Extract order details
	total := float64(orderInfo.Amount) / 100.0
	paymentStatus := orderInfo.PaymentStatus

	db, err := config.ConnectDB()
	if err != nil {
		return *orderInfo, fmt.Errorf("Failed to get DB connection: %w", err)
	}

	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to begin db transaction: %w", err)
	}

	defer func() {
		if err != nil {
			tx.Rollback()
		} else {

		}
	}()

	// Insert into `orders` table
	orderQuery := `
		INSERT INTO orders (
			purchaser_email, purchaser_name, address_1, address_2, city, state, zipcode, country,
			browser_ssid, stripe_ssid, total_amount, payment_status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := db.Exec(
		orderQuery,
		orderInfo.Email, orderInfo.Name, orderInfo.Address.Line1, orderInfo.Address.Line2, orderInfo.Address.City, orderInfo.Address.State, orderInfo.Address.PostalCode, orderInfo.Address.Country,
		orderInfo.BrowserSSID, orderInfo.PaymentIntentID, total, paymentStatus,
	)
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to insert order into database: %w", err)
	}

	// Get inserted order ID
	orderID, err := result.LastInsertId()
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to retrieve order ID: %w", err)
	}

	// Generate shipping label
	shipClient := easypost.New(config.EASYPOST_KEY)
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
	shipment, err := shipClient.CreateShipment(&easypost.Shipment{FromAddress: &config.SENDER_ADDRESS, ToAddress: toAddress, Parcel: parcel})
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to create shipping label: %w", err)
	}

	lowestShipping, err := shipClient.LowestShipmentRate(shipment)
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to get lowest shipping rate: %w", err)
	}

	shipment, err = shipClient.BuyShipment(shipment.ID, &easypost.Rate{ID: lowestShipping.ID}, "")
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to buy shipping label: %w", err)
	}

	shipInfo := structs.ShippingInfo{
		TrackingNumber: shipment.TrackingCode,
		ToAddress: *toAddress,
		Carrier:  shipment.SelectedRate.Carrier,
		EstimatedDelivery: shipment.SelectedRate.EstDeliveryDays,
	}

	orderInfo.ShippingInfo = shipInfo

	// Insert into `shipping` table
	shipQuery := `INSERT INTO shipping (order_id, easypost_id, carrier, service, tracking_number, ship_rate, shipping_label_url) VALUES(?, ?, ?, ?, ?, ?, ?)`
	_, err = db.Exec(shipQuery, orderID, shipment.ID, shipment.SelectedRate.Carrier, shipment.SelectedRate.Service, shipment.TrackingCode, shipment.SelectedRate.Rate, shipment.PostageLabel.LabelURL)
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to insert shipping info: %w", err)
	}

	// Insert print job
	jobQuery := `INSERT INTO print_jobs (order_id, status) VALUES (?, ?)`
	jobResult, err := db.Exec(jobQuery, orderID, "queued")
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to insert print job: %w", err)
	}

	// Get the inserted job ID
	jobID, err := jobResult.LastInsertId()
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to retrieve job ID: %w", err)
	}

	// Upload STL files and associate with job
	cartQuery := `SELECT stl_url, quantity FROM cart_items WHERE browser_ssid = ?`
	rows, err := db.Query(cartQuery, orderInfo.BrowserSSID)
	if err != nil {
		return *orderInfo, fmt.Errorf("failed to retrieve cart items: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var stlURL string
		var quantity int
		if err := rows.Scan(&stlURL, &quantity); err != nil {
			return *orderInfo, fmt.Errorf("failed to scan cart item: %w", err)
		}

		// Upload STL file to S3
		splitUrl := strings.Split(stlURL, "/")
		filename := splitUrl[len(splitUrl)-1]
		s3Key := fmt.Sprintf("%s/%s", orderInfo.BrowserSSID, filename)
		dir := "./output/" + orderInfo.BrowserSSID + "/"

		if strings.Contains(filename, "design") {
			dir = "../designs/"
		}

		if err := uploadToS3(dir + filename, s3Key); err != nil {
			return *orderInfo, fmt.Errorf("failed to upload STL file: %w", err)
		}

		// Insert into `stl_files` table
		stlQuery := `INSERT INTO stl_files (browser_ssid, file_name, job_id, quantity) VALUES (?, ?, ?, ?)`
		if _, err := db.Exec(stlQuery, orderInfo.BrowserSSID, filename, jobID, quantity); err != nil {
			return *orderInfo, fmt.Errorf("failed to insert STL file record: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return *orderInfo, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return *orderInfo, nil
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
