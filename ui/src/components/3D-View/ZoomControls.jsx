import React from "react";
import { BiSolidZoomIn, BiSolidZoomOut } from "react-icons/bi";

import "./ZoomControls.css";

const ZoomControls = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="zoom-body">
      <button onClick={onZoomIn}>
        <BiSolidZoomIn color="black" size={32} />
      </button>
      <button onClick={onZoomOut}>
        <BiSolidZoomOut color="black" size={32} />
      </button>
    </div>
  );
};

export default ZoomControls;
