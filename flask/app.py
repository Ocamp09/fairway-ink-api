from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS  # Import CORS
import os
import subprocess
from werkzeug.utils import secure_filename
import img_to_svg as img_to_svg
import platform
import json
import stripe
import platform
import logging
from logging.handlers import RotatingFileHandler
import boto3
import pymysql

# stripe secret API key (test)
stripe.api_key = 'sk_test_51Qs6WuACPDsvvNfxayxO5fGAKEh7GSTbYPooWZ6qwxfe1S6st8SzE5utVWlzShFWrVoSiLNEvy1n30ZG7sWAJPNd00TSAreBRT'

app = Flask(__name__)
CORS(app)

# logging config
app.logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3)
handler.setFormatter(formatter)
app.logger.addHandler(handler)

# Configuration
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
OUTPUT_FOLDER = "./output/"

CUSTOM_PRICE = 799
SOLID_PRICE = 599
TEXT_PRICE = 599

cart_items = {}

STL_S3_BUCKET = "fairway-ink-stl"
S3_REGION = "us-east-2"

s3_client = boto3.client("s3", region_name=S3_REGION)

def get_env(var):
    val = os.getenv(var)
    if val is None:
        raise EnvironmentError(f"missing environment variables: {var}")
    return val


# Load MySQL connection details from environment variables (for security)
DB_HOST = get_env("DB_HOST")
DB_USER = get_env("DB_USER")
DB_PASSWORD = get_env("DB_PASSWORD")
DB_NAME = get_env("DB_NAME")


# Function to get a database connection
def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

def calculate_order_amount(items):
    price = 0
    for item in items:
        match item['type']:
            case "solid":
                price += SOLID_PRICE
            case "text": 
                price += TEXT_PRICE
            case "custom":
                price += CUSTOM_PRICE
            case _:
                return -1
    return price


def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/output/<ssid>/<filename>")
def output_stl(ssid, filename):
    return send_from_directory(f"output/{ssid}", filename)


