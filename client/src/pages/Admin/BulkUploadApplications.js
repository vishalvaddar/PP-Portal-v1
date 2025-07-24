import React, { useState } from "react";
import axios from "axios";
import { FolderUp, Download, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import "./BulkUploadApplications.css";

const BulkUploadApplications = ({ refreshData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logFileUrl, setLogFileUrl] = useState("");
  const [uploadStats, setUploadStats] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(null);
    setMessage("");
    setError("");
    setLogFileUrl("");
    setUploadStats(null);

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop().toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(fileExt)) {
        setError("Only CSV and Excel files (.csv, .xlsx, .xls) are supported.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File size should not exceed 5MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const downloadLogFile = async () => {
    if (!logFileUrl) return;
    const fullUrl = `${process.env.REACT_APP_API_URL}/api/bulk-upload/logs/${logFileUrl}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = logFileUrl;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Error downloading log file:", err);
      setError("Failed to download log file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a valid file to upload.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");
    setUploadStats(null);
    setLogFileUrl("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bulk-upload`,
        formData, {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      
      const data = response.data;
      
      // UPDATED: Calculate total rejections for a clearer summary
      const validationErrorsCount = data.validationErrors || 0;
      const duplicateRecordsCount = data.duplicateRecords || 0;
      const totalRejected = validationErrorsCount + duplicateRecordsCount;
      
      setUploadStats({
        totalRecords: data.totalRecords || 0,
        successfulInserts: data.successfulInserts || 0,
        totalRejected: totalRejected, // New summary stat
        validationErrors: validationErrorsCount, // Detail stat
        duplicateRecords: duplicateRecordsCount, // Detail stat
      });

      setMessage(data.message || "File processed successfully!");
      if (data.logFile) {
        setLogFileUrl(data.logFile);
      }
      if (typeof refreshData === "function") {
        refreshData();
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg = err.response?.data?.message || "An unexpected error occurred.";
      setError(`Upload failed: ${errMsg}`);
      
      if (err.response?.data?.logFile) {
        setLogFileUrl(err.response.data.logFile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <h2><FolderUp size={25} /> Upload Bulk Applications</h2>
      <div className="upload-instructions">
        <h3>Upload a CSV or Excel file with application data.</h3>
        <div className="file-requirements">
          <h5>File Requirements:</h5>
          <ul>
            <li>Format: .csv, .xlsx, or .xls (Max 5MB)</li>
            <li>Required Fields: nmms_year, nmms_reg_number, student_name, father_name, gender, gmat_score, sat_score, app_state, district, nmms_block.</li>
            <li>All records must have an `nmms_year` matching the current year ({new Date().getFullYear()}).</li>
          </ul>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="download-section mt-3">
        <p>📄 Need a sample format?{" "}
          <a href="/sample_bulk_upload.csv" download className="download-link">
            Download Sample CSV
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload" className="form-label">Select File</label>
          <div className="file-input-container">
            <input
              type="file"
              id="file-upload"
              className="form-control"
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
            {file && (
              <div className="selected-file">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !file}>
          {isLoading ? (
            <><span className="spinner-border spinner-border-sm" /> Uploading...</>
          ) : (
            "📤 Upload File"
          )}
        </button>
      </form>
      
      {message && <div className="alert alert-success mt-4">{message}</div>}

      {/* UPDATED: Reworked the stats display for better clarity */}
      {uploadStats && (
        <div className="upload-stats mt-4">
          <h4>Upload Summary</h4>
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-value">{uploadStats.totalRecords}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-box success">
              <CheckCircle size={20} />
              <div className="stat-value">{uploadStats.successfulInserts}</div>
              <div className="stat-label">Added</div>
            </div>
            <div className="stat-box error">
              <XCircle size={20} />
              <div className="stat-value">{uploadStats.totalRejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
          {uploadStats.totalRejected > 0 && (
            <div className="stats-breakdown">
              (Rejected due to: <strong>{uploadStats.validationErrors}</strong> Validation Errors, <strong>{uploadStats.duplicateRecords}</strong> Duplicates)
            </div>
          )}
        </div>
      )}

      {logFileUrl && (
        <div className="log-file-section mt-4">
          <p>For a detailed breakdown of all rejected records, please download the report.</p>
          <button onClick={downloadLogFile} className="btn btn-info">
            <Download size={18} /> Download Complete Report
          </button>
        </div>
      )}
    </div>
  );
};

export default BulkUploadApplications;