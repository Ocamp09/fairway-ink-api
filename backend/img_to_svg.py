import sys
from svgtrace import trace
from PIL import Image
import tempfile
import os

def image_to_svg(image_path):
    image = Image.open(image_path)

    width, height = image.size

    bbox = image.getbbox()

    image = image.crop(bbox)
 
    # default size for the SVGs to be saved
    max_size_px = 125

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
    return svg_data
    # with open(output_svg_path, "w") as svg_file:
    #     svg_file.write(svg_data)

    # os.remove(temp_image_path)
    # pass

def main(image_path):
    filename = image_path.split("/")[2].split(".")[0]
    extension =  image_path.split("/")[2].split(".")[1]
    svg_path = "./output/svg/" + filename + ".svg"
    
    try:
        # Step 1: Convert image to SVG
        if extension != "svg":
            image_to_svg(image_path, svg_path)
      
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # if there is a command line image use that
    if len(sys.argv) != 2:
        print("Usage: python image_to_svg.py <input_image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    main(image_path)