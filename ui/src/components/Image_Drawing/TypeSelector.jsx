import "./TypeSelector.css";
import { useSession } from "../../contexts/DesignContext";

const TypeSelector = ({ paths }) => {
  const {
    updateUploadedPaths,
    templateType,
    updateTemplateType,
    updateEditorMode,
  } = useSession();

  const handleSolid = () => {
    updateTemplateType("solid");
    updateEditorMode("draw");
    updateUploadedPaths(paths);
  };

  const handleText = () => {
    updateTemplateType("text");
    updateEditorMode("type");
    updateUploadedPaths(paths);
  };

  const handleCustom = () => {
    updateTemplateType("custom");
    updateEditorMode("draw");
    updateUploadedPaths(paths);
  };

  return (
    <div className="type-selector">
      <button
        className={templateType === "solid" ? "active" : ""}
        onClick={handleSolid}
      >
        Solid
      </button>
      <button
        className={templateType === "text" ? "active" : ""}
        onClick={handleText}
      >
        Text Only
      </button>
      <button
        className={templateType === "custom" ? "active" : ""}
        onClick={handleCustom}
      >
        Custom
      </button>
    </div>
  );
};

export default TypeSelector;
