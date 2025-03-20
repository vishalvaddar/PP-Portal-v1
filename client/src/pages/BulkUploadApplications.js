import React, { useState } from "react";
import axios from "axios";
import "./BulkUploadApplications.css";

const BulkUploadApplications = ({ refreshData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setError("");
  };

  // Handle file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("⚠ Please select a file to upload.");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.status === 200) {
        setMessage("✅ File uploaded successfully!");
        setFile(null);
        document.getElementById("file-upload").value = "";
        if (typeof refreshData === "function") {
          refreshData();
        }
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      setError(`❌ Upload Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <h2>📂 Bulk Upload Applications</h2>
      <p>Upload a CSV or Excel file containing multiple student applications.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Download Sample CSV Button */}
      <div className="download-section mt-3">
        <p>📄 Need a Sample format? 
          <a href="/sample_bulk_upload.csv" download className="download-link">Download Sample CSV</a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload" className="form-label">Upload File</label>
          <input
            type="file"
            id="file-upload"
            className="form-control"
            onChange={handleFileChange}
            accept=".csv, .xlsx"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Uploading..." : "📤 Upload File"}
        </button>
      </form>
      
      <div className="upload-instructions">
        <h4>📌 Instructions</h4>
        <ul>
          <li>The Bulk Upload file format must be <b>CSV</b>.</li>
          <li>The Bulk Upload file columns should match the sample CSV format to ensure correct data storage.</li>
          <li>Make sure there are no empty rows or missing values in mandatory fields.</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkUploadApplications;
