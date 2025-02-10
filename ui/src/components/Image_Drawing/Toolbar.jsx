import { useState } from "react";
import "./Toolbar.css";
import QuantityDropdown from "../Preview/QuantityDropdown";
import FileUpload from "./FileUpload";
import { FiDownload } from "react-icons/fi";
import { FaDeleteLeft } from "react-icons/fa6";
import { MdLineWeight, MdTextFields } from "react-icons/md";
import { IoMdUndo, IoMdRedo } from "react-icons/io";
import { BiSolidPencil } from "react-icons/bi";
import RemoveImage from "./RemoveImage";
import DrawTools from "./DrawTools";

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
  mode,
  setMode,
}) => {
  const iconSize = 28;

  const handleText = () => {
    setMode(!mode);
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
        <button title="Switch editor mode" onClick={handleText}>
          {mode && <MdTextFields size={iconSize} />}
          {!mode && <BiSolidPencil size={iconSize} />}
        </button>
        {!mode && (
          <DrawTools
            paths={paths}
            setPaths={setPaths}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            setReloadPaths={setReloadPaths}
            setImageUrl={setImageUrl}
            imageUrl={imageUrl}
            iconSize={iconSize}
          />
        )}
        <button title="Download drawings" onClick={saveCanvas}>
          <FiDownload size={iconSize} />
        </button>
      </div>
    </>
  );
};

export default Toolbar;
