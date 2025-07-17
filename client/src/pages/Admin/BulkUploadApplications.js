import React, { useState } from "react";
import axios from "axios";
import { FolderUp } from "lucide-react";
import * as XLSX from "xlsx"; // Import xlsx library
import "./BulkUploadApplications.css";

const BulkUploadApplications = ({ refreshData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationReport, setValidationReport] = useState(null);
  const [logFileUrl, setLogFileUrl] = useState("");
  const [uploadStats, setUploadStats] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(null); // Clear previous file first
    setMessage("");
    setError("");
    setValidationReport(null);
    setLogFileUrl("");
    setUploadStats(null);

    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop().toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(fileExt)) {
        setError("Only CSV and Excel files (.csv, .xlsx, .xls) are supported.");
        return;
      }

      try {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length > 0) {
          const nmmsYearData = json[0]["nmms_year"];
          const currentYear = new Date().getFullYear();
          const uploadedYear = parseInt(nmmsYearData, 10);

          if (nmmsYearData && !isNaN(uploadedYear)) {
            if (uploadedYear < currentYear) {
              setError(
                `❌ Upload blocked: NMMS year is ${uploadedYear}, which is earlier than current year (${currentYear}).`
              );
              return;
            }
          }
        }

        setFile(selectedFile); // Only set file if valid
      } catch (err) {
        console.error("Error reading file for year check:", err);
        setError("Error reading file content. Please ensure it's a valid CSV/Excel.");
      }
    }
  };

  const downloadLogFile = async () => {
    if (!logFileUrl) return;

    const fullUrl = `${process.env.REACT_APP_API_URL}/logs/${logFileUrl}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Failed to download log file");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = logFileUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
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

    const fileExt = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileExt)) {
      setError("Only CSV and Excel files (.csv, .xlsx, .xls) are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/bulk-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`Upload Progress: ${percentCompleted}%`);
          },
        }
      );

      const data = response.data;

      setUploadStats({
        totalRecords: data.totalRecords || 0,
        submittedApplications: data.submittedApplications || 0,
        rejectedApplications: data.rejectedApplications || 0,
        duplicateRecords: data.duplicateRecords || 0,
      });

      if (data.validationErrors?.length) {
        setValidationReport({
          fileName: file.name,
          errors: data.validationErrors,
          totalRecords: data.totalRecords,
          validRecords: data.validRecords,
          invalidRecords: data.invalidRecords,
        });
      }

      setMessage(data.message || "File uploaded successfully!");
      if (data.logFile) {
        setLogFileUrl(data.logFile);
      }

      if (typeof refreshData === "function") {
        refreshData();
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errMsg = err.response?.data?.message || err.message;
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
      <h2>
        <FolderUp size={25} /> Bulk Upload Applications
      </h2>

      <div className="upload-instructions">
        <h3>Upload a CSV or Excel file containing multiple student applications.</h3>
        <div className="file-requirements">
          <h5>File Requirements:</h5>
          <ul>
            <li>Format: .csv, .xlsx, or .xls</li>
            <li>Fields: NMMS Year, Registration Number, Student Name, Father's Name, Gender, GMAT Score, SAT Score</li>
            <li>Registration Numbers must be unique</li>
          </ul>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="download-section mt-3">
        <p>
          📄 Need a Sample format?{" "}
          <a href="/sample_bulk_upload.csv" download className="download-link">
            Download Sample CSV
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload" className="form-label">
            Select File to Upload
          </label>
          <div className="file-input-container">
            <input
              type="file"
              id="file-upload"
              className="form-control"
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
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
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              <span className="ms-2">Uploading...</span>
            </>
          ) : (
            <>📤 Upload File</>
          )}
        </button>
      </form>

      {uploadStats && (
        <div className="upload-stats mt-4">
          <h4>Upload Summary</h4>
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-value">{uploadStats.totalRecords}</div>
              <div className="stat-label">Total Records</div>
            </div>
            <div className="stat-box success">
              <div className="stat-value">{uploadStats.submittedApplications}</div>
              <div className="stat-label">Successfully Added</div>
            </div>
            <div className="stat-box error">
              <div className="stat-value">{uploadStats.rejectedApplications}</div>
              <div className="stat-label">Rejected</div>
            </div>
            {uploadStats.duplicateRecords > 0 && (
              <div className="stat-box warning">
                <div className="stat-value">{uploadStats.duplicateRecords}</div>
                <div className="stat-label">Duplicates</div>
              </div>
            )}
          </div>
        </div>
      )}

      {validationReport && (
        <div className="validation-report mt-4">
          <h4>Validation Issues</h4>
          <p>The following issues were found in your file:</p>
          <ul className="validation-errors">
            {validationReport.errors.slice(0, 5).map((err, idx) => (
              <li key={idx} className="error-item">
                <div className="error-row">Row {err.row}</div>
                <div className="error-details">
                  <span className="error-field">{err.field}:</span> {err.message}
                  {err.value && <span className="error-value"> (You entered: {err.value})</span>}
                </div>
              </li>
            ))}
            {validationReport.errors.length > 5 && (
              <li className="more-errors">
                ...and {validationReport.errors.length - 5} more. Download the report for details.
              </li>
            )}
          </ul>
        </div>
      )}

      {logFileUrl && (
        <div className="log-file-section mt-3">
          <button onClick={downloadLogFile} className="btn btn-info">
            📝 Download Complete Report
          </button>
          <p className="mt-1 small text-muted">
            The report includes all errors, warnings, and suggested fixes.
          </p>
        </div>
      )}

      <div className="help-section mt-4">
        <h5>Need Help?</h5>
        <ul>
          <li>Ensure all required fields are filled.</li>
          <li>Use DD-MM-YYYY format for dates.</li>
          <li>Phone numbers must be 10 digits.</li>
          <li>Each Registration Number must be unique.</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkUploadApplications;
