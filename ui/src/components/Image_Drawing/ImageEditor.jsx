import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import "./ImageEditor.css";
import Toolbar from "./Toolbar";
import getStroke from "perfect-freehand";
import { useSession } from "../../contexts/DesignContext";
import TypeSelector from "./TypeSelector";
import ModeExamples from "./ModeExamples";

function ImageEditor({
  setSvgUrl,
  setSvgData,
  setShowDesign,
  setShowScale,
  paths,
  setPaths,
}) {
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const lineColor = "#00000";
  const [lineWidth, setLineWidth] = useState(5);
  const [reloadPaths, setReloadPaths] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(80);

  const { imageUrl, updateImageUrl, templateType, editorMode } = useSession();

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
        if (path.type === "text") {
          writeText(path.text, path.points[0][0], path.points[0][1]);
        } else {
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
        }
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

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvasScale;
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.clientX) {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    const pressure = e.pressure || 1;

    return { x, y, pressure };
  };

  const writeText = (text, x, y) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.font = fontSize + "px stencil";
    context.fillText(text, x, y);
  };

  const handleStartDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    var { x, y, pressure } = coords;

    if (editorMode === "type") {
      var inputText = prompt("Enter text: ");
      if (inputText) {
        if (templateType === "text") {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");
          context.font = fontSize + "px stencil";

          const offset = (paths.length - 1) * (fontSize * 1.75);
          const textMetrics = context.measureText(inputText);
          const textWidth = textMetrics.width;

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          x = centerX - textWidth / 2;
          y = centerY + fontSize + offset / 2;
          console.log(textMetrics, centerX, x);
        }

        setPaths((prevPaths) => [
          ...prevPaths,
          {
            points: [[x, y, 1]],
            lineColor,
            width: fontSize,
            type: "text",
            text: inputText,
          },
        ]);
      }
    } else {
      setPaths((prevPaths) => [
        ...prevPaths,
        {
          points: [[x, y, pressure]],
          lineColor,
          width: lineWidth,
          type: "draw",
        },
      ]);
    }
  };

  const handleMoveDrawing = (e) => {
    e.preventDefault();
    if (editorMode === "type") return;

    const coords = getCoordinates(e);
    if (!coords || !isDrawing) return;

    const { x, y, pressure } = coords;
    setPaths((prevPaths) => {
      const updatedPaths = [...prevPaths];
      const lastPath = updatedPaths[updatedPaths.length - 1];

      if (lastPath) {
        lastPath.points.push([x, y, pressure]);
        return updatedPaths;
      } else {
        return [];
      }
    });
  };

  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSvg = async () => {
    setIsLoading(true);
    setSvgUrl(null);
    const canvas = canvasRef.current;

    // Create a temporary canvas to calculate the bounding box
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw the current canvas content onto the temporary canvas
    tempCtx.drawImage(canvas, 0, 0);

    // Get the image data from the temporary canvas
    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );
    const data = imageData.data;

    // Calculate the bounding box of the drawn content
    let minX = tempCanvas.width;
    let minY = tempCanvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < tempCanvas.height; y++) {
      for (let x = 0; x < tempCanvas.width; x++) {
        const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
        if (alpha > 0) {
          // Non-transparent pixel found
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Calculate the center of the drawn content
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const centerX = (tempCanvas.width - contentWidth) / 2;
    const centerY = (tempCanvas.height - contentHeight) / 2;

    // Create a new canvas to draw the centered content
    const centeredCanvas = document.createElement("canvas");
    centeredCanvas.width = canvas.width;
    centeredCanvas.height = canvas.height;
    const centeredCtx = centeredCanvas.getContext("2d");

    // Fill the background with white
    centeredCtx.fillStyle = "white";
    centeredCtx.fillRect(0, 0, centeredCanvas.width, centeredCanvas.height);

    // Translate and draw the content onto the centered canvas
    centeredCtx.translate(centerX - minX, centerY - minY);
    centeredCtx.drawImage(canvas, 0, 0);

    // Export the centered canvas as an image
    const dataURL = centeredCanvas.toDataURL("image/png");
    const blob = await fetch(dataURL).then((r) => r.blob());

    const formData = new FormData();
    formData.append("file", blob, "fairway_ink_drawing.png");
    formData.append("method", templateType);
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
          updateImageUrl(event.target.result);
          sessionStorage.setItem("imageUrl", event.target.result);
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

  // handles new image upload
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(canvasScale, canvasScale);

    drawImage(false);
  }, [imageUrl, drawImage]);

  //will only run when paths or lineWidth changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (reloadPaths) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(true);
    }
    drawPaths();
  }, [paths, lineWidth, drawPaths, reloadPaths]);

  // handles touch drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const handleTouchStart = (e) => handleStartDrawing(e);
      const handleTouchMove = (e) => handleMoveDrawing(e);
      const handleTouchEnd = () => handleStopDrawing();

      canvas.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener("touchstart", handleTouchStart);
        canvas.removeEventListener("touchmove", handleTouchMove);
        canvas.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [handleStartDrawing, handleMoveDrawing, handleStopDrawing]);

  // use effect to handle window scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    const initialWidth = 500;

    // Function to calculate scale factor based on current width
    const calculateCanvasScale = () => {
      const currentWidth = canvas.offsetWidth;
      const scale = currentWidth / initialWidth;
      setCanvasScale(scale);
    };

    calculateCanvasScale();
    window.addEventListener("resize", calculateCanvasScale);

    return () => {
      window.removeEventListener("resize", calculateCanvasScale);
    };
  }, []);

  useEffect(() => {
    // Create a new FontFace object to load the custom font
    const myFont = new FontFace("stencil", "url(/gunplay.otf)");

    // Load the font
    myFont
      .load()
      .then(() => {
        // Add the font to the document
        document.fonts.add(myFont);
        console.log("font loaded");
      })
      .catch((error) => {
        console.error("Error loading font:", error);
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    setPaths([]);
  }, [templateType]);

  return (
    <div className="designer">
      <p className="desc">
        {templateType == "text"
          ? `Click inside the editor and type a message`
          : ` Upload an image (button or drag and drop), or draw with your mouse to
        get started`}
      </p>
      <TypeSelector />
      <div className="displays">
        <div className="editor">
          <Toolbar
            paths={paths}
            setPaths={setPaths}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            setReloadPaths={setReloadPaths}
            scale={canvasScale}
            setScale={setCanvasScale}
            canvasRef={canvasRef}
            fontSize={fontSize}
            setFontSize={setFontSize}
            templateType={templateType}
          ></Toolbar>
          <div>
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="canvas"
              onMouseDown={handleStartDrawing}
              onMouseMove={handleMoveDrawing}
              onMouseUp={handleStopDrawing}
            />
          </div>
        </div>
        <div className="modes">
          <ModeExamples />
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
