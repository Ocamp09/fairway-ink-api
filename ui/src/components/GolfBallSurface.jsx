import "../components/GolfBallSurface.css";
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
    <div className="image-body">
      <h3>Golf Ball Template</h3>
      <div className="golf-template">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded"
            className="upload-img"
            style={{
              width: `${imageSizePx}px`, // Set width based on scale
            }}
          />
        )}
      </div>
      <div className="image-body">
        <label htmlFor="scale">Image Scale: </label>
        <input
          type="range"
          id="scale"
          min="0.1" // Minimum scale (10% of original size)
          max="2" // Maximum scale (200% of original size)
          step="0.05" // Granularity of the slider
          value={scale}
          onChange={handleScaleChange}
          className="slider"
        />
        <div className="slider-text">
          Scale: {scale.toFixed(1)} ({(scale * 15).toFixed(1)}mm)
        </div>
      </div>
    </div>
  );
};

export default GolfBallSurface;
