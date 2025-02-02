import { useState } from "react";
import "./App.css";
import FileUpload from "./components/FileUpload";
import GolfBallDisplay from "./components/GolfBallDisplay";
import STLViewer from "./components/STLViewer";
import axios from "axios";

function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [svgUrl, setSvgUrl] = useState(null);
  const [stlUrl, setStlUrl] = useState(
    "http://localhost:5001/output/stl/default.stl"
  );
  const [imageScale, setimageScale] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSizeChange = (size) => {
    setimageScale(size); // Update the image size state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!svgUrl) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("filename", svgUrl.split("/")[5]);
    formData.append("scale", imageScale);
    console.log("Gen Filename: ", svgUrl.split("/")[5]);
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
        setStlUrl(response.data.stlUrl);
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
    <>
      <div className="body">
        <h1>Golf Marker</h1>
        <FileUpload imageUrl={imageUrl} setImageUrl={setImageUrl}></FileUpload>
        <div className="golf-ball-surface">
          <GolfBallDisplay
            imageUrl={imageUrl}
            svgUrl={svgUrl}
            setSvgUrl={setSvgUrl}
            onSizeChange={handleSizeChange}
          />
        </div>
        <form onSubmit={handleSubmit}>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? "Processing..." : "Upload and Generate STL"}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <div className="stl-viewer">
          {stlUrl && <STLViewer stlUrl={stlUrl} />}
        </div>
      </div>
    </>
  );
}

export default App;
