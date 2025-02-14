import { useState, useRef, useCallback, useEffect } from "react";
import "./ImageEditor.css";
import Toolbar from "./Toolbar";
import getStroke from "perfect-freehand";
import { useSession } from "../../contexts/DesignContext";
import TypeSelector from "./TypeSelector";
import ModeExamples from "./ModeExamples";
import {
  getCoordinates,
  getSvgPathFromStroke,
  centerCanvasDrawing,
  drawImage,
} from "../../utils/canvasUtils";
import { useFontLoader } from "../../hooks/useFontLoader";
import { useCanvasScaling } from "../../hooks/useCanvasScaling";
import { useCanvasEvents } from "../../hooks/useCanvasEvents";
import { uploadImage } from "../../api/api";

function ImageEditor({
  setSvgUrl,
  setSvgData,
  setShowDesign,
  setShowScale,
  paths,
  setPaths,
}) {
  const canvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDrawing, setIsDrawing] = useState(false);
  const [reloadPaths, setReloadPaths] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [lineWidth, setLineWidth] = useState(5);
  const [fontSize, setFontSize] = useState(80);

  const { imageUrl, templateType, editorMode } = useSession();

  const lineColor = "#00000";

  useFontLoader();
  useCanvasScaling(canvasRef, setCanvasScale);

  const drawPaths = useCallback(() => {
    if (paths.length !== 0) {
      paths.forEach((path) => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (path.type === "text") {
          writeText(
            path.text,
            path.points[0][0],
            path.points[0][1],
            path.width
          );
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

  const writeText = (text, x, y, pathSize) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.font = pathSize + "px stencil";
    context.fillText(text, x, y);
  };

  const handleStartDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e, canvasRef, canvasScale);
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

          var offset = 0;
          paths.forEach((path) => {
            offset += path.width;
          });

          const textMetrics = context.measureText(inputText);
          const textWidth = textMetrics.width;

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;

          x = centerX - textWidth / 2;
          y = centerY + fontSize + offset - 75;
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

    const coords = getCoordinates(e, canvasRef, canvasScale);
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
    setError("");

    if (paths.length === 0) {
      setError("Unable to upload blank drawing");
      return;
    }

    setIsLoading(true);
    setSvgUrl(null);
    const centeredCanvas = centerCanvasDrawing(canvasRef.current);

    // Export the centered canvas as an image
    const dataURL = centeredCanvas.toDataURL("image/png");
    const blob = await fetch(dataURL).then((r) => r.blob());

    try {
      // Call the uploadImage function from api.js
      const response = await uploadImage(blob, templateType);

      // Handle the response
      const blobSvg = new Blob([response.svgData], {
        type: "image/svg+xml",
      });

      setIsLoading(false);
      const url = URL.createObjectURL(blobSvg);
      setSvgData(response.svgData);
      setSvgUrl(url);
      setShowScale(true);
      setShowDesign(false);
    } catch (err) {
      console.error("Upload error:", err);
      setIsLoading(false);
      setError("Unable to connect to the server, try again later");
    }
  };

  // handles new image upload
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(canvasScale, canvasScale);

    drawImage(false, imageUrl, canvasRef, setPaths, setReloadPaths);
  }, [imageUrl, drawImage]);

  //will only run when paths or lineWidth changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (reloadPaths) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawImage(true, imageUrl, canvasRef, setPaths, setReloadPaths);
    }
    drawPaths();
  }, [paths, lineWidth, drawPaths, reloadPaths]);

  useCanvasEvents(
    canvasRef,
    handleStartDrawing,
    handleMoveDrawing,
    handleStartDrawing
  );

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
      <div className="modes-top">
        <ModeExamples small={true} />
      </div>
      <TypeSelector />
      <div className="displays">
        <div className="editor">
          <div className="tool">
            <Toolbar
              paths={paths}
              setPaths={setPaths}
              lineWidth={lineWidth}
              setLineWidth={setLineWidth}
              setReloadPaths={setReloadPaths}
              canvasRef={canvasRef}
              fontSize={fontSize}
              setFontSize={setFontSize}
              templateType={templateType}
            ></Toolbar>
          </div>
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
        <div className="modes-bottom">
          <ModeExamples />
        </div>
        <div className="editor-spacer"></div>
      </div>
      <button
        className="submit-button"
        onClick={handleSvg}
        disabled={isLoading}
      >
        {!isLoading && "Proceed to Scale"}
        {isLoading && "Loading"}
      </button>
      {error && <p className="file-error-message">{error}</p>}
    </div>
  );
}

export default ImageEditor;
