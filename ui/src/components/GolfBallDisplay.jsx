import "../components/GolfBallDisplay.css";
import { useState } from "react";
import ImageEditor from "./ImageEditor";

const GolfBallDisplay = ({ imageUrl, svgUrl, setSvgUrl, onSizeChange }) => {
  const [scale, setScale] = useState(1);

  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    onSizeChange(newScale);
  };

  // Calculate the size of the image in pixels based on the scale
  const imageSizePx = (scale * 7 * 300) / 25.4;

  return (
    <div className="image-body">
      <h3>Image Editor</h3>
      <ImageEditor imageUrl={imageUrl} setSvgUrl={setSvgUrl}></ImageEditor>

      <h3>Marker Preview</h3>
      <div className="golf-template">
        {svgUrl && (
          <img
            src={svgUrl}
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

export default GolfBallDisplay;
