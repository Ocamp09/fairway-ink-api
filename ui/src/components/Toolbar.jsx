import "./Toolbar.css";

const Toolbar = ({ setPaths, lineWidth, setLineWidth, setReloadPaths }) => {
  const handleUndo = () => {
    setPaths((prevPaths) => prevPaths.slice(0, -1)); // Remove the last path
    setReloadPaths(true);
  };

  const handleClear = () => {
    setPaths([]); // Clear all paths
    setReloadPaths(true);
  };

  //   const handleFill = () => {
  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext("2d");
  //     context.fillStyle = color;
  //     context.fillRect(0, 0, canvas.width, canvas.height);
  //   };

  return (
    <div className="toolbar">
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleClear}>Clear</button>
      <label className="toolbar-text" htmlFor="lineWidth">
        Line Width:
      </label>
      <input
        type="number"
        id="lineWidth"
        min={1}
        max={20}
        value={lineWidth}
        onChange={(e) => setLineWidth(Number(e.target.value))}
      />
    </div>
  );
};
export default Toolbar;
