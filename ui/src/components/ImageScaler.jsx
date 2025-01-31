import React, { useState } from "react";

const ImageScaler = ({ imageUrl }) => {
  const [scale, setScale] = useState(1);

  const handleScaleChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <h3>Uploaded Image</h3>
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <img
          src={imageUrl}
          alt="Uploaded"
          style={{
            width: `${scale * 100}%`,
            height: "auto",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div style={{ marginTop: "10px" }}>
        <label htmlFor="scale">Scale: </label>
        <input
          type="range"
          id="scale"
          min="0.1"
          max="2"
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
