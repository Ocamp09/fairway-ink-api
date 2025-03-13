from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS  # Import CORS
import os
import subprocess
from werkzeug.utils import secure_filename
import img_to_svg as img_to_svg
import platform
import json
import stripe

# stripe secret API key (test)
stripe.api_key = 'sk_test_51Qs6WuACPDsvvNfxayxO5fGAKEh7GSTbYPooWZ6qwxfe1S6st8SzE5utVWlzShFWrVoSiLNEvy1n30ZG7sWAJPNd00TSAreBRT'

app = Flask(__name__)
CORS(app)

# Configuration
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
OUTPUT_FOLDER = "./output/"

CUSTOM_PRICE = 799
SOLID_PRICE = 599
TEXT_PRICE = 599

cart_items = {}

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


@app.route("/generate", methods=["POST"])
def generate_gcode():
    scale = request.form.get("scale", 1)  

    if not request.headers["ssid"]:
        return jsonify({"success": False, "error": "No session ID"}), 401

    if 'svg' not in request.files:
        return jsonify({"success": False, "error": "No SVG file provided"}), 400

    session_id = request.headers["ssid"]
    svg_file = request.files['svg']
    filename = secure_filename(svg_file.filename)

    # remove the previous STL file if not saved to cart
    if request.headers["stlKey"]:
        key = request.headers["stlKey"]
        if int(key) > 0:
            stripped = filename.find("g")
            prevKey = int(key) - 1
            prevFile = str(prevKey) + filename[stripped::].replace("svg", "stl")
            print(os.path.exists("./output/" + session_id + "/" + prevFile), "./output/" + session_id + "/" + prevFile)
            print(cart_items)
            # if os.path.exists(prevFile) and prevFile not in cart_items[session_id]:
            #     os.remove(OUTPUT_FOLDER + session_id + "/" + prevFile)

    os.makedirs("./output/" + session_id, exist_ok=True)

    output_svg_path = os.path.join(OUTPUT_FOLDER + session_id, filename)
    try:
        svg_file.save(output_svg_path)
        # blender_path = r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"
        blender_path = r"/home/ec2-user/blender-4.3.2-linux-x64/blender"
        if platform.system() == "Darwin":
            blender_path = r"/Applications/Blender.app/Contents/MacOS/blender"

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
        # stl_url = f"http://localhost:5001/output/{session_id}/{stl_name}"
        stl_url = f"https://api.fairway-ink.com/output/{session_id}/{stl_name}"
        return jsonify({"success": True, "stlUrl": stl_url})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 502
    

@app.route("/cart", methods=["POST"])
def add_to_cart():
    session_id = request.headers["ssid"]
    filename = request.form.get("filename")

    if session_id not in cart_items:
        cart_items[session_id] = set()

    cart_items[session_id].add(filename)
    print(cart_items)

    return jsonify({"success": True})


@app.route('/create-payment-intent', methods=['POST'])
def create_payment():
    cart = request.form.get("cart", 1)  
    amount = calculate_order_amount(json.loads(cart))

    if amount <= 0:
        return jsonify({"success": False, "error": str(e) + " invalid amount"}), 502
    
    try:
        cart = request.form.get("cart", 1)  
        amount = calculate_order_amount(json.loads(cart))

        if amount <= 0:
            return jsonify({"success": False, "error": str(e) + " invalid amount"}), 502
    
        # Create a PaymentIntent with the order amount and currency
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            payment_method_types=['card']
        )

        return jsonify({
            'clientSecret': intent['client_secret']
        })
    except Exception as e:
        return jsonify(error="ERROR"), 403
    

if __name__ == "__main__":
    app.run(debug=True, port=5001)
