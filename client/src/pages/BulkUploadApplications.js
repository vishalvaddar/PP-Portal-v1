import React, { useState } from "react";
import axios from "axios";
import "./BulkUploadApplications.css";

const BulkUploadApplications = ({ refreshData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationReport, setValidationReport] = useState(null);
  const [logFileUrl, setLogFileUrl] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setError("");
    setValidationReport(null);
    setLogFileUrl("");
  };

  const downloadLogFile = async () => {
    if (!logFileUrl) return;

    const baseUrl = "http://localhost:5000";
    const fullUrl = `${baseUrl}/logs/${logFileUrl}`;

    try {
      const response = await fetch(fullUrl);
      const text = await response.text();

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = logFileUrl;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading log file:", error);
    }
  };

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

      if (response.status === 200 || response.status === 207) {
        if (response.data.validationErrors && response.data.validationErrors.length > 0) {
          setValidationReport({
            fileName: file.name,
            totalRecords: response.data.totalRecords,
            validRecords: response.data.validRecords,
            invalidRecords: response.data.invalidRecords,
            errors: response.data.validationErrors,
          });
          setMessage(`⚠ File processed with ${response.data.validationErrors.length} validation errors.`);
        } else {
          setMessage("✅ File uploaded successfully!");
          setFile(null);
          document.getElementById("file-upload").value = "";
          if (typeof refreshData === "function") {
            refreshData();
          }
        }

        if (response.data.logFile) {
          setLogFileUrl(response.data.logFile);
        }
      } else {
        throw new Error("Failed to upload file");
      }
    } catch (error) {
      const backendMessage = error.response?.data?.message || error.message;
      let userFriendlyMessage = "❌ Upload Error: ";

      if (
        backendMessage.includes("duplicate key value violates unique constraint") &&
        backendMessage.includes("nmms_reg_number")
      ) {
        userFriendlyMessage +=
          "One or more students in your file have duplicate NMMS Registration Numbers that already exist in the system. Please make sure each NMMS Reg Number is unique.";
      } else {
        userFriendlyMessage += backendMessage;
      }

      setError(userFriendlyMessage);

      if (error.response?.data?.validationErrors) {
        setValidationReport({
          fileName: file.name,
          errors: error.response.data.validationErrors,
          totalRecords: error.response.data.totalRecords,
          validRecords: error.response.data.validRecords,
          invalidRecords: error.response.data.invalidRecords,
        });
        setMessage(`⚠ File processed with validation errors.`);
      }

      if (error.response?.data?.logFile) {
        setLogFileUrl(error.response.data.logFile);
      }
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

      {validationReport && (
        <div className="validation-report mt-4">
          <h4>Validation Report</h4>
          <p>File: {validationReport.fileName}</p>
          <p>Total Records: {validationReport.totalRecords}</p>
          <p>Valid Records: {validationReport.validRecords}</p>
          <p>Invalid Records: {validationReport.invalidRecords}</p>

          <div className="error-list mt-3">
            <h5>Top Errors:</h5>
            <ul>
              {validationReport.errors.slice(0, 5).map((error, index) => (
                <li key={index}>
                  <strong>Row {error.row}:</strong> {error.message} (Field: {error.field})
                </li>
              ))}
              {validationReport.errors.length > 5 && (
                <li>...and {validationReport.errors.length - 5} more errors</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {logFileUrl && (
        <div className="log-file-section mt-3">
          <button onClick={downloadLogFile} className="btn btn-secondary">
            📝 Download Detailed Log File
          </button>
          <p className="mt-1 small text-muted">
            Contains complete details of the upload process including all errors and successful records.
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkUploadApplications;
