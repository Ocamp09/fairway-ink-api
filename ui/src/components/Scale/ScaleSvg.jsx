import { useState } from "react";
import ImageScaler from "./ImageScaler";
import axios from "axios";
import { useSession } from "../../contexts/DesignContext";
import "./ScaleSvg.css";

const ScaleSvg = ({ svgUrl, svgData, setShowPreview, setShowScale }) => {
  const [scale, setScale] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { updateStl, stlKey, updateStlKey, templateType } = useSession();

  // get svg width and height, scale down to size I want to display
  // then factor that scale into the query sent

  let canvasSizePx;
  if (templateType === "text") {
    canvasSizePx = 110 * scale * 2.5;
  } else {
    canvasSizePx = 110 * scale;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!svgData) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append(
      "svg",
      new Blob([svgData], { type: "image/svg+xml" }),
      "golfball" + stlKey + ".svg"
    );

    if (templateType === "text") {
      formData.append("scale", scale * 2.5);
    } else {
      formData.append("scale", scale);
    }
    updateStl("http://localhost:5001/output/stl/default.stl");

    try {
      const response = await axios.post(
        "http://localhost:5001/generate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        updateStl(response.data.stlUrl);
        updateStlKey();
        setShowPreview(true);
        setShowScale(false);
      } else {
        setError("Error processing file. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while uploading the file.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p>Scale the image to the desired size</p>
      <div className="ball-displays">
        <div className="golf-template">
          {svgUrl && (
            <img
              src={svgUrl}
              alt="Uploaded"
              className="upload-img"
              style={{
                width: `${canvasSizePx}px`, // Set width based on scale
              }}
            />
          )}
        </div>
        <div>
          <p>Life Size</p>
          <div className="golf-real-size">
            {svgUrl && (
              <img
                src={svgUrl}
                alt="Uploaded"
                className="upload-img"
                style={{
                  width: `${(canvasSizePx * 210) / 500}px`, // Set width based on scale
                }}
              />
            )}
          </div>
        </div>
      </div>
      <ImageScaler scale={scale} setScale={setScale}></ImageScaler>
      <form onSubmit={handleSubmit}>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Processing..." : "Upload and Generate STL"}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default ScaleSvg;
