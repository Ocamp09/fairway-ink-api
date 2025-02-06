import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./ImageEditor.css";
import Toolbar from "./Toolbar";
import FileUpload from "./FileUpload";

function ImageEditor({
  setSvgUrl,
  setSvgData,
  setShowDesign,
  setShowScale,
  showDesign,
  paths,
  setPaths,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const color = "#00000";
  const [lineWidth, setLineWidth] = useState(5);
  const [reloadPaths, setReloadPaths] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to redraw all paths
  const drawPaths = useCallback(
    (context) => {
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
    setReloadPaths(false);
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
  }, [reloadPaths, canvasScale, lineWidth, showDesign]);

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
    setIsLoading(true);
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
    formData.append("file", blob, "fairway_ink_drawing.png");

    try {
      const response = await axios.post(
        "http://localhost:5001/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const blob = new Blob([response.data.svgData], {
          type: "image/svg+xml",
        });
        setIsLoading(false);
        const url = URL.createObjectURL(blob);
        setSvgData(response.data.svgData);
        setSvgUrl(url);
        setShowScale(true);
        setShowDesign(false);
      } else {
        console.error("Upload error:", response.data);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setIsLoading(false);
    }
  };

  // handle file drag and drop
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrl(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };

    canvas.addEventListener("dragenter", handleDragEnter);
    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("dragleave", handleDragLeave);
    canvas.addEventListener("drop", handleDrop);

    return () => {
      canvas.removeEventListener("dragenter", handleDragEnter);
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("dragleave", handleDragLeave);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, []);

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
    <div>
      <p>
        Upload an image (button or drag and drop), or draw with your mouse to
        get started
      </p>
      <div className="editor">
        <Toolbar
          setPaths={setPaths}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          setReloadPaths={setReloadPaths}
          scale={canvasScale}
          setScale={setCanvasScale}
          setImageUrl={setImageUrl}
          imageUrl={imageUrl}
          canvasRef={canvasRef}
        ></Toolbar>
        <div>
          <canvas ref={canvasRef} width={500} height={500} className="canvas" />
        </div>
      </div>
      <button
        className="submit-button"
        onClick={handleSvg}
        disabled={isLoading}
      >
        {!isLoading && "Convert Drawing"}
        {isLoading && "Processing"}
      </button>
    </div>
  );
}

export default ImageEditor;
