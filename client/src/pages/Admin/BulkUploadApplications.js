import React, { useState } from "react";
import axios from "axios";
import classes from "./BulkUploadApplications.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { UploadCloud, FileText, Download, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);

  // File change handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        setFile(selectedFile);
        resetMessages();
    }
  };

  const resetMessages = () => {
    setMessage("");
    setError("");
    setValidationReport(null);
    setLogFileUrl("");
    setUploadStats(null);
  };

  const downloadLogFile = async () => {
    if (!logFileUrl) return;
    const fullUrl = `${process.env.REACT_APP_BACKEND_API_URL}/logs/${logFileUrl}`;
    try {
      const response = await fetch(fullUrl);
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
    } catch (error) {
      console.error("Error downloading log file:", error);
      setError("Couldn't download the report. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload first.");
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

  const validateFile = () => {
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
      setError("Please upload only CSV or Excel files.");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large! Please upload a file smaller than 10MB.");
      return false;
    }
    return true;
  };

  const handleResponse = (response) => {
    setUploadStats({
        totalRecords: response.data.totalRecords || 0,
        submittedApplications: response.data.submittedApplications || 0,
        rejectedApplications: response.data.rejectedApplications || 0,
        duplicateRecords: response.data.duplicateRecords || 0,
    });

    if (response.data.validationErrors?.length > 0) {
        setValidationReport({ errors: response.data.validationErrors });
        setMessage(`Upload complete with ${response.data.validationErrors.length} issues found.`);
    } else {
        setMessage("File uploaded successfully! All records were processed.");
        if (typeof refreshData === "function") refreshData();
    }
    if (response.data.logFile) setLogFileUrl(response.data.logFile);
  };

  const handleError = (error) => {
    const backendMessage = error.response?.data?.message || "An unexpected error occurred.";
    setError(backendMessage);
    if (error.response?.data?.logFile) setLogFileUrl(error.response.data.logFile);
  };
  
  // Drag and drop handlers
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
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']}/>
      <div className={classes.mainContent}>
        <div className={classes.leftColumn}>
          <h2>📂 Bulk Upload Applications</h2>
          <h3>Upload a CSV or Excel file containing multiple student applications</h3>
          <div className={classes.card}>
            <h2 className={classes.cardTitle}><FileText size={20} /> File Requirements</h2>
            <div className={classes.requirementsGrid}>
                <div className={classes.requirementItem}>CSV or Excel format (.csv, .xlsx, .xls)</div>
                <div className={classes.requirementItem}>Maximum file size: 10MB</div>
            </div>
            <h3 className={classes.subHeading}>Required Fields:</h3>
            <div className={classes.tagsContainer}>
                {['NMMS Year', 'Registration Number', 'Student Name', 'Father\'s Name', 'Gender', 'GMAT Score', 'SAT Score'].map(tag => <span key={tag} className={classes.tag}>{tag}</span>)}
            </div>
             <div className={classes.requirementItemFull}>Each Registration Number must be unique</div>
            <a href="/sample_bulk_upload.csv" download className={classes.downloadLink}>
              <Download size={16} /> Download Sample CSV File
            </a>
            <p className={classes.sampleFileText}>Need help formatting your file? Use our sample as a template.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div 
              className={`${classes.dropzone} ${isDragging ? classes.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input').click()}
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
                    <p className={classes.dropzoneText}><strong>Selected File:</strong> {file.name}</p>
                    <p className={classes.dropzoneSubtext}>({(file.size / 1024).toFixed(2)} KB)</p>
                </div>
              ) : (
                <div>
                    <p className={classes.dropzoneText}>Drag and drop your file here, or click to browse</p>
                    <p className={classes.dropzoneSubtext}>Supports CSV, XLSX, and XLS files up to 10MB</p>
                </div>
              )}
            </div>
            <button type="submit" className={classes.uploadButton} disabled={isLoading || !file}>
              {isLoading ? 'Uploading...' : 'Upload File'}
            </button>
          </form>
        </div>

        <div className={classes.rightColumn}>
          <div className={`${classes.card} ${classes.helpCard}`}>
             <h2 className={classes.cardTitle}><Info size={20} /> Need Help With Your Upload?</h2>
             <p className={classes.helpIntro}>Common issues and how to fix them:</p>
             <ul className={classes.helpList}>
                <li><strong>Blank cells:</strong> Make sure all required fields have information.</li>
                <li><strong>Dates:</strong> Use exactly DD-MM-YYYY format (e.g., 15-01-2023).</li>
                <li><strong>Phone numbers:</strong> Should be 10 digits only (no spaces or symbols).</li>
                <li><strong>Scores:</strong> Must be numbers only (no letters or symbols).</li>
                <li><strong>Registration Numbers:</strong> Each one must be unique - no duplicates.</li>
             </ul>
             <p className={classes.helpFooter}><strong>Still having trouble?</strong> Try downloading our sample file and comparing it with yours.</p>
          </div>
        </div>
      </div>
      
      {(error || message || uploadStats) && (
        <div className={classes.reportSection}>
            {error && <div className={`${classes.alert} ${classes.alertError}`}><AlertTriangle size={18}/> {error}</div>}
            {message && <div className={`${classes.alert} ${classes.alertSuccess}`}><CheckCircle size={18}/> {message}</div>}

            {uploadStats && (
                <div className={classes.statsGrid}>
                    <div className={classes.statBox}><span>{uploadStats.totalRecords}</span>Total Records</div>
                    <div className={`${classes.statBox} ${classes.success}`}><span>{uploadStats.submittedApplications}</span>Successfully Added</div>
                    <div className={`${classes.statBox} ${classes.error}`}><span>{uploadStats.rejectedApplications}</span>Rejected</div>
                    {uploadStats.duplicateRecords > 0 && <div className={`${classes.statBox} ${classes.warning}`}><span>{uploadStats.duplicateRecords}</span>Duplicates</div>}
                </div>
            )}

            {validationReport?.errors?.length > 0 && (
                <div className={classes.validationReport}>
                    <h4><AlertTriangle size={18}/> Issues Found in Your File</h4>
                    <ul className={classes.errorList}>
                        {validationReport.errors.slice(0, 5).map((err, index) => (
                            <li key={index}>
                                <strong>Row {err.row}:</strong> [{err.field}] - {err.message}
                            </li>
                        ))}
                    </ul>
                    {validationReport.errors.length > 5 && <p>...and {validationReport.errors.length - 5} more issues.</p>}
                </div>
            )}

            {logFileUrl && (
                <div className={classes.downloadReport}>
                    <h4>Generate Full Report</h4>
                    <p>The detailed report contains all records processed, errors found, and suggestions for fixing issues.</p>
                    <button onClick={downloadLogFile} className={classes.reportButton}>
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
