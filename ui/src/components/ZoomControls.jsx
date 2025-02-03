import React from "react";
import "./ZoomControls.css";

const ZoomControls = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="zoom-body">
      <button onClick={onZoomIn} className="zoom-button">
        Zoom In
      </button>
      <button onClick={onZoomOut}>Zoom Out</button>
    </div>
  );
};

export default ZoomControls;
