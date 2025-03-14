import sys
from svgtrace import trace
from PIL import Image
import tempfile
import os
import xml.etree.ElementTree as ET    
from enum import Enum
from svgpathtools import parse_path, Path, Line

class PrintType(Enum):
    SOLID = 1
    TEXT = 2
    CUSTOM = 3

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
      
        return new_svg_data

    except ET.ParseError as e:
        print(f"Error parsing SVG: {e}")
    except Exception as e:
        print(f"Error processing SVG: {e}")

def flag_problematic(svg_data):
    root = ET.fromstring(svg_data)
    paths = root.findall('.//{http://www.w3.org/2000/svg}path')

    for index, path in enumerate(paths):
        path_d = path.get('d')
        
        # count the number of Z's in SVG data (more than 1 could be sign
        # of unprintable code)
        z_cnt = path_d.count('Z')
        if z_cnt > 1:
            paths[index].set("fill", "blue")

    new_svg_data = ET.tostring(root, encoding='unicode', method='xml').replace("ns0:", "").replace(":ns0", "")
    return new_svg_data


def center_svg_content(svg_data):
    try:
        # Parse the SVG data
        root = ET.fromstring(svg_data)
        paths = root.findall('.//{http://www.w3.org/2000/svg}path')

        if paths:
            # Get the bounding box of all the paths combined
            min_x, min_y, max_x, max_y = 0, 0, 0, 0
            for path in paths:
                d_value = path.get('d')
                if d_value:
                    # Get the bounding box for the path using svgpathtools
                    parsed_path = parse_path(d_value)
                    path_bbox = parsed_path.bbox()  # bbox returns (min_x, min_y, max_x, max_y)

                    # Update the overall bounding box
                    min_x = min(min_x, path_bbox[0])
                    min_y = min(min_y, path_bbox[1])
                    max_x = max(max_x, path_bbox[2])
                    max_y = max(max_y, path_bbox[3])

            # Calculate the center of the SVG and the center of the bounding box
            svg_width = float(root.get('width', '500'))  # Default width of 500 if not present
            svg_height = float(root.get('height', '500'))  # Default height of 500 if not present

            bbox_center_x = (min_x + max_x) / 2
            bbox_center_y = (min_y + max_y) / 2

            svg_center_x = svg_width / 2
            svg_center_y = svg_height / 2

            # Calculate the translation offsets
            offset_x = svg_center_x - bbox_center_x
            offset_y = svg_center_y - bbox_center_y

            # Apply the translation to all paths' d attributes
            for path in paths:
                current_d = path.get('d')
                if current_d:
                    # Translate the path coordinates by the offset
                    # We add the translation directly to the 'd' attribute
                    path.set("transform", "translate({0}, {1})".format(str(offset_x), str(offset_y)))

            # Create a new SVG string with the centered paths
            new_svg_data = ET.tostring(root, encoding='unicode', method='xml').replace("ns0:", "").replace(":ns0", "")
            return new_svg_data

        else:
            print("No paths found in the SVG.")
            return svg_data

    except ET.ParseError as e:
        print(f"Error parsing SVG: {e}")
        return svg_data
    except Exception as e:
        print(f"Error processing SVG: {e}")
        return svg_data


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

    if method == PrintType.SOLID:
        svg_data = fill_svg(svg_data)
    elif method == PrintType.CUSTOM:
        svg_data = flag_problematic(svg_data)

    svg_data = center_svg_content(svg_data)

    with open("./recent.svg", "w") as svg_file:
         svg_file.write(svg_data)

    print(svg_data)
    return svg_data

def main(image_path, method):
    
    try:
        # Step 1: Convert image to SVG
        if method == "custom":
            method = PrintType.CUSTOM
        elif method == "text":
            method = PrintType.TEXT
        image_to_svg(image_path, method)
      
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # if there is a command line image use that
    if len(sys.argv) != 3:
        print("Usage: python image_to_svg.py <input_image_path> <method>")
        sys.exit(1)

    image_path = sys.argv[1]
    method = sys.argv[2]
    main(image_path, method)