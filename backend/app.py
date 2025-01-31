from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS  # Import CORS
import os
import subprocess
from werkzeug.utils import secure_filename
import pathlib
import sys

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/output/stl/<filename>")
def output_file(filename):
    return send_from_directory("output/stl", filename)

@app.route("/upload", methods=["POST"])
def upload_file():
    # Check if a file was uploaded
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]

    size = 15
    if "size" in request.form:
        size = float(request.form.get("size", 42.67)) 

    # Validate file type
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid file type"}), 400

    # Validate file size
    if len(file.read()) > MAX_FILE_SIZE:
        return jsonify({"success": False, "error": "File size exceeds 5MB"}), 400
    file.seek(0)  # Reset file pointer after reading

    # Save the file securely
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    dir_path = pathlib.Path.cwd()
    script_path = dir_path / "img_to_gcode.py"

    try:
        # convert file to gcode with script
        run_path = "./uploads/" + filename
        print(run_path)
        result = subprocess.run(
            [
                sys.executable, 
                str(script_path), 
                run_path,
                str(size)
            ],
            capture_output=True,
            text=True
        )

        # Check if the script ran successfully
        if result.returncode != 0:
            return jsonify({"success": False, "error": result.stderr + "SCRIPT FAILED"}), 501

        # Return the STL file URL
        stl_name = filename.split(".")[0] + ".stl"
        stl_url = f"http://localhost:5000/output/stl/{stl_name}"
        return jsonify({"success": True, "stlUrl": stl_url})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 502

if __name__ == "__main__":
    app.run(debug=True)