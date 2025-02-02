import sys
from svgtrace import trace
from PIL import Image
import tempfile
import os
import subprocess
import platform

# takes the SVG and generates a model based off of it
def run_blender(svg_path):
    # local path to Blender executable, separate path for mac
    blender_path = r"C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"
    if platform.system() == "Darwin":
        blender_path = r"/Applications/Blender.app/Contents/MacOS/blender"
   
    print(blender_path)
    blender_command = [
        blender_path,
        "--background",
        "--python",
        "./blender_v1.py",
        svg_path
    ]

    subprocess.run(blender_command)
    pass


def main(image_path, scale):
    filename = image_path.split("/")[3].split(".")[0]
    svg_path = "./output/svg/" + filename + ".svg"

    
    try:
        run_blender(svg_path)
        print("STL created")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # if there is a command line image use that
    if len(sys.argv) != 3:
        print("Usage: python svg_to_stl.py <input_image_path> <img_scale>")
        sys.exit(1)

    image_path = sys.argv[1]
    image_size = float(sys.argv[2])
    main(image_path, image_size)