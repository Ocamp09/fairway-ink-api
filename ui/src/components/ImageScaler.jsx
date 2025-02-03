import React, { useState } from "react";

const ImageScaler = ({ scale, setScale }) => {
  const handleScaleChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <div style={{ marginTop: "10px" }}>
        <label htmlFor="scale">Scale: </label>
        <input
          type="range"
          id="scale"
          min="0.1"
          max="4"
          step="0.1"
          value={scale}
          onChange={handleScaleChange}
        />
        <span> {scale.toFixed(1)}x</span>
      </div>
    </div>
  );
};

export default ImageScaler;
