import { useRef, useState, useEffect } from "react";
import { useSession } from "../../contexts/DesignContext";
import {
  drawImage,
  drawLine,
  getCoordinates,
  centerCanvasDrawing,
} from "../../utils/canvasUtils";
import InfoPane from "./InfoPane";
import { uploadImage } from "../../api/api";
import "./TabEditor.css";
import UndoRedo from "../Image_Drawing/UndoRedo";
import DrawTools from "../Image_Drawing/DrawTools";

const TabEditor = () => {
  const {
    updateAdjustStage,
    svgData,
    prevSvgData,
    updatePrevSvgData,
    updateSvgData,
    templateType,
  } = useSession();

  const canvasRef = useRef();
  const imgCanvasRef = useRef();

  const [reloadPaths, setReloadPaths] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currPath, setCurrPath] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [lineWidth, setLineWidth] = useState(8);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const iconSize = 28;

  const handleBackToRemove = () => {
    updateAdjustStage("remove");
    updateSvgData(prevSvgData);
  };

  // Handle mouse down (start drawing)
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDrawing(true);

    const coords = getCoordinates(e, canvasRef, 1);
    if (!coords) return;
    var { x, y } = coords;
    setCurrPath({
      start: [x, y],
      end: [x, y],
      width: lineWidth,
      type: "line",
    });
  };

  // handle mouse move (update line while dragging)
  const handleMouseMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;

    const coords = getCoordinates(e, canvasRef, 1);
    if (!coords) return;
    var { x, y } = coords;

    setCurrPath((prevPath) => ({
      ...prevPath,
      end: [x, y],
    }));
  };

  // Handle mouse up (finish drawing)
  const handleMouseUp = () => {
    setIsDrawing(false);
    setPaths((prevPaths) => {
      return [...prevPaths, currPath];
    });
    setCurrPath(null);
  };

  const submitTabs = async () => {
    setError("");
    updatePrevSvgData(svgData);

    if (paths.lengths === 0) {
      alert(
        "We have detected unprintable surfaces and you have uploaded no tabs. This could lead to unintended printing errors."
      );
    }

    setLoading(true);

    // Create a temporary canvas to combine the image and drawings
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 500;
    tempCanvas.height = 500;
    const tempCtx = tempCanvas.getContext("2d");

    // Fill the background with white
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(imgCanvasRef.current, 0, 0);
    tempCtx.drawImage(canvasRef.current, 0, 0);

    const dataURL = tempCanvas.toDataURL("image/png");
    const blob = await fetch(dataURL).then((r) => r.blob());

    try {
      // Call the uploadImage function from api.js
      const response = await uploadImage(blob, templateType);

      setLoading(false);
      updateSvgData(response.svgData);
      updateAdjustStage("scale");
    } catch (err) {
      console.error("Upload error:", err);
      setLoading(false);
      setError("Unable to connect to the server, try again later");
    }
  };

  // Load the SVG onto the canvas
  useEffect(() => {
    const placeholder = () => {};
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    if (canvasRef.current) {
      drawImage(false, url, imgCanvasRef, placeholder, setReloadPaths, "solid");
    }
  }, [svgData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (!paths) return;
    paths.forEach((path) => {
      if (path.type === "line") {
        const startX = path.start[0];
        const startY = path.start[1];
        const endX = path.end[0];
        const endY = path.end[1];
        drawLine(canvasRef, startX, startY, endX, endY, path.width);
      }
    });

    if (currPath) {
      const { start, end } = currPath;
      drawLine(canvasRef, start[0], start[1], end[0], end[1], currPath.width);
    }
  }, [currPath, paths, reloadPaths]);

  return (
    <div className="tab-main">
      <button
        className="back-button"
        onClick={() => {
          handleBackToRemove();
        }}
      >
        Back
      </button>
      <p>Add tabs for printing</p>
      <div className="tab">
        <div className="toolbar tools buts">
          <UndoRedo
            paths={paths}
            setPaths={setPaths}
            iconSize={28}
            setReloadPaths={setReloadPaths}
            undoStack={undoStack}
            setUndoStack={setUndoStack}
            redoStack={redoStack}
            setRedoStack={setRedoStack}
          />
          <DrawTools
            iconSize={iconSize}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
          />
        </div>
        <div className="canvas-container">
          <canvas
            ref={imgCanvasRef}
            width={500}
            height={500}
            className="img-canvas"
          />
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="drawing-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
        <InfoPane warnText="Indicates un-printable areas, click and draw bridges across yellow items to white areas for printing" />
      </div>
      <button
        className="submit-button"
        onClick={() => {
          submitTabs();
        }}
      >
        {!loading && "Add tabs"}
        {loading && "Loading"}
      </button>
      {error && <p className="file-error-message">{error}</p>}
    </div>
  );
};

export default TabEditor;
