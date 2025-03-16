import boto3
import json

S3_REGION = "us-east-2"
lambda_client = boto3.client('lambda', region_name=S3_REGION)

order_details = {
    "purchaser_email": "test.com", 
    "purchaser_name": "test", 
    "browser_ssid": "12345",
    "stripe_ssid": "12345",
    "total": 10, 
    "payment_status": 'paid'
}

response = lambda_client.invoke(
    FunctionName='handle-order-dev-insert-order',
    InvocationType='RequestResponse',  # Use 'Event' for async execution
    Payload=json.dumps({"order_details": order_details})  # Replace with actual payload
)

print(response)
