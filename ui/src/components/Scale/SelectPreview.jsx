import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";
import { useEffect, useRef, useState } from "react";
import {
  drawImage,
  drawLine,
  getCoordinates,
  centerCanvasDrawing,
} from "../../utils/canvasUtils";
import { uploadImage } from "../../api/api";

const SelectPreview = ({ setShowSelected }) => {
  const { svgData, updateSvgData, updatePrevSvgData, templateType } =
    useSession();

  const canvasRef = useRef();

  const [paths, setPaths] = useState([]);
  const [currPath, setCurrPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  let selected = new Set();

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

  // Existing selectPath function
  const selectPath = (e) => {
    const selectedPath = e.target;

    if (e.target.localName !== "path") return;

    const fill = selectedPath.getAttribute("fill");
    if (fill == null || fill === "black") {
      selectedPath.setAttribute("fill", "red");
      selected.add(selectedPath);
    } else {
      selectedPath.setAttribute("fill", "black");
      selected.delete(selectedPath);
    }
  };

  // Existing removeSelectedPaths function
  const removeSelectedPaths = (selected) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, "image/svg+xml");
    const originalSvg = doc.documentElement;
    const paths = doc.querySelectorAll("path");

    const newSvg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("width", originalSvg.getAttribute("width"));
    newSvg.setAttribute("height", originalSvg.getAttribute("height"));

    paths.forEach((path) => {
      var match = false;
      selected.forEach((selctedPath) => {
        if (path.getAttribute("d") == selctedPath.getAttribute("d")) {
          match = true;
        }
      });
      if (!match) {
        const clonedPath = path.cloneNode();
        newSvg.appendChild(clonedPath);
      }
    });

    const updatedSvgData = new XMLSerializer().serializeToString(newSvg);
    return updatedSvgData;
  };

  const submitTabs = async () => {
    setError("");

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
    } catch (err) {
      console.error("Upload error:", err);
      setLoading(false);
      setError("Unable to connect to the server, try again later");
    }
  };

  // Existing submitSelected function
  const submitSelected = () => {
    updatePrevSvgData(svgData);

    if (selected.size !== 0) {
      const newSvg = removeSelectedPaths(selected);
      updateSvgData(newSvg);
    }
    setShowSelected(true);
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
    <div>
      <h3>Add tabs for printing</h3>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
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
      <h3>Select any curves to remove from design</h3>
      {svgData && (
        <ReactSVG
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`}
          onClick={(e) => selectPath(e)}
        />
      )}
      <button
        className="submit-button"
        onClick={() => {
          submitSelected();
        }}
      >
        Proceed to Scale Image
      </button>
    </div>
  );
};

export default SelectPreview;
