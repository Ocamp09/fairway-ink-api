import { ReactSVG } from "react-svg";
import { useSession } from "../../contexts/DesignContext";
import { useEffect, useRef, useState } from "react";
import { drawImage, drawLine, getCoordinates } from "../../utils/canvasUtils";

const SelectPreview = ({ setShowSelected }) => {
  const { svgData, updateSvgData, updatePrevSvgData } = useSession();

  const canvasRef = useRef();

  const [paths, setPaths] = useState([]);
  const [currPath, setCurrPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

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
