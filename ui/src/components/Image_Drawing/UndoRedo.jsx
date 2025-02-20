import { useState, useEffect } from "react";
import { IoMdUndo, IoMdRedo } from "react-icons/io";
import { useSession } from "../../contexts/DesignContext";

const UndoRedo = ({ paths, setPaths, iconSize, setReloadPaths }) => {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const { templateType } = useSession();

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

  useEffect(() => {
    setRedoStack([]);
    setUndoStack([]);
  }, [templateType]);

  return (
    <>
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
    </>
  );
};

export default UndoRedo;
