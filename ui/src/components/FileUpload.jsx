import React, { useState } from "react";
import axios from "axios";
import STLViewer from "./STLViewer";
import GolfBallSurface from "./GolfBallSurface";
import "./FileUpload.css"; // Import the CSS file

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stlUrl, setStlUrl] = useState(
    "http://localhost:5000/output/stl/default.stl"
  );
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState(42.67); // Default size matches golf ball diameter

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a PNG, JPEG, or JPG file.");
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setError("File size is too large. Maximum size is 5MB.");
      return;
    }

    setError("");
    setFile(selectedFile);
    setImageUrl(URL.createObjectURL(selectedFile));
  };

  const handleSizeChange = (size) => {
    setImageSize(size); // Update the image size state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("size", imageSize); // Send the image size to the backend

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
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
    <div className="file-upload-container">
      <h3>Upload an Image</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".png,.jpg,.jpeg"
        />
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Processing..." : "Upload and Generate STL"}
        </button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <div className="displays">
        {/* Display the golf ball surface and image size input */}
        <div className="golf-ball-surface">
          <GolfBallSurface
            imageUrl={imageUrl}
            onSizeChange={handleSizeChange}
          />
        </div>

        {/* Render the STL file if available */}
        <div className="stl-viewer">
          {stlUrl && <STLViewer stlUrl={stlUrl} />}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
