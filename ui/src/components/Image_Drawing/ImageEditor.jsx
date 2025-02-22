import { useState, useRef, useEffect } from "react";
import "./ImageEditor.css";
import Toolbar from "./Toolbar";
import { useSession } from "../../contexts/DesignContext";
import TypeSelector from "./TypeSelector";
import ModeExamples from "./ModeExamples";
import getStroke from "perfect-freehand";
import {
  getCoordinates,
  centerCanvasDrawing,
  drawImage,
  drawPaths,
  calculateBbox,
} from "../../utils/canvasUtils";
import { useFontLoader } from "../../hooks/useFontLoader";
import { useCanvasScaling } from "../../hooks/useCanvasScaling";
import { useCanvasEvents } from "../../hooks/useCanvasEvents";
import { uploadImage } from "../../api/api";

function ImageEditor() {
  const canvasRef = useRef(null);
  const imgCanvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [reloadPaths, setReloadPaths] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [lineWidth, setLineWidth] = useState(5);
  const [fontSize, setFontSize] = useState(80);

  const {
    imageUrl,
    stage,
    updateStage,
    updateAdjustStage,
    uploadedPaths,
    updateUploadedPaths,
    updateSvgData,
    templateType,
    editorMode,
  } = useSession();

  const [paths, setPaths] = useState([]);

  const lineColor = "#00000";

  useFontLoader();
  useCanvasScaling(canvasRef, setCanvasScale);

  const handleStartDrawing = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e, canvasRef, canvasScale);
    if (!coords) return;

    setIsDrawing(true);
    var { x, y, pressure } = coords;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (editorMode === "select") {
      paths.forEach((path, index) => {
        if (path.type === "text") {
          // get the bounding box for text selection
          const boundingBox = path.bbox;

          // Check if the click is within the bounding box
          if (
            x >= boundingBox.x1 &&
            x <= boundingBox.x2 &&
            y >= boundingBox.y2 &&
            y <= boundingBox.y1
          ) {
            if (path.selected) {
              setIsDragging(true);
              return;
            }

            setPaths((prevPaths) => {
              const updatedPaths = [...prevPaths];
              updatedPaths[index] = {
                ...updatedPaths[index],
                selected: true,
              };
              return updatedPaths;
            });
            setReloadPaths(true);
          } else {
            setPaths((prevPaths) => {
              const updatedPaths = [...prevPaths];
              updatedPaths[index] = {
                ...updatedPaths[index],
                selected: false,
              };
              return updatedPaths;
            });
            setReloadPaths(true);
          }
        }
      });
      return;
    }

    if (editorMode === "type") {
      var inputText = prompt("Enter text: ");
      if (inputText) {
        context.font = fontSize + "px stencil";
        const textMetrics = context.measureText(inputText);

        if (templateType === "text") {
          var offset = 0;
          paths.forEach((path) => {
            offset += path.width;
          });

          const textHeight =
            textMetrics.actualBoundingBoxAscent +
            textMetrics.actualBoundingBoxDescent;

          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2 - 150;

          x = centerX;
          y = centerY + textHeight / 2 + offset;
        }

        const bbox = calculateBbox(x, y, textMetrics);

        setPaths((prevPaths) => {
          return [
            ...prevPaths,
            {
              points: [[x, y, 1]],
              lineColor,
              width: fontSize,
              type: "text",
              text: inputText,
              templateType: templateType,
              selected: false,
              bbox: bbox,
            },
          ];
        });
      }
    } else {
      setPaths((prevPaths) => {
        return [
          ...prevPaths,
          {
            points: [[x, y, pressure]],
            lineColor,
            width: lineWidth,
            type: "draw",
          },
        ];
      });
    }
  };

  const handleMoveDrawing = (e) => {
    e.preventDefault();
    if (editorMode === "type") return; // Skip for text typing mode

    const coords = getCoordinates(e, canvasRef, canvasScale);
    if (!coords || !isDrawing) return;

    const { x, y, pressure } = coords;

    if (editorMode === "select" && isDragging) {
      setPaths((prevPaths) => {
        return prevPaths.map((path, index) => {
          if (path.selected) {
            const updatedPath = { ...path };

            // Calculate the offset based on the initial position of the path
            const xOffset = x - path.points[0][0]; // x position offset
            const yOffset = y - path.points[0][1]; // y position offset

            // Update the points of the selected path by moving them based on the offset
            updatedPath.points = updatedPath.points.map(([px, py, pz]) => [
              px + xOffset,
              py + yOffset,
              pz, // keep the pressure unchanged
            ]);

            // Update the bounding box if the path is of type "text"
            if (path.type === "text") {
              const canvas = canvasRef.current;
              const context = canvas.getContext("2d");
              context.font = path.width + "px stencil"; // Ensure to match the font size
              const textMetrics = context.measureText(path.text);
              updatedPath.bbox = calculateBbox(
                updatedPath.points[0][0], // x position of the text
                updatedPath.points[0][1], // y position of the text
                textMetrics
              );
            }
            return updatedPath;
          }
          return path;
        });
      });
      setReloadPaths(true);
      return;
    }

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
    setIsDragging(false);
  };

  const handleSvg = async () => {
    setError("");

    if (paths.length === 0 && !imageUrl) {
      setError("Unable to upload blank drawing");
      return;
    }

    setIsLoading(true);

    const updatedPaths = paths.map((path) => ({
      ...path,
      selected: false,
    }));
    setPaths(updatedPaths);
    setReloadPaths(true);

    // pause for the paths to reload
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    await sleep(1);
    // Create a temporary canvas to combine the image and drawings
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 500;
    tempCanvas.height = 500;
    const tempCtx = tempCanvas.getContext("2d");

    // Fill the background with white
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    if (templateType !== "text") {
      // Draw the image canvas onto the temporary canvas
      tempCtx.drawImage(imgCanvasRef.current, 0, 0);
    }

    let dataURL;
    if (imageUrl != "null") {
      // Draw the drawing canvas onto the temporary canvas
      tempCtx.drawImage(canvasRef.current, 0, 0);
      dataURL = tempCanvas.toDataURL("image/png");
    } else {
      // Center the combined canvas content
      const centeredCanvas = centerCanvasDrawing(canvasRef.current);
      dataURL = centeredCanvas.toDataURL("image/png");
    }

    const blob = await fetch(dataURL).then((r) => r.blob());

    try {
      // Call the uploadImage function from api.js
      const response = await uploadImage(blob, templateType);

      setIsLoading(false);
      updateSvgData(response.svgData);
      if (templateType === "custom") {
        updateAdjustStage("remove");
      } else {
        updateAdjustStage("scale");
      }

      updateStage("adjust");
      updateUploadedPaths(paths);
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

    drawImage(
      false,
      imageUrl,
      imgCanvasRef,
      setPaths,
      setReloadPaths,
      templateType
    );
  }, [imageUrl]);

  //will only run when paths or lineWidth changes
  useEffect(() => {
    if (!imageUrl && reloadPaths) {
      const canvas = imgCanvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (reloadPaths) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
      setReloadPaths(false);
    }
    drawPaths(canvasRef, paths, templateType);
  }, [paths, lineWidth, reloadPaths]);

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

    if (imageUrl) {
      drawImage(
        true,
        imageUrl,
        imgCanvasRef,
        setPaths,
        setReloadPaths,
        templateType
      );
    }
    setPaths([]);
  }, [templateType, stage]);

  return (
    <div className="designer">
      <p className="desc">
        {templateType === "text" &&
          `Click inside the editor and type a message to get started`}
        {templateType === "solid" &&
          ` Upload an image (button or drag and drop), or draw with your mouse to
        get started`}
        {templateType === "custom" &&
          `Upload an image (button or drag and drop), or select an editor mode to get started`}
      </p>
      <div className="modes-top">
        <ModeExamples small={true} />
      </div>
      <TypeSelector paths={paths} />
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
            ></Toolbar>
          </div>
          <div className="canvas-container">
            <canvas
              ref={imgCanvasRef}
              width={500}
              height={500}
              className="img-canvas"
              hidden={templateType === "text"}
            />
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="drawing-canvas"
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
