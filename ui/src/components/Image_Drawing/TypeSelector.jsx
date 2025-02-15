import "./TypeSelector.css";
import { useSession } from "../../contexts/DesignContext";

const TypeSelector = () => {
  const { templateType, updateTemplateType, updateEditorMode } = useSession();
  const handleSolid = () => {
    updateTemplateType("solid");
    updateEditorMode("draw");
  };

  const handleText = () => {
    updateTemplateType("text");
    updateEditorMode("type");
  };

  const handleCustom = () => {
    updateTemplateType("custom");
    updateEditorMode("draw");
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
