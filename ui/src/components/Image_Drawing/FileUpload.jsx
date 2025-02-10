import { useState, useRef } from "react";
import { FaImage } from "react-icons/fa6";
import { useSession } from "../../contexts/FileContext";
import "./FileUpload.css";
import "./ImageEditor.css";

const FileUpload = () => {
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const { updateUrl } = useSession();

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
    updateUrl(URL.createObjectURL(selectedFile));
  };

  const handleUploadClick = () => {
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload-container">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".png,.jpg,.jpeg,.svg"
        ref={fileInputRef}
        hidden
      />
      <button title="Upload image" onClick={handleUploadClick}>
        <FaImage size={28} />
      </button>
      {error && <p className="file-error-message">{error}</p>}
    </div>
  );
};

export default FileUpload;
