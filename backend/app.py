from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS  # Import CORS
import os
import subprocess
from werkzeug.utils import secure_filename
import img_to_svg
import platform


app = Flask(__name__)
CORS(app)

# Configuration
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename):
    """Check if the file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/output/stl/<filename>")
def output_stl(filename):
    return send_from_directory("output/stl", filename)


@app.route("/output/svg/<filename>")
def output_svg(filename):
    return send_from_directory("output/svg", filename)

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
    if method == "multi":
        method = img_to_svg.PrintType.MULTI
    elif method == "text":
        method = img_to_svg.PrintType.TEXT
    else:
        method = img_to_svg.PrintType.SOLID

    svg_data = img_to_svg.image_to_svg(file, method=method)
    return jsonify({"success": True, "svgData": svg_data})


@app.route("/generate", methods=["POST"])
def generate_gcode():
    scale = request.form.get("scale", 1)  

    if 'svg' not in request.files:
        return jsonify({"success": False, "error": "No SVG file provided"}), 400

    svg_file = request.files['svg']
    filename = secure_filename(svg_file.filename)
    output_svg_path = os.path.join("./output/svg", filename)
    try:
        svg_file.save(output_svg_path)

        blender_path = r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"
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
        os.remove("./output/svg/" + filename)
        stl_name = filename.split(".")[0] + ".stl"  
        stl_url = f"http://localhost:5001/output/stl/{stl_name}"
        return jsonify({"success": True, "stlUrl": stl_url})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 502
    

if __name__ == "__main__":
    app.run(debug=True, port=5001)