package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"slices"

	_ "github.com/go-sql-driver/mysql"

	"github.com/EasyPost/easypost-go/v4"
)

var (
	STRIPE_KEY string
	EASYPOST_KEY string
	STL_S3_BUCKET string
	S3_REGION string
	SENDER_ADDRESS easypost.Address
	DB_USER string
	DB_PSWD string
	DB_HOST string
	DB_PORT string
	DB_NAME string
	APP_ENV string
	PORT string
)

func LoadEnv() {
	var exists bool
	APP_ENV, exists = os.LookupEnv("APP_ENV")
	if !exists {
		APP_ENV = "dev"
	}

	ALLOWED_ENV := []string{"prod", "dev", "designs"}
	if !slices.Contains(ALLOWED_ENV, APP_ENV) {
		APP_ENV = "dev"
	}

	STRIPE_KEY, exists = os.LookupEnv("STRIPE_KEY")
	if !exists {
		log.Fatal("Environment variable missing: STRIPE_KEY")
	}

	EASYPOST_KEY, exists = os.LookupEnv("EASYPOST_KEY")
	if !exists {
		log.Fatal("Environment variable missing: EASYPOST_KEY")
	}

	STL_S3_BUCKET, exists = os.LookupEnv("STL_S3_BUCKET")
	if !exists {
		log.Fatal("Environment variable missing: STL_S3_BUCKET")
	}

	S3_REGION, exists = os.LookupEnv("S3_REGION")
	if !exists {
		log.Fatal("Environment variable missing: S3_REGION")
	}

	PORT, exists = os.LookupEnv("PORT")
	if !exists {
		PORT="5000"
	}

	SENDER_ADDRESS = easypost.Address{
		Company: "Fairway Ink",
		Street1: "6729 Old Stagecoach Road",
		City: "Frazeysburg",
		State: "OH",
		Zip: "43822",
	}

	DB_USER, exists = os.LookupEnv("DB_USER")
	if !exists {
		log.Fatal("Environment variable missing: DB_USER")
	}

	DB_PSWD, exists = os.LookupEnv("DB_PSWD")
	if !exists {
		log.Fatal("Environment variable missing: DB_PSWD")
	}

	DB_HOST, exists = os.LookupEnv("DB_HOST")
	if !exists {
		log.Fatal("Environment variable missing: DB_HOST")
	}
	DB_PORT, exists = os.LookupEnv("DB_PORT")
	if !exists {
		DB_PORT = "3306"
	}

	DB_NAME, exists = os.LookupEnv("DB_NAME")
	if !exists {
		log.Fatal("Environment variable missing: DB_NAME")
	}
}

func ConnectDB() (*sql.DB, error) {
	var err error

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		DB_USER,
		DB_PSWD,
		DB_HOST,
		DB_PORT,
		DB_NAME,
	)

	// Open the database connection
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %v", err)
	}

	return db, nil
}