@app.route("/upload", methods=["POST"])
def upload_file():
    try:
        # Check if a file was uploaded
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        file = request.files["file"]

        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "Invalid file type"}), 400

        # Validate file size
        if len(file.read()) > MAX_FILE_SIZE:
            return jsonify({"success": False, "error": "File size exceeds 5MB"}), 400
        file.seek(0)  # Reset file pointer after reading

        method = request.form.get("method", img_to_svg.PrintType.SOLID)  
        if method == "custom":
            method = img_to_svg.PrintType.CUSTOM
        elif method == "text":
            method = img_to_svg.PrintType.TEXT
        else:
            method = img_to_svg.PrintType.SOLID

        svg_data = img_to_svg.image_to_svg(file, method=method)
        return jsonify({"success": True, "svgData": svg_data})
    except Exception as e:
        app.logger.exception("Error processing upload: ", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/generate", methods=["POST"])
def generate_gcode():
    try: 
        scale = request.form.get("scale", 1)  

        if not request.headers["ssid"]:
            return jsonify({"success": False, "error": "No session ID"}), 403

        if 'svg' not in request.files:
            return jsonify({"success": False, "error": "No SVG file provided"}), 401

        session_id = request.headers["ssid"]
        svg_file = request.files['svg']
        filename = secure_filename(svg_file.filename)

        if session_id not in cart_items:
            cart_items[session_id] = []

        # remove the previous STL file if not saved to cart
        stl_key = request.form.get("stlKey", 0)
        if stl_key:
            if int(stl_key) > 0:
                stripped = filename.find("g")
                prevKey = int(stl_key) - 1
                prevFile = str(prevKey) + filename[stripped::].replace("svg", "stl")
                file_path = "./output/" + session_id + "/" + prevFile
                if os.path.exists(file_path) and session_id in cart_items.keys():
                    file_url = f"https://api.fairway-ink.com/output/{session_id}/{prevFile}"

                    if platform.system() != "Linux":
                        file_url = f"http://localhost:5001/output/{session_id}/{prevFile}"

                    if file_url not in cart_items[session_id]:
                        os.remove(OUTPUT_FOLDER + session_id + "/" + prevFile)

        os.makedirs("./output/" + session_id, exist_ok=True)

        output_svg_path = os.path.join(OUTPUT_FOLDER + session_id, filename)
        try:
            svg_file.save(output_svg_path)
            blender_path = r"/home/ec2-user/blender-4.3.2-linux-x64/blender"
            if platform.system() == "Darwin":
                blender_path = r"/Applications/Blender.app/Contents/MacOS/blender"
            elif platform.system() == "Windows":
                blender_path = r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"

            blender_command = [
                blender_path,
                "--background",
                "--python",
                "./blender_v1.py",
                output_svg_path,
                str(scale)
            ]

            subprocess.run(blender_command, capture_output=True, text=True)

            os.remove(OUTPUT_FOLDER + session_id + "/" + filename)
            stl_name = filename.split(".")[0] + ".stl"  
            stl_url = f"https://api.fairway-ink.com/output/{session_id}/{stl_name}"

            # use local host if the platform is not the ec2 instance
            if platform.system() != "Linux":
                stl_url = f"http://localhost:5001/output/{session_id}/{stl_name}"

            return jsonify({"success": True, "stlUrl": stl_url})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 502
    except Exception as e:
        app.logger.exception("Error generating STL", str(e))
        return jsonify({"success": False, "error": str(e)}), 500
    

@app.route("/cart", methods=["POST"])
def add_to_cart():
    try:
        session_id = request.headers["ssid"]
        filename = request.form.get("filename")

        if session_id not in cart_items:
            cart_items[session_id] = []

        cart_items[session_id].append(filename)

        return jsonify({"success": True})
    except Exception as e:
        app.logger.exception("Error adding to cart", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        cart = request.form.get("cart", -1)  
        if cart == -1:
            return jsonify({"success": False, "error": "No cart provided"}), 501

        cart = json.loads(cart)  # Parse cart items from the frontend
        if not cart:
            return jsonify({"success": False, "error": "Cart is empty"}), 502

        # Prepare line items for Stripe Checkout session
        line_items = []
        total_amount = 0
        
        for item in cart:
            price = 0
            if item["type"] == "solid":
                price = SOLID_PRICE
            elif item["type"] == "text":
                price = TEXT_PRICE
            elif item["type"] == "custom":
                price = CUSTOM_PRICE
            else:
                return jsonify({"success": False, "error": "Invalid item type in cart"}), 502
            price_data = {
                "currency": "usd",
                "product_data": {
                    "name": "Custom golf ball stencil - type: {0}, qty: {1}".format(item["type"], item["quantity"])
                },
                "unit_amount": price,  # Convert to cents
            }
            line_items.append({
                "price_data": price_data,
                "quantity": item["quantity"],
            })
            total_amount += price * item["quantity"]

        if total_amount <= 0:
            return jsonify({"success": False, "error": "Invalid order amount"}), 502

        domain = "https://www.fairway-ink.com"

        if platform.system() != "Linux":
            domain = "http://localhost:5173"

        # Create a Checkout Session with line items and success/cancel URLs
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{domain}/success?session_id={{CHECKOUT_SESSION_ID}}", 
            cancel_url=f"{domain}", 
        )

        return jsonify({
            'id': session.id
        })
    except Exception as e:
        app.logger.exception("Error creating checkout session: ", str(e))
        return jsonify({"error": "ERROR"}), 500


@app.route('/verify-payment', methods=['POST'])
def verify_payment():
    swipe_ssid = request.json.get('swipe_ssid') 
    browser_ssid = request.json.get('browser_ssid') 

    try:
        # Retrieve the checkout session from Stripe
        session = stripe.checkout.Session.retrieve(swipe_ssid)
        
        # Check if the payment was successful
        if session.payment_status == 'paid':
        # Fetch order details and return to the frontend
            purchaser_email = session.customer_details.email
            purchaser_name = session.customer_details.name
            stripe_ssid = session.id
            total = session.amount_total / 100
            payment_status = session.payment_status
            
            order = {
                "id": stripe_ssid,
                "email": purchaser_email,
                "total": total, 
            }
            print(browser_ssid, cart_items)
            if browser_ssid in cart_items:
                for file in cart_items[browser_ssid]:
                    local_path = "./" + "/".join(file.split("/")[3::])
                    filename = file.split("/")[-1]

                    if os.path.exists(local_path):
                        s3_key = f"{browser_ssid}/{filename}"  # S3 folder per session
                        s3_client.upload_file(local_path, STL_S3_BUCKET, s3_key)
                        print(f"Uploaded {filename} to S3 bucket {STL_S3_BUCKET}")
            
            conn = get_db_connection()
            with conn.cursor() as cursor:
                orders_insert = """INSERT INTO orders
                            (`purchaser_email`,`purchaser_name`,`browser_ssid`,
                            `stripe_ssid`,`total_amount`,`payment_status`)
                            VALUES (%s, %s, %s, %s, %s, %s)"""
                cursor.execute(orders_insert, (purchaser_email, purchaser_name, browser_ssid, stripe_ssid, total, payment_status))
                conn.commit()
            conn.close()

            return jsonify({"success": True, "order": order})
        else:
            return jsonify({"success": False, "message": "Payment not successful"})

    except stripe.error.StripeError as e:
        # Handle Stripe API errors
        return jsonify({"success": False, "message": str(e)})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
