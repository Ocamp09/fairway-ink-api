import sys
from svgtrace import trace
from PIL import Image
import tempfile
import os
import subprocess

def image_to_svg(image_path, output_svg_path, max_size_mm=20):
    image = Image.open(image_path)

    # Convert mm to pixels (assuming 300 dpi, adjust if needed)
    dpi = 300  # Adjust DPI as needed
    max_size_px = int(max_size_mm * dpi / 25.4)  # 25.4 mm per inch

    # Resize the image while maintaining aspect ratio
    width, height = image.size
    if width > max_size_px or height > max_size_px:
        if width > height:
            new_width = max_size_px
            new_height = int(height * (max_size_px / width))
        else:
            new_height = max_size_px
            new_width = int(width * (max_size_px / height))
        image = image.resize((new_width, new_height), Image.LANCZOS)

    # Save the image to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        temp_image_path = temp_file.name
        image.save(temp_image_path)

    # create a bitmap and convert to SVG
    svg_data = trace(temp_image_path, blackAndWhite=True)
    with open(output_svg_path, "w") as svg_file:
        svg_file.write(svg_data)

    os.remove(temp_image_path)
    pass


# takes the SVG and generates a model based off of it
def run_blender(svg_path):
    # local path to Blender executable
    blender_path = r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"
    print("SVG PATH: ", svg_path)
    blender_command = [
        blender_path,
        "--background",
        "--python",
        "./blender_v1.py",
        svg_path
    ]

    subprocess.run(blender_command)
    pass


# slice the STL into CODE
def slice_stl(stl_path, gcode_path):
    # local path to PrusaSlicer executable
    slicer_path = r"C:\Program Files\Prusa3D\PrusaSlicer\prusa-slicer.exe"

    # path to the printer config file
    config_file = "./config.ini"

    slice_command = [
        slicer_path,
        "--load", config_file,
        "--slice",
        "--export-gcode",
        "--output",
        gcode_path,
        stl_path  # Use the provided STL file path
    ]

    # Run the command
    try:
        subprocess.run(slice_command, check=True)
        print("Slicing completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error during slicing: {e}")
    except FileNotFoundError:
        print("PrusaSlicer executable not found. Please check the path.")
    pass


def main(image_path):
    filename = image_path.split("/")[2].split(".")[0]
    svg_path = "./output/" + filename + ".svg"
    stl_path = "./output/" + filename + ".stl"
    gcode_path = "./output/gcode/" + filename + ".gcode"
    try:
        # Step 1: Convert image to SVG
        # svg_path = os.path.join(os.path.dirname(image_path), "output.svg")
        image_to_svg(image_path, svg_path)

        # Step 3: Generate STL from G-code
        run_blender(svg_path)

        # Step 2: Generate G-code
        # stl_path = os.path.join(os.path.dirname(image_path), "output.stl")
        slice_stl(stl_path, gcode_path)

        print("G-code generated successfully.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # if there is a command line image use that
    if len(sys.argv) != 2:
        print("Usage: python image_to_gcode.py <input_image_path> <output_gcode_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    main(image_path)