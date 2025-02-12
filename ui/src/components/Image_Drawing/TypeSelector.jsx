import "./TypeSelector.css";

const TypeSelector = ({ type, setType }) => {
  const handleSolid = () => {
    setType("solid");
  };

  const handleMulti = () => {
    setType("multi");
  };
  return (
    <div className="type-selector">
      <button
        className={type === "solid" ? "active" : ""}
        onClick={handleSolid}
      >
        Solid Mode
      </button>
      <button
        className={type === "multi" ? "active" : ""}
        onClick={handleMulti}
      >
        Multi-Color Mode
      </button>
    </div>
  );
};

export default TypeSelector;
