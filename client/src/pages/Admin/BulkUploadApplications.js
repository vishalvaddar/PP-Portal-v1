import React, { useState } from "react";
import axios from "axios";
import "./BulkUploadApplications.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

const BulkUploadApplications = ({ refreshData }) => {
  const currentPath = ['Admin', 'Admissions', 'Applications', 'BulkUploads'];
  // State variables
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationReport, setValidationReport] = useState(null);
  const [logFileUrl, setLogFileUrl] = useState("");
  const [uploadStats, setUploadStats] = useState(null);

  // File change handler
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    resetMessages();
  };

  // Reset messages and states
  const resetMessages = () => {
    setMessage("");
    setError("");
    setValidationReport(null);
    setLogFileUrl("");
    setUploadStats(null);
  };

  // Download log file
  const downloadLogFile = async () => {
    if (!logFileUrl) return;

    const fullUrl = `${process.env.REACT_APP_BACKEND_API_URL}/logs/${logFileUrl}`;

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
      setError("❌ Couldn't download the report. Please try again or contact support.");
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("⚠ Please select a file to upload first.");
      return;
    }

    if (!validateFile()) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      handleResponse(response);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate file before upload
  const validateFile = () => {
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
      setError("⚠ Please upload only CSV or Excel files (with .csv, .xlsx, or .xls extension).");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("❌ File Too Large! Please upload a file smaller than 10MB.");
      return false;
    }

    return true;
  };

  // Handle server response
  const handleResponse = (response) => {
    setUploadStats({
      totalRecords: response.data.totalRecords || 0,
      submittedApplications: response.data.submittedApplications || 0,
      rejectedApplications: response.data.rejectedApplications || 0,
      duplicateRecords: response.data.duplicateRecords || 0,
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
        setMessage(`⚠ We found ${response.data.validationErrors.length} issues in your file. Please check the details below.`);
      } else {
        setMessage("✅ File uploaded successfully! All records were processed.");
        resetFileInput();
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
  };

  // Reset file input
  const resetFileInput = () => {
    setFile(null);
    document.getElementById("file-upload").value = "";
  };

  // Handle errors from server
  const handleError = (error) => {
    const backendMessage = error.response?.data?.message || error.message;
    let userFriendlyMessage = "❌ Oops! Something went wrong: ";

    // Custom error messages based on backend response
    if (backendMessage.includes("duplicate key value violates unique constraint")) {
      userFriendlyMessage = "❌ Duplicate Registration Numbers found! Please check your file.";
    } else if (backendMessage.includes('null value in column "nmms_reg_number"')) {
      userFriendlyMessage = "❌ Missing Registration Numbers! Please check your file.";
    } else if (backendMessage.includes('null value in column "nmms_year"')) {
      userFriendlyMessage = "❌ Missing Year Information! Please check your file.";
    } else if (backendMessage.includes("invalid input syntax")) {
      userFriendlyMessage = "❌ Incorrect Data Format! Please check your file.";
    } else if (error.response?.status === 413) {
      userFriendlyMessage = "❌ File Too Large! Maximum allowed size is 10MB.";
    } else {
      userFriendlyMessage = "❌ We couldn't process your file. Please check the sample file format and try again.";
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
      setMessage(`⚠ We found issues in your file. Please check the Report below.`);
    }

    if (error.response?.data?.logFile) {
      setLogFileUrl(error.response.data.logFile);
    }
  };

  return (
    <div className="bulk-upload-container">
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
      <h2>📂 Bulk Upload Applications</h2>
      <div className="upload-instructions">
        <h3>Upload a CSV or Excel file containing multiple student applications</h3>
        <div className="file-requirements">
          <h5>File Requirements:</h5>
          <ul>
            <li>File must be in CSV or Excel format (.csv, .xlsx, .xls)</li>
            <li>Maximum file size: 10MB</li>
            <li>Required fields: NMMS Year, Registration Number, Student Name, Father's Name, Gender, GMAT Score, SAT Score</li>
            <li>Each Registration Number must be unique</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ whiteSpace: "pre-line" }}>
          {error}
        </div>
      )}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="download-section mt-3">
        <p>
          📄 <strong>Need help formatting your file?</strong>{" "}
          <a href="/sample_bulk_upload.csv" download className="download-link">
            Download Sample CSV File
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload" className="form-label">
            <strong>Select File to Upload</strong>
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
                Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
          style={{ minWidth: "120px" }}
        >
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
          <h4>Issues Found in Your File</h4>
          <p>We found some things that need correction before we can process your file:</p>

          <div className="alert alert-warning">
            <strong>How to fix:</strong> Correct these issues in your original file and upload again.
          </div>

          <div className="error-list mt-3">
            <ul className="validation-errors">
              {validationReport.errors.slice(0, 5).map((error, index) => (
                <li key={index} className="error-item">
                  <div className="error-row">
                    <strong>Row {error.row}:</strong>
                  </div>
                  <div className="error-details">
                    <span className="error-field">{error.field}:</span> {error.message}
                    {error.value && (
                      <div className="error-value">Current value: "{error.value}"</div>
                    )}
                  </div>
                </li>
              ))}
              {validationReport.errors.length > 5 && (
                <li className="more-errors">
                  <em>...plus {validationReport.errors.length - 5} more issues.</em>
                  <br />
                  Download the full report below to see everything that needs fixing.
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
        <h5>Need Help With Your Upload?</h5>
        <div className="alert alert-info">
          <p>
            <strong>Common issues and how to fix them:</strong>
          </p>
          <ul>
            <li>
              <strong>Blank cells:</strong> Make sure all required fields have information
            </li>
            <li>
              <strong>Dates:</strong> Use exactly DD-MM-YYYY format (e.g., 15-01-2023)
            </li>
            <li>
              <strong>Phone numbers:</strong> Should be 10 digits only (no spaces or symbols)
            </li>
            <li>
              <strong>Scores:</strong> Must be numbers only (no letters or symbols)
            </li>
            <li>
              <strong>Registration Numbers:</strong> Each one must be unique - no duplicates
            </li>
          </ul>
          <p className="mt-2">
            <strong>Still having trouble?</strong> Try downloading our sample file and comparing it with yours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadApplications;
