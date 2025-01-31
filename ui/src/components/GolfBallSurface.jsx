import React, { useState } from "react";

const GolfBallSurface = ({ imageUrl, onSizeChange }) => {
  const [size, setSize] = useState(15);

  const handleSizeChange = (e) => {
    const newSize = parseFloat(e.target.value);
    setSize(newSize);
    onSizeChange(newSize); // Notify parent component of the new size
  };

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
              width: `${(size / 42.67) * 100}%`, // Scale image relative to golf ball size
              height: "auto",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </div>
      <div style={{ marginTop: "10px" }}>
        <label htmlFor="size">Image Size (mm): </label>
        <input
          type="number"
          id="size"
          min="1"
          max="100"
          step="0.1"
          value={size}
          onChange={handleSizeChange}
        />
      </div>
    </div>
  );
};

export default GolfBallSurface;
