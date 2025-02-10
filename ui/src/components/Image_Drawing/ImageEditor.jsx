import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import "./ImageEditor.css";
import Toolbar from "./Toolbar";
import getStroke from "perfect-freehand";

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
  const lineColor = "#00000";
  const [lineWidth, setLineWidth] = useState(5);
  const [reloadPaths, setReloadPaths] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getSvgPathFromStroke = (stroke) => {
    if (!stroke.length) return "";

    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        return acc;
      },
      ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
  };

  const drawPaths = useCallback(() => {
    if (paths.length !== 0) {
      paths.forEach((path) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const stroke = getStroke(path.points, {
          size: path.width,
          thinning: 0.0,
          smoothing: 0.0,
          streamline: 1.0,
        });
        const pathData = getSvgPathFromStroke(stroke);
        const path2D = new Path2D(pathData);
        context.fillStyle = path.lineColor;
        context.fill(path2D);
      });
    }
  }, [paths]);

  const drawImage = useCallback(
    (edit) => {
      if (imageUrl) {
        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          const width = img.width;
          const height = img.height;
          const set_dimension = 425;

          let scale =
            width > height ? set_dimension / width : set_dimension / height;

          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;

          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;

          context.clearRect(0, 0, canvas.width, canvas.height);
          if (!edit) setPaths([]);

          context.drawImage(img, x, y, scaledWidth, scaledHeight);
          setReloadPaths(false);
        };
      }
    },
    [imageUrl]
  );

  const handleMouseMove = (e) => {
    if (isDrawing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      setPaths((prevPaths) => {
        const updatedPaths = [...prevPaths];
        const lastPath = updatedPaths[updatedPaths.length - 1];
        lastPath.points.push([newX, newY, e.pressure]);
        return updatedPaths;
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setPaths((prevPaths) => [
      ...prevPaths,
      { points: [[startX, startY, e.pressure]], lineColor, width: lineWidth },
    ]);
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

  // handle drag and drop into canvas
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
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(canvasScale, canvasScale);

    drawImage(false);
  }, [imageUrl, drawImage]);

  // This useEffect will only run when paths or lineWidth changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (reloadPaths) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(true);
    }
    drawPaths();
    // setReloadPaths(false);
  }, [paths, lineWidth, drawPaths, reloadPaths]);

  return (
    <div className="designer">
      <p className="desc">
        Upload an image (button or drag and drop), or draw with your mouse to
        get started
      </p>
      <div className="editor">
        <Toolbar
          paths={paths}
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
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
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
