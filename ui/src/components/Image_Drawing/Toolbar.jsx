import "./Toolbar.css";
import QuantityDropdown from "../Preview/QuantityDropdown";
import FileUpload from "./FileUpload";

const Toolbar = ({
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
  const scaleMultiplier = 0.8;

  const handleZoomIn = () => {
    setScale(scale / scaleMultiplier);
  };

  const handleZoomOut = () => {
    setScale(scale * scaleMultiplier);
  };

  const handleUndo = () => {
    setPaths((prevPaths) => prevPaths.slice(0, -1)); // Remove the last path
    setReloadPaths(true);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setReloadPaths(true);
  };

  const handleClear = () => {
    setPaths([]); // Clear all paths
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

  //   const handleFill = () => {
  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext("2d");
  //     context.fillStyle = color;
  //     context.fillRect(0, 0, canvas.width, canvas.height);
  //   };

  return (
    <>
      <div className="toolbar">
        {/* <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
        <button onClick={handleUndo}>Undo</button> */}
        <FileUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
        <button onClick={saveCanvas}>Save Drawing</button>
        <button onClick={handleRemoveImage}>Remove image</button>
        <button onClick={handleClear}>Clear</button>
        <QuantityDropdown
          maxQuantity={20}
          labelText="Line Width: "
          step={2}
          quantity={lineWidth}
          setQuantity={setLineWidth}
        />
      </div>
    </>
  );
};
export default Toolbar;
