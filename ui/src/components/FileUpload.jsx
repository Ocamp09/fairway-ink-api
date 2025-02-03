import { useState } from "react";
import "./FileUpload.css";

const FileUpload = ({ setImageUrl }) => {
  const [error, setError] = useState("");

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
  ];
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
    setImageUrl(URL.createObjectURL(selectedFile));
  };

  return (
    <div className="file-upload-container">
      <h3>Upload an Image</h3>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".png,.jpg,.jpeg,.svg"
      />
      {error && <p className="file-error-message">{error}</p>}
    </div>
  );
};

export default FileUpload;
