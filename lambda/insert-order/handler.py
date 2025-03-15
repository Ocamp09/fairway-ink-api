import json
import os
import pymysql
import boto3

secrets_client = boto3.client("secretsmanager", region_name="us-east-2")

def get_db_credentials():
    secret_response = secrets_client.get_secret_value(SecretId="fairway-ink-db-keys")
    secret = json.loads(secret_response["SecretString"])
    return secret

creds = get_db_credentials()

DB_HOST = creds["DB_HOST"]
DB_USER = creds["DB_USER"]
DB_PASSWORD = creds["DB_PASSWORD"]
DB_NAME = creds["DB_NAME"]

# Function to get a database connection
def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )


def insert_order(event, context):
    # Extract order details from event
    body = json.loads(event["body"]) if "body" in event else event
    order_details = body.get("order_details", {})

    # Ensure all necessary fields exist
    required_fields = ["purchaser_email", "purchaser_name", "browser_ssid", "stripe_ssid", "total", "payment_status"]
    if not all(field in order_details for field in required_fields):
        return {"statusCode": 400, "body": json.dumps({"error": "Missing required order fields"})}

    # get the variables
    purchaser_email = order_details["purchaser_email"]
    purchaser_name = order_details["purchaser_name"]
    browser_ssid = order_details["browser_ssid"]
    stripe_ssid = order_details["stripe_ssid"]
    total = order_details["total"]
    payment_status = order_details["payment_status"]

    conn = get_db_connection()
    with conn.cursor() as cursor:
        orders_insert = """INSERT INTO orders
                    (`purchaser_email`,`purchaser_name`,`browser_ssid`,
                    `stripe_ssid`,`total_amount`,`payment_status`)
                    VALUES (%s, %s, %s, %s, %s, %s)"""
        cursor.execute(orders_insert, (purchaser_email, purchaser_name, browser_ssid, stripe_ssid, total, payment_status))
        conn.commit()
    conn.close()

    return {"statusCode": 200, "body": json.dumps(body)}
