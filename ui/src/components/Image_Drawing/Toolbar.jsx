import { useState } from "react";
import "./Toolbar.css";
import FileUpload from "./FileUpload";
import { FiDownload } from "react-icons/fi";
import { FaDeleteLeft } from "react-icons/fa6";
import { IoMdUndo, IoMdRedo } from "react-icons/io";
import { IoText } from "react-icons/io5";
import { BiSolidPencil } from "react-icons/bi";
import RemoveImage from "./RemoveImage";
import { useSession } from "../../contexts/FileContext";
import DrawTools from "./DrawTools";
import TextTools from "./TextTools";

const Toolbar = ({
  paths,
  setPaths,
  lineWidth,
  setLineWidth,
  setReloadPaths,
  canvasRef,
  mode,
  setMode,
  fontSize,
  setFontSize,
}) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const { updateImageUrl } = useSession();

  const iconSize = 28;

  const handleText = () => {
    setMode(!mode);
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

  return (
    <>
      <div className="toolbar">
        <button title="Switch editor mode" onClick={handleText}>
          {mode && <IoText size={iconSize} />}
          {!mode && <BiSolidPencil size={iconSize} />}
        </button>
        <FileUpload />
        <button title="Remove image" onClick={handleRemoveImage}>
          <RemoveImage />
        </button>
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
        {!mode && (
          <DrawTools
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            iconSize={iconSize}
          />
        )}
        {mode && (
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
    </>
  );
};

export default Toolbar;
