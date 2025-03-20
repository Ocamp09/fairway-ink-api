package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB
var STRIPE_KEY string
var STL_S3_BUCKET string
var S3_REGION string

func ConnectDB() {
	var err error
	var exists bool
	STRIPE_KEY, exists = os.LookupEnv("STRIPE_KEY")
	if !exists {
		log.Fatal("Environment variable missing: STRIPE_KEY")
	}

	STL_S3_BUCKET, exists = os.LookupEnv("STL_S3_BUCKET")
	if !exists {
		log.Fatal("Environment variable missing: STL_S3_BUCKET")
	}

	S3_REGION, exists = os.LookupEnv("S3_REGION")
	if !exists {
		log.Fatal("Environment variable missing: S3_REGION")
	}

	DB_USER, exists := os.LookupEnv("DB_USER")
	if !exists {
		log.Fatal("Environment variable missing: DB_USER")
	}

	DB_PSWD, exists := os.LookupEnv("DB_PSWD")
	if !exists {
		log.Fatal("Environment variable missing: DB_PSWD")
	}

	DB_HOST, exists := os.LookupEnv("DB_HOST")
	if !exists {
		log.Fatal("Environment variable missing: DB_HOST")
	}

	DB_NAME, exists := os.LookupEnv("DB_NAME")
	if !exists {
		log.Fatal("Environment variable missing: DB_NAME")
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true",
		DB_USER,
		DB_PSWD,
		DB_HOST,
		DB_NAME,
	)

	log.Println("Connecting to database...")

	// Open the database connection
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}

	// Ping to test the actual connection
	if err = DB.Ping(); err != nil {
		log.Fatalf("Database unreachable: %v", err)
	}

	log.Println("Database connected successfully!") // Log success
}
