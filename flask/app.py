from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import img_to_svg as img_to_svg
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
CORS(app)

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[RotatingFileHandler("flask.log", maxBytes=10000, backupCount=3)],
)
logger = logging.getLogger(__name__)

# Configuration
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
OUTPUT_FOLDER = "./output/"
DESIGN_FOLDER = "../designs/"


def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


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
        logger.exception("Error processing upload: ", str(e))
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
