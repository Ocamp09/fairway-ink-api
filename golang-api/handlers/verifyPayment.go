package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/EasyPost/easypost-go/v4"
	"github.com/gin-gonic/gin"
	"github.com/ocamp09/fairway-ink-api/golang-api/config"
	"github.com/stripe/stripe-go/v75"
	"github.com/stripe/stripe-go/v75/checkout/session"

	"github.com/aws/aws-sdk-go/aws"
	aws_session "github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func VerifyPayment(c *gin.Context) {
	// Parse JSON request body
	var requestBody struct {
		StripeSSID  string `json:"stripe_ssid"`
		BrowserSSID string `json:"browser_ssid"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	stripeSSID := requestBody.StripeSSID
	browserSSID := requestBody.BrowserSSID

	// Retrieve the checkout session from Stripe
	stripe.Key = config.STRIPE_KEY
	session, err := session.Get(stripeSSID, nil)
	if err != nil {
		log.Printf("Stripe error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Stripe error: %v", err)})
		return
	}

	// Check if the payment was successful
	if session.PaymentStatus != "paid" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "Payment not successful"})
		return
	}

	// Safely get customer details
	var purchaserEmail, purchaserName string
	if session.CustomerDetails != nil {
		purchaserEmail = session.CustomerDetails.Email
		purchaserName = session.CustomerDetails.Name
	}

	// Get address from Stripe
	var address1, address2, city, state, zipcode, country string
	if session.CustomerDetails != nil && session.CustomerDetails.Address != nil {
		address := session.CustomerDetails.Address
		address1 = address.Line1
		address2 = address.Line2
		city = address.City
		state = address.State
		zipcode = address.PostalCode
		country = address.Country
	}

	total := float64(session.AmountTotal) / 100.0
	paymentStatus := session.PaymentStatus

	// Insert into orders table
	orderQuery := `
		INSERT INTO orders (
			purchaser_email, purchaser_name, address_1, address_2, city, state, zipcode, country,
			browser_ssid, stripe_ssid, total_amount, payment_status
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := config.DB.Exec(
		orderQuery,
		purchaserEmail, purchaserName, address1, address2, city, state, zipcode, country,
		browserSSID, stripeSSID, total, paymentStatus,
	)
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert order into database"})
		return
	}

	// Get the inserted order ID
	orderID, err := result.LastInsertId()
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve order ID"})
		return
	}

	// Generate shipping label
	ship_client := easypost.New(config.EASYPOST_KEY)

	toAddress := &easypost.Address{
		Name: purchaserName,
		Street1: address1,
		Street2: address2,
		City: city,
		State: state,
		Zip: zipcode,
		Country: country,
	}

	shipment, err := ship_client.CreateShipment(&easypost.Shipment{
		FromAddress: &config.SENDER_ADDRESS,
		ToAddress: toAddress,
	})

	print(shipment)

	// Insert into print_jobs table
	jobQuery := `INSERT INTO print_jobs (order_id, status) VALUES (?, ?)`
	jobResult, err := config.DB.Exec(jobQuery, orderID, "queued")
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert print job"})
		return
	}

	// Get the inserted job ID
	jobID, err := jobResult.LastInsertId()
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve job ID"})
		return
	}

	// Retrieve cart items for the browser_ssid
	cartQuery := `SELECT stl_url, quantity, template_type FROM cart_items WHERE browser_ssid = ?`
	rows, err := config.DB.Query(cartQuery, browserSSID)
	if err != nil {
		log.Printf("Database error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve cart items"})
		return
	}
	defer rows.Close()

	// Process each cart item
	for rows.Next() {
		var stlURL, templateType string
		var quantity int
		if err := rows.Scan(&stlURL, &quantity, &templateType); err != nil {
			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan cart item"})
			return
		}

		// Upload STL file to S3
		splitUrl := strings.Split(stlURL, "/")
		filename := splitUrl[len(splitUrl) - 1]

		localPath := "./output/" + browserSSID + "/" + filename
		if splitUrl[3] == "designs" {
			localPath = "../designs/" + filename
		}
		
		s3Key := fmt.Sprintf("%s/%s", browserSSID, filename)

		if err := uploadToS3(localPath, s3Key); err != nil {
			log.Printf("S3 upload error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload STL file to S3"})
			return
		}

		// Insert into stl_files table
		stlQuery := `INSERT INTO stl_files (browser_ssid, file_name, job_id, quantity) VALUES (?, ?, ?, ?)`
		if _, err := config.DB.Exec(stlQuery, browserSSID, filename, jobID, quantity); err != nil {
			log.Printf("Database error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert STL file record"})
			return
		}
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"order": gin.H{
			"id":    stripeSSID,
			"email": purchaserEmail,
			"total": total,
		},
	})
}

// uploadToS3 is a placeholder for your S3 upload logic
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