import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./ImageEditor.css";
import Toolbar from "./Toolbar";
import FileUpload from "./FileUpload";

function ImageEditor({ setSvgUrl, setSvgData, setShowDesign, setShowScale }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  // const [color, setColor] = useState("#000000");
  const color = "#00000";
  const [lineWidth, setLineWidth] = useState(5);
  const [paths, setPaths] = useState([]);
  const [reloadPaths, setReloadPaths] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [imageUrl, setImageUrl] = useState(null);

  // Function to redraw all paths
  const drawPaths = useCallback(
    (context) => {
      console.log("Abouta draw paths");

      if (paths.length !== 0) {
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
      }
    },
    [paths]
  );

  const drawImage = useCallback(() => {
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        console.log("bouta draw an image");
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Calculate the position to center the image
        const width = img.width;
        const height = img.height;
        const set_dimension = 425; // default dimension

        // calculate the scale based on the longer size
        let scale =
          width > height ? set_dimension / width : set_dimension / height;

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;

        // Draw the image centered on the canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, x, y, scaledWidth, scaledHeight);
      };
    }
  }, [imageUrl]);

  // Redraw the canvas whenever paths or imageUrl changes
  useEffect(() => {
    drawImage();
  }, [imageUrl, drawImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(canvasScale, canvasScale);

    drawImage();
    drawPaths(context);
    setReloadPaths(false);
  }, [reloadPaths, canvasScale, lineWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    drawPaths(context);
  }, [paths, drawPaths]);

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
    formData.append("file", blob, "fairway_ink_drawing.png"); // Add filename

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
        const blob = new Blob([response.data.svgData], {
          type: "image/svg+xml",
        });
        const url = URL.createObjectURL(blob);
        setSvgData(response.data.svgData);
        setSvgUrl(url);
        setShowScale(true);
        setShowDesign(false);
      } else {
        console.error("Upload error:", response.data);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;

    const canvasBackground = document.createElement("canvas");
    canvasBackground.width = canvas.width;
    canvasBackground.height = canvas.height;

    const ctx = canvasBackground.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = canvasBackground.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.setAttribute("download", "fairway-ink-canvas.jpg");
    document.body.appendChild(link);
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      // Clean up event listeners
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  });

  return (
    <div className="editor">
      <Toolbar
        setPaths={setPaths}
        lineWidth={lineWidth}
        setLineWidth={setLineWidth}
        setReloadPaths={setReloadPaths}
        scale={canvasScale}
        setScale={setCanvasScale}
      ></Toolbar>
      <div>
        <canvas ref={canvasRef} width={500} height={500} className="canvas" />
      </div>
      <div className="right-panel">
        <FileUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
        <button className="right-button" onClick={handleSvg}>
          Preview
        </button>
        <button className="right-button" onClick={saveCanvas}>
          Save Image
        </button>
      </div>
    </div>
  );
}

export default ImageEditor;
