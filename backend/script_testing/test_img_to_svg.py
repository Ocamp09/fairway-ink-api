import sys
from svgtrace import trace
from PIL import Image
import tempfile
import os
import xml.etree.ElementTree as ET    
from enum import Enum
from svgpathtools import Path, Line, parse_path

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


def remove_outline(svg_data):
    root = ET.fromstring(svg_data)
    paths = root.findall('.//{http://www.w3.org/2000/svg}path')

    if len(paths) < 2:
        return svg_data  # No outline to remove if there's only one path

    # Parse the first path's `d` attribute into a Path object
    outline_path_d = paths[0].get('d')
    outline_path = parse_path(outline_path_d)
    outline_bbox = outline_path.bbox()  # Get the bounding box of the first path

    # Check if the first path is an outline by comparing its bounding box with others
    is_outline = True
    for path_element in paths[1:]:
        path_d = path_element.get('d')
        if path_d:
            path = parse_path(path_d)
            path_bbox = path.bbox()
            if (outline_bbox[0] <= path_bbox[0] and outline_bbox[1] <= path_bbox[1] and
                    outline_bbox[2] >= path_bbox[2] and outline_bbox[3] >= path_bbox[3]):
                is_outline = True
                break

    # If the first path is an outline, remove it
    if is_outline:
        root.remove(paths[0])  # Remove the first path
        new_svg_data = ET.tostring(root, encoding='unicode', method='xml').replace("ns0:", "").replace(":ns0", "")
        return new_svg_data

    return svg_data 


def bridge_path(path):
    try:
        # Parse the path data into a Path object
        path_obj = parse_path(path.get('d'))

        # Get the bounding box of the path
        bbox = path_obj.bbox()

        # Calculate the midpoint of the path's height
        mid_y = (bbox[1] + bbox[3]) / 2

        # Find points where the path crosses the midpoint
        crossing_points = []
        for segment in path_obj:
            if segment.start.imag <= mid_y <= segment.end.imag or segment.end.imag <= mid_y <= segment.start.imag:
                # Calculate the x-coordinate at the midpoint
                t = (mid_y - segment.start.imag) / (segment.end.imag - segment.start.imag)
                x = segment.start.real + t * (segment.end.real - segment.start.real)
                crossing_points.append((x, mid_y))

        # Sort crossing points by x-coordinate
        crossing_points.sort()

        # Split the path into two parts at the crossing points
        if len(crossing_points) >= 2:
            # Create two new paths
            path1 = Path()
            path2 = Path()

            # Add segments to the new paths
            for segment in path_obj:
                if segment.end.imag <= mid_y:
                    path1.append(segment)
                else:
                    path2.append(segment)

            # Add bridges (horizontal lines) between the two paths
            bridge_width = 5  # Adjust the bridge width as needed
            for i in range(0, len(crossing_points), 2):
                x1, y1 = crossing_points[i]
                x2, y2 = crossing_points[i + 1]
                bridge = Line(complex(x1, y1), complex(x2, y2))
                path1.append(bridge)

            # Combine the two paths into a single path
            new_path = path1 + path2

            # Update the path's `d` attribute
            path.set('d', new_path.d())

        return path

    except Exception as e:
        print(f"Error adding bridges to path: {e}")
        return path    


def detect_bridge_required(svg_data):
    root = ET.fromstring(svg_data)
    paths = root.findall('.//{http://www.w3.org/2000/svg}path')

    for index, path in enumerate(paths):
        path_d = path.get('d')
        z_cnt = path_d.count('Z')
        print(z_cnt)

        if z_cnt > 1:
            updated_path = bridge_path(path)


    new_svg_data = ET.tostring(root, encoding='unicode', method='xml').replace("ns0:", "").replace(":ns0", "")
    return new_svg_data


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
        svg_data= detect_bridge_required(svg_data)

    with open("./test.svg", "w") as svg_file:
        svg_file.write(svg_data)

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