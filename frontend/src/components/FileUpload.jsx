import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Allowed file types and maximum file size (5MB)
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload a PNG, JPEG, or JPG file.");
      return;
    }

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      setError("File size is too large. Maximum size is 5MB.");
      return;
    }

    // Clear errors and set the file
    setError("");
    setFile(selectedFile);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send the file to the backend
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle the response (e.g., download the G-code file)
      if (response.data.success) {
        alert("File processed successfully!");
        // Optionally, provide a download link for the G-code file
        const downloadUrl = response.data.downloadUrl;
        window.location.href = downloadUrl;
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
      <h1>Upload an Image</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".png,.jpg,.jpeg"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Upload and Generate G-code"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default FileUpload;
