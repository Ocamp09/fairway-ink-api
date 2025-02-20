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

  const [paths, setPaths] = useState([]);
  const [currPath, setCurrPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      points: [[x - 5, y]],
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

    const updateEnd = [x, y];
    let updatedPath = currPath;
    updatedPath.points[1] = updateEnd;
    setCurrPath(updatedPath);
  };

  // Handle mouse up (finish drawing)
  const handleMouseUp = () => {
    setIsDrawing(false);
    setPaths((prevPaths) => {
      return [...prevPaths, currPath];
    });
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
    const centeredCanvas = centerCanvasDrawing(canvasRef.current);
    const dataURL = centeredCanvas.toDataURL("image/png");
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
      drawImage(false, url, canvasRef, placeholder, placeholder, "solid");
    }
  }, [svgData]);

  useEffect(() => {
    paths.forEach((path) => {
      if (path.type === "line" && path.points.length >= 2) {
        const startX = path.points[0][0];
        const startY = path.points[0][1];
        const endX = path.points[path.points.length - 1][0];
        const endY = path.points[path.points.length - 1][1];
        drawLine(canvasRef, startX, startY, endX, endY);
      }
    });
  }, [paths]);

  // useEffect(() => {
  //   console.log(currPath);
  //   if (currPath.points[0] && currPath.points[1] && canvasRef.current) {
  //     console.log(currPath.points[1]);
  //     const startX = currPath.points[0][0];
  //     const startY = currPath.points[0][1];
  //     const endX = currPath.points[1][0];
  //     const endY = currPath.points[1][1];

  //     drawLine(canvasRef, startX, startY, endX, endY);
  //   }
  // }, [currPath]);

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
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="canvas tab-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
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
