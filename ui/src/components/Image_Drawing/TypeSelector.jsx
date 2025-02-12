import "./TypeSelector.css";

const TypeSelector = ({ type, setType, setEditorMode }) => {
  const handleSolid = () => {
    setType("solid");
    setEditorMode(false);
  };

  const handleText = () => {
    setType("text");
    setEditorMode(true);
  };

  const handleMulti = () => {
    setType("multi");
    setEditorMode(false);
  };

  return (
    <div className="type-selector">
      <button
        className={type === "solid" ? "active" : ""}
        onClick={handleSolid}
      >
        Solid
      </button>
      <button className={type === "text" ? "active" : ""} onClick={handleText}>
        Text Only
      </button>
      {/* <button
        className={type === "multi" ? "active" : ""}
        onClick={handleMulti}
      >
        Multi-Color Mode
      </button> */}
    </div>
  );
};

export default TypeSelector;
