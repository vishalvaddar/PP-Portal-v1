import React, { useState } from "react";
import axios from "axios";
import { FolderUp } from "lucide-react";
import "./BulkUploadApplications.css";

const BulkUploadApplications = ({ refreshData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationReport, setValidationReport] = useState(null);
  const [logFileUrl, setLogFileUrl] = useState("");
  const [uploadStats, setUploadStats] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setError("");
    setValidationReport(null);
    setLogFileUrl("");
    setUploadStats(null);
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

    // Check file extension
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      setError("⚠ Only CSV and Excel files (xlsx, xls) are supported.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Set upload statistics
      setUploadStats({
        totalRecords: response.data.totalRecords || 0,
        submittedApplications: response.data.submittedApplications || 0,
        rejectedApplications: response.data.rejectedApplications || 0,
        duplicateRecords: response.data.duplicateRecords || 0
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
      } else if (
        backendMessage.includes('null value in column "nmms_reg_number"') &&
        backendMessage.includes("violates not-null constraint")
      ) {
        userFriendlyMessage +=
          "One or more records in your file are missing the required NMMS Registration Number. Please ensure this field is filled for all students before uploading again.";
      } else if ( // Add this else if block
        backendMessage.includes('null value in column "nmms_year"') &&
        backendMessage.includes("violates not-null constraint")
      ) {
        userFriendlyMessage +=
          "One or more records in your file are missing the required NMMS Year. Please ensure this field is filled and contains a valid year for all students before uploading again.";
      } else {
        // Keep a fallback for other errors, but maybe simplify it slightly
        userFriendlyMessage += "An unexpected issue occurred during the upload. Please check the file or contact support if the problem persists.";
        // Optionally log the technical backendMessage for debugging
        console.error("Detailed upload error:", backendMessage);
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
      <h2><FolderUp size={25} /> Bulk Upload Applications</h2>
      <div className="upload-instructions">
        <h3>Upload a CSV or Excel file containing multiple student applications.</h3>
        <div className="file-requirements">
          <h5>File Requirements:</h5>
          <ul>
            <li>File must be in CSV or Excel format (.csv, .xlsx, .xls)</li>
            <li>Required fields: NMMS Year, Registration Number, Student Name, Father's Name, Gender, GMAT Score, SAT Score</li>
            <li>Each Registration Number must be unique</li>
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
          <label htmlFor="file-upload" className="form-label">Select File to Upload</label>
          <div className="file-input-container">
            <input
              type="file"
              id="file-upload"
              className="form-control"
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
            />
            {file && <div className="selected-file">Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</div>}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
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

          <div className="error-list mt-3">
            <ul className="validation-errors">
              {validationReport.errors.slice(0, 5).map((error, index) => (
                <li key={index} className="error-item">
                  <div className="error-row">Row {error.row}</div>
                  <div className="error-details">
                    <span className="error-field">{error.field}:</span> {error.message}
                    {error.value && <span className="error-value">You entered: {error.value}</span>}
                  </div>
                </li>
              ))}
              {validationReport.errors.length > 5 && (
                <li className="more-errors">
                  ...and {validationReport.errors.length - 5} more issues. Download the log file for complete details.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {logFileUrl && (
        <div className="log-file-section mt-3">
          <button onClick={downloadLogFile} className="btn btn-info">
            📝 Download Complete Report
          </button>
          <p className="mt-1 small text-muted">
            The detailed report contains all records processed, errors found, and suggestions for fixing issues.
          </p>
        </div>
      )}

      <div className="help-section mt-4">
        <h5>Need Help?</h5>
        <p>
          If you're having trouble with your upload, check these common issues:
        </p>
        <ul>
          <li>Make sure all required fields are filled in</li>
          <li>Check that dates are in DD-MM-YYYY format</li>
          <li>Ensure phone numbers are 10 digits</li>
          <li>Verify that each Registration Number is unique</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkUploadApplications;
