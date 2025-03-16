import json
import pymysql
import boto3

session = boto3.session.Session()
secrets_client = session.client(service_name="secretsmanager", region_name="us-east-2")
SECRETS_KEY = "fairway-ink-db-keys"
REGION_NAME = "us-east-2"

def get_db_credentials():
    secret_response = secrets_client.get_secret_value(SecretId=SECRETS_KEY)

    secret = json.loads(secret_response["SecretString"])
    return secret

creds = get_db_credentials()
if not creds:
    raise Exception("Failed to retrieve database credentials.")

DB_HOST = creds["host"]
DB_USER = creds["username"]
DB_PASSWORD = creds["password"]
DB_NAME = creds["dbName"]

# Function to get a database connection
def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=3306,
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
    if not conn:
        return {"statusCode": 500, "body": json.dumps({"error": "Database connection failed"})}

    try:
        with conn.cursor() as cursor:
            orders_insert = """INSERT INTO orders
                        (`purchaser_email`,`purchaser_name`,`browser_ssid`,
                        `stripe_ssid`,`total_amount`,`payment_status`)
                        VALUES (%s, %s, %s, %s, %s, %s)"""
            cursor.execute(orders_insert, (purchaser_email, purchaser_name, browser_ssid, stripe_ssid, total, payment_status))
            conn.commit()
    except pymysql.MySQLError as e:
        conn.rollback()
        return {"statusCode": 505, "body": json.dumps({"error": "Failed to insert order into database"})}
    finally:
        conn.close()

    return {"statusCode": 200, "body": json.dumps(body)}
