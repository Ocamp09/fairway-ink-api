import sys
from svgtrace import trace
from PIL import Image
import tempfile
import os
import xml.etree.ElementTree as ET    
from enum import Enum

class PrintType(Enum):
    SOLID = 1
    TEXT = 2
    MULTI = 3

def fill_svg(svg_data):
    try:
        root = ET.fromstring(svg_data)
        paths = root.findall('.//{http://www.w3.org/2000/svg}path')

        if paths:
            outermost_path = paths[0] # Assume the first path is the outermost.  This may need more sophisticated logic.

            # Check if the path has a fill attribute, if not add one. If it does, don't change it.
            if outermost_path.get('fill') is None:
                outermost_path.set('fill', 'black') 

            # Remove all other paths (optional, if you only want the outline)
            for path in paths[1:]:
              root.remove(path)

            d_value = outermost_path.get('d')
            if d_value:
                # Find the index of 'Z' (or 'z') and truncate the string
                z_index = d_value.upper().find('Z')  # Case-insensitive search
                if z_index != -1:
                    truncated_d = d_value[:z_index]  # Keep 'Z'
                    outermost_path.set('d', truncated_d)
        
        new_svg_data = ET.tostring(root, encoding='unicode', method='xml').replace("ns0:", "").replace(":ns0", "")
        # with open(svg_path, "w") as svg_file:
        #     svg_file.write(new_svg_data)
        return new_svg_data

    except ET.ParseError as e:
        print(f"Error parsing SVG: {e}")
    except Exception as e:
        print(f"Error processing SVG: {e}")

def image_to_svg(image_path, method=PrintType.SOLID):
    image = Image.open(image_path)

    width, height = image.size

    bbox = image.getbbox()

    image = image.crop(bbox)
 
    # default size for the SVGs to be saved
    max_size_px = 500

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
    os.remove(temp_image_path)

    # with open(svg_path, "w") as svg_file:
    #     svg_file.write(svg_data)

    print(method)
    if method == PrintType.SOLID:
        svg_data = fill_svg(svg_data)

    return svg_data

def main(image_path):
    filename = image_path.split("/")[2].split(".")[0]
    extension =  image_path.split("/")[2].split(".")[1]
    svg_path = "./output/svg/" + filename + ".svg"
    
    try:
        # Step 1: Convert image to SVG
        if extension != "svg":
            image_to_svg(image_path)
      
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