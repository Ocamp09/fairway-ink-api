import "../components/GolfBallDisplay.css";
import { useEffect, useState } from "react";
import ImageEditor from "./ImageEditor";
import ImageScaler from "./ImageScaler";
import STLViewer from "./STLViewer";
import axios from "axios";
import TabMenu from "./TabMenu";
import { useCart } from "./CartContext";

const GolfBallDisplay = () => {
  const [scale, setScale] = useState(1);
  const [svgUrl, setSvgUrl] = useState(null);
  const [svgData, setSvgData] = useState(null);
  const [stlUrl, setStlUrl] = useState(
    "http://localhost:5001/output/stl/default.stl"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stlKey, setStlKey] = useState(0);
  const [showDesign, setShowDesign] = useState(true);
  const [showScale, setShowScale] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [paths, setPaths] = useState([]);

  const { addToCart } = useCart();

  // get svg width and height, scale down to size I want to display, then factor that scale into the query sent
  const canvasSizePx = 125 * scale;

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
    <div className="golf-ball-display">
      <TabMenu
        showDesign={showDesign}
        setShowDesign={setShowDesign}
        showScale={showScale}
        setShowScale={setShowScale}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
      />
      <div className="image-body">
        {showDesign && (
          <div>
            <ImageEditor
              setSvgUrl={setSvgUrl}
              setSvgData={setSvgData}
              setShowDesign={setShowDesign}
              setShowScale={setShowScale}
              showDesign={showDesign}
              paths={paths}
              setPaths={setPaths}
            ></ImageEditor>{" "}
          </div>
        )}

        {showScale && (
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
                        width: `${(canvasSizePx * 173) / 500}px`, // Set width based on scale
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <ImageScaler scale={scale} setScale={setScale}></ImageScaler>
            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Upload and Generate STL"}
              </button>
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>
        )}
      </div>
      {showPreview && (
        <div className="stl-viewer">
          <p>3-d Render Preview</p>
          {stlUrl && <STLViewer key={stlKey} stlUrl={stlUrl} />}
          <button
            onClick={() => {
              addToCart(stlUrl);
            }}
            className="submit-button"
            disabled={isLoading}
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default GolfBallDisplay;
