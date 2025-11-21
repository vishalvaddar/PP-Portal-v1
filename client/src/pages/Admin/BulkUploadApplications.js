import React, { useState } from "react";
import axios from "axios";
import classes from "./BulkUploadApplications.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import {
  UploadCloud,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

const BulkUploadApplications = ({ refreshData }) => {
  const currentPath = ["Admin", "Admissions", "Applications", "BulkUploads"];

  // States
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // --- CORRECTION 1: Removed validationReport state ---
  // The backend only sends a *count* of validation errors, not the full array.
  // The full error list is in the log file.
  const [logFileUrl, setLogFileUrl] = useState("");
  const [uploadStats, setUploadStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset all messages
  const resetMessages = () => {
    setMessage("");
    setError("");
    setLogFileUrl("");
    setUploadStats(null);
  };

  // File selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      resetMessages();
    }
  };

  // Validate file
  const validateFile = () => {
    const fileExt = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(fileExt)) {
      setError("Please upload only CSV or Excel files (.csv, .xlsx, .xls).");
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large! Upload files smaller than 20MB.");
      return false;
    }
    return true;
  };

  // Handle file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file); // key must be "file"
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/bulk-upload/upload`, form); // no headers override
      handleResponse(response);
    } catch (err) {
      handleError(err);
    }
  };

  // --- CORRECTION 2: Completely rewrote handleResponse ---
  // This now matches the actual API response from your backend controller.
  const handleResponse = (response) => {
    const { data } = response;
    // data = { totalRecords, insertedRecords, validationErrors, dbErrors, status, logFile }

    const rejectedCount = (data.validationErrors || 0) + (data.dbErrors || 0);

    setUploadStats({
      totalRecords: data.totalRecords || 0,
      insertedRecords: data.insertedRecords || 0,
      rejectedCount: rejectedCount,
    });

    if (data.logFile) {
      setLogFileUrl(data.logFile);
    }

    // Use the 'status' string from the backend for messaging
    switch (data.status) {
      case "success":
        setMessage(
          `✅ File uploaded successfully! All ${data.insertedRecords} records were processed.`
        );
        if (typeof refreshData === "function") refreshData();
        break;
      case "partial_success":
        setError(
          `Upload complete with issues: ${data.insertedRecords} records added, ${rejectedCount} failed. Download the report for details.`
        );
        break;
      case "failed":
        setError(
          `Upload failed. All ${rejectedCount} records failed. Download the report for details.`
        );
        break;
      case "no_valid_data":
        setError(
          "Upload processed, but no valid data was found to insert. Check the log file for details."
        );
        break;
      default:
        setError("⚠️ Unexpected response from server.");
        break;
    }
  };

  // Handle backend/network errors
  const handleError = (error) => {
    const backendMessage =
      error.response?.data?.message ||
      "❌ Upload failed due to a server or network error.";
    setError(backendMessage);

    if (error.response?.data?.logFile)
      setLogFileUrl(error.response.data.logFile);

    setUploadStats(null);
  };

  // Download log file
  const downloadLogFile = async () => {
    if (!logFileUrl) return;
    // This assumes your backend serves the 'logs' folder statically
    // e.g., http://localhost:5000/logs/upload_log_...txt
    const fullUrl = `${process.env.REACT_APP_BACKEND_API_URL}/logs/${logFileUrl}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Log file not found or server error: ${response.statusText}`);
      }
      const text = await response.text();
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = logFileUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading log file:", err);
      setError("Couldn't download the report. Please try again.");
    }
  };

  // Drag and Drop Handlers (No changes)
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      resetMessages();
    }
  };

  return (
    <div className={classes.pageContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Admissions"]} />

      <div className={classes.mainContent}>
        {/* Left Section (No changes) */}
        <div className={classes.leftColumn}>
          <h2>📂 Bulk Upload Applications</h2>

          <div className={classes.card}>
            <h2 className={classes.cardTitle}>
              <FileText size={20} /> File Requirements
            </h2>

            <div className={classes.requirementsGrid}>
              <div className={classes.requirementItem}>
                CSV or Excel format (.csv, .xlsx, .xls)
              </div>
              <div className={classes.requirementItem}>
                Maximum file size: 10MB
              </div>
            </div>

            <h3 className={classes.subHeading}>Required Fields:</h3>
            <div className={classes.tagsContainer}>
              {[
                "NMMS Year",
                "Registration Number",
                "Student Name",
                "Father's Name",
                "Gender",
                "GMAT Score",
                "SAT Score",
              ].map((tag) => (
                <span key={tag} className={classes.tag}>
                  {tag}
                </span>
              ))}
            </div>

            <div className={classes.requirementItemFull}>
              Each Registration Number must be unique
            </div>

            <a
              href="/sample_bulk_upload.csv"
              download
              className={classes.downloadLink}
            >
              <Download size={16} /> Download Sample CSV File
            </a>
            <p className={classes.sampleFileText}>
              Need help formatting your file? Use our sample as a template.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className={`${classes.dropzone} ${
                isDragging ? classes.dragging : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() =>
                document.getElementById("file-upload-input").click()
              }
            >
              <input
                type="file"
                id="file-upload-input"
                className={classes.fileInput}
                onChange={handleFileChange}
                accept=".csv, .xlsx, .xls"
              />
              <UploadCloud size={48} className={classes.dropzoneIcon} />

              {file ? (
                <div>
                  <p className={classes.dropzoneText}>
                    <strong>Selected File:</strong> {file.name}
                  </p>
                  <p className={classes.dropzoneSubtext}>
                    ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              ) : (
                <div>
                  <p className={classes.dropzoneText}>
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className={classes.dropzoneSubtext}>
                    Supports CSV, XLSX, and XLS files up to 10MB
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className={classes.uploadButton}
              disabled={isLoading || !file}
            >
              {isLoading ? "Uploading..." : "Upload File"}
            </button>
          </form>
        </div>

        {/* Right Section - Help (No changes) */}
        <div className={classes.rightColumn}>
          <div className={`${classes.card} ${classes.helpCard}`}>
            <h2 className={classes.cardTitle}>
              <Info size={20} /> Need Help With Your Upload?
            </h2>
            <p className={classes.helpIntro}>Common issues and how to fix them:</p>
            <ul className={classes.helpList}>
              <li>
                <strong>Blank cells:</strong> Make sure all required fields have
                data.
              </li>
              <li>
                <strong>Dates:</strong> Use DD-MM-YYYY format.
              </li>
              <li>
                <strong>Phone numbers:</strong> 10 digits only.
              </li>
              <li>
                <strong>Scores:</strong> Numbers only.
              </li>
              <li>
                <strong>Registration Numbers:</strong> Must be unique.
              </li>
            </ul>
            <p className={classes.helpFooter}>
              <strong>Still having trouble?</strong> Try downloading our sample
              file and comparing it with yours.
            </p>
          </div>
        </div>
      </div>

      {/* Report Section */}
      {(error || message || uploadStats) && (
        <div className={classes.reportSection}>
          {error && (
            <div className={`${classes.alert} ${classes.alertError}`}>
              <AlertTriangle size={18} /> {error}
            </div>
          )}
          {message && (
            <div className={`${classes.alert} ${classes.alertSuccess}`}>
              <CheckCircle size={18} /> {message}
            </div>
          )}

          {/* --- CORRECTION 3: Updated stats grid --- */}
          {uploadStats && (
            <div className={classes.statsGrid}>
              <div className={classes.statBox}>
                <span>{uploadStats.totalRecords}</span>Total Records
              </div>
              <div className={`${classes.statBox} ${classes.success}`}>
                <span>{uploadStats.insertedRecords}</span> Successfully Added
              </div>
              <div className={`${classes.statBox} ${classes.error}`}>
                <span>{uploadStats.rejectedCount}</span> Rejected
              </div>
              {/* Removed 'DuplicateRecords' as backend doesn't provide this count */}
            </div>
          )}

          {/* --- CORRECTION 4: Removed validationReport list --- */}
          {/* This was removed because the backend doesn't send the error array. */}

          {logFileUrl && (
            <div className={classes.downloadReport}>
              <h4>Generate Full Report</h4>
              <p>
                Download a detailed log of all processed records and issues
                found.
                {/* --- CORRECTION 5: Added text to guide user --- */}
                <br />
                <strong>
                  This report includes all row-by-row validation and database
                  errors.
                </strong>
              </p>
              <button
                onClick={downloadLogFile}
                className={classes.reportButton}
              >
                <Download size={16} /> Download Complete Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkUploadApplications;