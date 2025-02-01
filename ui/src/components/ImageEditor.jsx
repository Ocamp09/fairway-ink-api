import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function ImageEditor({ imageUrl, setSvgUrl }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [paths, setPaths] = useState([]); // Store all freehand paths

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Load the image
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate the position to center the image
      const scale = 0.5; // Scale the image to 50% of its original size
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      const x = (canvas.width - scaledWidth) / 2; // Center horizontally
      const y = (canvas.height - scaledHeight) / 2; // Center vertically

      // Draw the image centered on the canvas
      context.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Redraw all freehand paths
      paths.forEach((path) => {
        context.beginPath();
        context.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach((point) => {
          context.lineTo(point.x, point.y);
        });
        context.strokeStyle = path.color;
        context.lineWidth = path.width;
        context.stroke();
      });
    };
  }, [imageUrl, paths]);

  const handleMouseDown = (e) => {
    setIsDrawing(true);

    // Get the bounding rectangle of the canvas
    const rect = canvasRef.current.getBoundingClientRect();

    // Calculate the mouse position relative to the canvas
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    // Add a new path to the paths array
    setPaths((prevPaths) => [
      ...prevPaths,
      { points: [{ x: startX, y: startY }], color, width: lineWidth },
    ]);
  };

  const handleMouseMove = (e) => {
    if (isDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      // Update the last path in the paths array
      setPaths((prevPaths) => {
        const updatedPaths = [...prevPaths];
        const lastPath = updatedPaths[updatedPaths.length - 1];
        lastPath.points.push({ x: newX, y: newY });
        return updatedPaths;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");

    // Convert data URL to Blob
    const blob = await fetch(dataURL).then((r) => r.blob());

    const formData = new FormData();
    formData.append("file", blob, "canvas_image.png"); // Add filename

    //setIsLoading(true); // Set loading to true
    //setError(""); // Clear any previous errors

    try {
      const response = await axios.post(
        "http://localhost:5000/upload", // Your backend endpoint
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Important!
          },
        }
      );

      if (response.data.success) {
        console.log("Image uploaded successfully:", response.data);
        setSvgUrl(response.data.svgUrl);
      } else {
        //setError("Error uploading image. Please try again.");
        console.error("Upload error:", response.data);
      }
    } catch (err) {
      //setError("An error occurred while uploading the image.");
      console.error("Upload error:", err);
    } finally {
      //setIsLoading(false); // Set loading to false
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      // Clean up event listeners
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDrawing, paths]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500} // Set width and height explicitly!
        height={500} // Set width and height explicitly!
        className="golf-template"
      />
      <div>
        <label htmlFor="colorPicker">Color:</label>
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <label htmlFor="lineWidth">Line Width:</label>
        <input
          type="number"
          id="lineWidth"
          min={1}
          max={20}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
        />
      </div>
      <button onClick={handleSave}>Save Image</button> {/* Save button */}
    </div>
  );
}

export default ImageEditor;
