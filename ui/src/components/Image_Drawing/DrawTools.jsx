import { useState } from "react";
import FileUpload from "./FileUpload";
import { FaDeleteLeft } from "react-icons/fa6";
import { IoMdUndo, IoMdRedo } from "react-icons/io";
import RemoveImage from "./RemoveImage";
import QuantityDropdown from "../Preview/QuantityDropdown";
import { MdLineWeight } from "react-icons/md";

const DrawTools = ({
  paths,
  setPaths,
  lineWidth,
  setLineWidth,
  setReloadPaths,
  setImageUrl,
  imageUrl,
  iconSize,
}) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const lineLabel = <MdLineWeight size={iconSize} color="white" />;

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
  return (
    <>
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
    </>
  );
};

export default DrawTools;
