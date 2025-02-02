import "../components/GolfBallDisplay.css";
import { useState } from "react";
import ImageEditor from "./ImageEditor";
import ImageScaler from "./ImageScaler";
import STLViewer from "./STLViewer";
import axios from "axios";

const GolfBallDisplay = ({ imageUrl }) => {
  const [scale, setScale] = useState(1);
  const [svgUrl, setSvgUrl] = useState(null);
  const [svgData, setSvgData] = useState(null);
  const [stlUrl, setStlUrl] = useState(
    "http://localhost:5001/output/stl/default.stl"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stlKey, setStlKey] = useState(0); // Add a key state

  const canvasSizePx = 400 * scale;

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
    formData.append("scale", scale);
    setStlUrl("http://localhost:5001/output/stl/default.stl");

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
        console.log(response.data);
        setStlUrl(response.data.stlUrl);
        setStlKey((prevKey) => prevKey + 1);
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
      <div className="image-body">
        <h3>Image Editor</h3>
        <ImageEditor
          imageUrl={imageUrl}
          setSvgUrl={setSvgUrl}
          setSvgData={setSvgData}
        ></ImageEditor>

        <h3>Marker Preview</h3>
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
        <ImageScaler scale={scale} setScale={setScale}></ImageScaler>
      </div>
      <div className="stl-viewer">
        <form onSubmit={handleSubmit}>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Processing..." : "Upload and Generate STL"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <div className="stl-viewer">
          {stlUrl && <STLViewer key={stlKey} stlUrl={stlUrl} />}
        </div>
      </div>
    </div>
  );
};

export default GolfBallDisplay;
