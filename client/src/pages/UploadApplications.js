import React, { useState } from "react";
import axios from "axios";
import "./BulkUploadApplications.css"; // Ensure this CSS file is imported

const BulkUploadApplications = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage(response.data.message);
    } catch (error) {
      setMessage(
        `Error: ${error.response?.data?.message || "Failed to upload file"}`
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="bulk-upload-container">
      <h2>Bulk Upload Applications</h2>
      <p>
        Use the form below to upload a CSV or Excel file containing multiple
        student applications.
      </p>

      {message && <div className="alert alert-info mt-3">{message}</div>}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload" className="form-label mt-4">
            Upload File
          </label>
          <input
            type="file"
            id="file-upload"
            className="form-control"
            onChange={handleFileChange}
            accept=".csv"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary mt-3"
          disabled={isLoading}
        >
          {isLoading ? "Uploading..." : "Upload File"}
        </button>
      </form>
      <div className="instructions mt-4">
        <h3>Instructions</h3>
        <ul>
          <li>Ensure your file is in CSV format.</li>
          <li>
            Include headers: NMMS Reg Number, Name, Father's Name, Gender, Year,
            GMAT Score, SAT Score, Date of Birth.
          </li>
          <li>Review the file for errors before uploading.</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkUploadApplications;
