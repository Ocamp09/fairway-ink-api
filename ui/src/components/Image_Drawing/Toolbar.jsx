import { useEffect, useState } from "react";
import "./Toolbar.css";
import FileUpload from "./FileUpload";
import { FiDownload } from "react-icons/fi";
import { FaDeleteLeft } from "react-icons/fa6";
import { IoMdUndo, IoMdRedo } from "react-icons/io";
import { IoText } from "react-icons/io5";
import { BiSolidPencil } from "react-icons/bi";
import RemoveImage from "./RemoveImage";
import { useSession } from "../../contexts/DesignContext";
import DrawTools from "./DrawTools";
import TextTools from "./TextTools";

const Toolbar = ({
  paths,
  setPaths,
  lineWidth,
  setLineWidth,
  setReloadPaths,
  canvasRef,
  fontSize,
  setFontSize,
}) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const {
    imageUrl,
    updateImageUrl,
    templateType,
    editorMode,
    updateEditorMode,
  } = useSession();

  const iconSize = 28;

  const handleText = () => {
    updateEditorMode("type");
  };

  const handleDraw = () => {
    updateEditorMode("draw");
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      const lastPath = paths.pop();
      setUndoStack([...undoStack, lastPath]);
      setRedoStack([lastPath, ...redoStack]);
      setPaths([...paths]);
      setReloadPaths(true);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextPath = redoStack.shift();
      setPaths([...paths, nextPath]);
      setUndoStack([...undoStack, nextPath]);
      setRedoStack([...redoStack]);
      setReloadPaths(true);
    }
  };

  const handleRemoveImage = () => {
    updateImageUrl(null);
    setReloadPaths(true);
  };

  const handleClear = () => {
    setUndoStack([...undoStack, ...paths]);
    setRedoStack([]);
    setPaths([]);
    setReloadPaths(true);
  };

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setRedoStack([]);
    setUndoStack([]);
  }, [templateType]);

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

  const shouldHideTools =
    (templateType === "solid" || templateType === "text") && screenWidth < 750;

  return (
    <div className="tools">
      <div className="tool-top" hidden={shouldHideTools}>
        <button
          title="Activate drawing mode"
          onClick={handleDraw}
          className={editorMode === "draw" ? "editor-but-active" : "editor-but"}
          hidden={templateType == "text"}
        >
          <BiSolidPencil
            size={iconSize}
            color={editorMode === "draw" ? "white" : "black"}
          />
        </button>
        <button
          title="Activate text mode"
          onClick={handleText}
          className={editorMode === "type" ? "editor-but-active" : "editor-but"}
          hidden={templateType == "solid"}
        >
          <IoText
            size={iconSize}
            color={editorMode === "type" ? "white" : "black"}
          />
        </button>
      </div>
      <div className="toolbar">
        {templateType != "text" && (
          <>
            <FileUpload />
            <button
              title="Remove image"
              onClick={handleRemoveImage}
              disabled={!imageUrl}
            >
              <RemoveImage />
            </button>
          </>
        )}
        <button title="Undo" onClick={handleUndo} disabled={paths.length === 0}>
          <IoMdUndo size={iconSize} />
        </button>
        <button
          title="Redo"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
        >
          <IoMdRedo size={iconSize} />
        </button>
        <button
          title="Delete drawings"
          onClick={handleClear}
          disabled={paths.length === 0}
        >
          <FaDeleteLeft size={iconSize} />
        </button>
        {editorMode == "draw" && (
          <DrawTools
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            iconSize={iconSize}
          />
        )}
        {editorMode == "type" &&
          (templateType === "text" || templateType === "custom") && (
            <TextTools
              fontSize={fontSize}
              setFontSize={setFontSize}
              iconSize={iconSize}
            />
          )}
        <button title="Download drawings" onClick={saveCanvas}>
          <FiDownload size={iconSize} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
