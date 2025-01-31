import React, { useState } from "react";

const GolfBallSurface = ({ imageUrl, onSizeChange }) => {
  const [scale, setScale] = useState(1); // Default scale is 1 (15mm)

  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    onSizeChange(newScale); // Notify parent component of the new scale
  };

  // Calculate the size of the image in pixels based on the scale
  const imageSizePx = (scale * 7 * 300) / 25.4; // Convert mm to pixels (300 DPI)

  return (
    <div style={{ margin: "20px 0", textAlign: "center" }}>
      <h3>Golf Ball Template</h3>
      <div
        style={{
          width: "200px", // Fixed size for display
          height: "200px",
          borderRadius: "50%",
          border: "2px solid black",
          position: "relative",
          margin: "0 auto",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
        }}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{
              width: `${imageSizePx}px`, // Set width based on scale
              height: "auto",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "100%", // Ensure the image does not exceed the golf ball template
              maxHeight: "100%",
            }}
          />
        )}
      </div>
      <div style={{ marginTop: "10px", width: "200px", margin: "0 auto" }}>
        <label htmlFor="scale">Image Scale: </label>
        <input
          type="range"
          id="scale"
          min="0.1" // Minimum scale (10% of original size)
          max="2" // Maximum scale (200% of original size)
          step="0.1" // Granularity of the slider
          value={scale}
          onChange={handleScaleChange}
          style={{ width: "100%" }} // Make the slider fill the container
        />
        <div style={{ marginTop: "5px", fontSize: "0.9em" }}>
          Scale: {scale.toFixed(1)} ({(scale * 15).toFixed(1)}mm)
        </div>
      </div>
    </div>
  );
};

export default GolfBallSurface;
