from svgtrace import trace
from PIL import Image
import tempfile
import os
import xml.etree.ElementTree as ET    
from enum import Enum
from svgpathtools import parse_path

class PrintType(Enum):
    SOLID = 1
    TEXT = 2
    CUSTOM = 3

def fill_svg(svg_data):
    try:
        root = ET.fromstring(svg_data)
        paths = root.findall('.//{http://www.w3.org/2000/svg}path')

        if paths:
            # remove paths that do not have two z's
            for path in paths:
                d_value = path.get('d')

                # Check if the path has a fill attribute, if not add one. If it does, don't change it.
                if path.get('fill') is None:
                    path.set('fill', 'black') 

                d_value = path.get('d')
                if d_value:
                    # Find the index of 'Z' (or 'z') and truncate the string
                    z_index = d_value.upper().find('Z')  # Case-insensitive search
                    if z_index != -1:
                        truncated_d = d_value[:z_index]  # Keep 'Z'
                        path.set('d', truncated_d)
        
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
            paths[index].set("fill", "#00004d")

    new_svg_data = ET.tostring(root, encoding='unicode', method='xml').replace("ns0:", "").replace(":ns0", "")
    return new_svg_data


def image_to_svg(image, method=PrintType.SOLID):
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

    return svg_data
