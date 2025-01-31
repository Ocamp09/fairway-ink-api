import React from "react";

const ZoomControls = ({ onZoomIn, onZoomOut }) => {
  return (
    <div
      style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1 }}
    >
      <button onClick={onZoomIn} style={{ marginRight: "5px" }}>
        Zoom In
      </button>
      <button onClick={onZoomOut}>Zoom Out</button>
    </div>
  );
};

export default ZoomControls;
