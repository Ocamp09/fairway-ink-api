import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ImageEditor.css";

function ImageEditor({ imageUrl, setSvgUrl }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [paths, setPaths] = useState([]);

  // Function to redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image if it exists
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        // Calculate the position to center the image
        const scale = 0.5;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        // Draw the image centered on the canvas
        context.drawImage(img, x, y, scaledWidth, scaledHeight);

        // Redraw all freehand paths
        redrawPaths(context);
      };
    } else {
      // If no image, just redraw the paths
      redrawPaths(context);
    }
  };

  // Function to redraw all paths
  const redrawPaths = (context) => {
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

  // Redraw the canvas whenever paths or imageUrl changes
  useEffect(() => {
    redrawCanvas();
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    redrawPaths(context);
  }, [paths]);

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

  const handleSvg = async () => {
    setSvgUrl(null);
    const canvas = canvasRef.current;

    const canvasBackground = document.createElement("canvas");
    canvasBackground.width = canvas.width;
    canvasBackground.height = canvas.height;

    const ctx = canvasBackground.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);

    const dataURL = canvasBackground.toDataURL("image/png");
    // Convert data URL to Blob
    const blob = await fetch(dataURL).then((r) => r.blob());

    const formData = new FormData();
    formData.append("file", blob, "canvas_image.png"); // Add filename

    try {
      const response = await axios.post(
        "http://localhost:5001/upload", // Your backend endpoint
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
        console.error("Upload error:", response.data);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const handleUndo = () => {
    setPaths((prevPaths) => prevPaths.slice(0, -1)); // Remove the last path
  };

  const handleFill = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
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
    <div className="editor">
      <div className="toolbar">
        <button onClick={handleUndo}>Undo</button>
        <label className="toolbar-text" htmlFor="lineWidth">
          Line Width:
        </label>
        <input
          type="number"
          id="lineWidth"
          min={1}
          max={20}
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
        />
      </div>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="golf-template"
        />
      </div>
      <button onClick={handleSvg}>Preview</button>
    </div>
  );
}

export default ImageEditor;
