import "./Toolbar.css";
import QuantityDropdown from "../Preview/QuantityDropdown";
import FileUpload from "./FileUpload";
import { FiDownload } from "react-icons/fi";
import { FaDeleteLeft } from "react-icons/fa6";
import { MdLineWeight } from "react-icons/md";
import RemoveImage from "./RemoveImage";

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
  const iconSize = 28;
  const lineLabel = <MdLineWeight size={iconSize} color="white" />;

  const handleZoomIn = () => {
    setScale(scale / scaleMultiplier);
  };

  const handleZoomOut = () => {
    setScale(scale * scaleMultiplier);
  };

  // const handleUndo = () => {
  //   setPaths((prevPaths) => prevPaths.slice(0, -1)); // Remove the last path
  //   setReloadPaths(true);
  // };

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
        <button onClick={handleZoomOut}>Zoom Out</button> */}
        {/* <button onClick={handleUndo}>Undo</button> */}
        <FileUpload imageUrl={imageUrl} setImageUrl={setImageUrl} />
        <button title="Remove image" onClick={handleRemoveImage}>
          <RemoveImage />
        </button>
        <button title="Delete drawings" onClick={handleClear}>
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
