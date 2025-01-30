from svgtrace import trace
from PIL import Image
import tempfile
import os
import subprocess
import sys


# convert a image to SVG
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
        image = image.resize((new_width, new_height), Image.LANCZOS) #Use a high quality resampling filter

     # Save the image to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_file:
        temp_image_path = temp_file.name
        image.save(temp_image_path)

    # create a bitmap and convert to SVG
    svg_data = trace(temp_image_path, blackAndWhite=True)
    with open(output_svg_path, "w") as svg_file:
        svg_file.write(svg_data)

    os.remove(temp_image_path)


# run blender_v1.py to generate the STL
def run_blender(svg_path):
    blender_path = r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"

    blender_command = [
        blender_path,
        "--background",
        "--python",
        "./blender_v1.py",
        svg_path
    ]

    subprocess.run(blender_command)


# use PrusaSlicer command line to create GCODE
def slice_stl(stl_path):
    slicer_path = r"C:\Program Files\Prusa3D\PrusaSlicer\prusa-slicer.exe"
    config_file = "./config.ini"
    slice_command = [
        slicer_path,
        "--load",
        config_file,
        "--slice",
        "--export-gcode",
        "miami_logo.stl"
    ]
    subprocess.run(slice_command)


# default image for testing purposes
image_path = "osu_logo.jpg"
# if there is a command line image use that
if len(sys.argv) == 2:
    image_path = sys.argv[1]

filename = image_path.split(".")[0]
svg_path = "./output/" + filename + ".svg"
stl_path = "./output" + filename + ".stl"

# svg_path = filename + ".svg"
# stl_path = filename + ".stl"

# run scripts
image_to_svg(image_path, svg_path)
run_blender(svg_path)
#slice_stl(stl_path)