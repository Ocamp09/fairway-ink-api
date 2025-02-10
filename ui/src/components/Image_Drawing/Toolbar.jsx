import { useState } from "react";
import "./Toolbar.css";
import QuantityDropdown from "../Preview/QuantityDropdown";
import FileUpload from "./FileUpload";
import { FiDownload } from "react-icons/fi";
import { FaDeleteLeft } from "react-icons/fa6";
import { MdLineWeight } from "react-icons/md";
import { IoMdUndo, IoMdRedo } from "react-icons/io";
import RemoveImage from "./RemoveImage";

const Toolbar = ({
  paths,
  setPaths,
  lineWidth,
  setLineWidth,
  setReloadPaths,
  setScale,
  scale,
  setImageUrl,
  imageUrl,
  canvasRef,
}) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const scaleMultiplier = 0.8;
  const iconSize = 28;
  const lineLabel = <MdLineWeight size={iconSize} color="white" />;

  const handleZoomIn = () => {
    setScale(scale / scaleMultiplier);
  };

  const handleZoomOut = () => {
    setScale(scale * scaleMultiplier);
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      const lastPath = paths.pop();
      setUndoStack([...undoStack, lastPath]);
      setRedoStack([lastPath, ...redoStack]); // Preserve redo history
      setPaths([...paths]); // Trigger re-render with modified paths
      setReloadPaths(true);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextPath = redoStack.shift();
      setPaths([...paths, nextPath]);
      setUndoStack([...undoStack, nextPath]); // Update undo stack
      setRedoStack([...redoStack]); // Trigger re-render with modified paths
      setReloadPaths(true);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setReloadPaths(true);
  };

  const handleClear = () => {
    setUndoStack([...undoStack, ...paths]);
    setRedoStack([]); // Clear redo stack on clear
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
        <FileUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
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
        <QuantityDropdown
          maxQuantity={20}
          labelText={lineLabel}
          step={2}
          quantity={lineWidth}
          setQuantity={setLineWidth}
          title={"Adjust line width"}
        />
        <button title="Download drawings" onClick={saveCanvas}>
          <FiDownload size={iconSize} />
        </button>
      </div>
    </>
  );
};

export default Toolbar;
