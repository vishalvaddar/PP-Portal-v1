import React, { useState, useRef } from "react";
import useEvaluationModule from '../../../hooks/EvalutionHooks';
import './EvaluationMarksEntry.css';

const EvaluationMarksEntry = () => {
  const { 
    examNames, 
    selectedExam, 
    setSelectedExam, 
    downloadExcel,
    uploadBulkData 
  } = useEvaluationModule();

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('instructions');

  const handleChange = (e) => {
    setSelectedExam(e.target.value);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is Excel format
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setUploadStatus('Error: Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('File selected: ' + file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first.');
      return;
    }

    if (!selectedExam) {
      setUploadStatus('Please select an exam first.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Uploading...');
      const result = await uploadBulkData(selectedFile);
      
      if (result.success) {
        setUploadStatus('Upload successful! Data has been processed.');
        setSelectedFile(null);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      setUploadStatus(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    if (!selectedExam) {
      setUploadStatus('Please select an exam first to download template.');
      return;
    }
    downloadExcel();
  };

  return (
    <div className="evaluation-container">
      <header className="evaluation-header">
        <h1>Evaluation Marks Entry System</h1>
        <p>Bulk upload evaluation marks for students</p>
      </header>

      <div className="content-wrapper">
        <div className="instructions-panel">
          <div className="tabs">
            <button 
              className={activeTab === 'instructions' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('instructions')}
            >
              Instructions
            </button>
            <button 
              className={activeTab === 'format' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('format')}
            >
              File Format
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'instructions' ? (
              <div className="instructions">
                <h3>How to Upload Evaluation Marks</h3>
                <ol>
                  <li>Select the exam name from the dropdown menu</li>
                  <li>Download the student list template for the selected exam</li>
                  <li>Fill in the marks for each student in the downloaded Excel file</li>
                  <li>Save the completed file on your computer</li>
                  <li>Click "Choose File" to select your completed marks file</li>
                  <li>Review the selected file and click "Upload Data"</li>
                  <li>Wait for the upload to complete and check the status message</li>
                </ol>
                <div className="important-notes">
                  <h4>Important Notes:</h4>
                  <ul>
                    <li>Do not modify the student ID or roll number columns</li>
                    <li>Ensure marks are entered in the correct columns</li>
                    <li>Only use numeric values for marks fields</li>
                    <li>Do not change the structure or headers of the template file</li>
                    <li>Maximum file size: 10MB</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="format-info">
                <h3>Excel File Format Requirements</h3>
                <div className="format-table">
                  <div className="format-row header">
                    <div className="format-cell">Column Name</div>
                    <div className="format-cell">Data Type</div>
                    <div className="format-cell">Required</div>
                    <div className="format-cell">Description</div>
                  </div>
                  <div className="format-row">
                    <div className="format-cell">Student ID</div>
                    <div className="format-cell">Text</div>
                    <div className="format-cell">Yes</div>
                    <div className="format-cell">Unique student identifier</div>
                  </div>
                  <div className="format-row">
                    <div className="format-cell">Roll Number</div>
                    <div className="format-cell">Text</div>
                    <div className="format-cell">Yes</div>
                    <div className="format-cell">Student's roll number</div>
                  </div>
                  <div className="format-row">
                    <div className="format-cell">Student Name</div>
                    <div className="format-cell">Text</div>
                    <div className="format-cell">Yes</div>
                    <div className="format-cell">Full name of student</div>
                  </div>
                  <div className="format-row">
                    <div className="format-cell">Marks Columns</div>
                    <div className="format-cell">Numeric</div>
                    <div className="format-cell">Yes</div>
                    <div className="format-cell">Varies by exam (e.g., Theory, Practical)</div>
                  </div>
                </div>
                
                <div className="sample-section">
                  <h4>Sample Data:</h4>
                  <div className="sample-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Theory</th>
                          <th>Practical</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>S001</td>
                          <td>101</td>
                          <td>John Doe</td>
                          <td>85</td>
                          <td>90</td>
                          <td>175</td>
                        </tr>
                        <tr>
                          <td>S002</td>
                          <td>102</td>
                          <td>Jane Smith</td>
                          <td>78</td>
                          <td>88</td>
                          <td>166</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="upload-panel">
          <div className="section">
            <h3>Step 1: Select Exam</h3>
            <div className="exam-selector">
              <select
                name="exam_name"
                value={selectedExam}
                onChange={handleChange}
                required
                className="exam-dropdown"
              >
                <option value="">--Select Exam Name--</option>
                {examNames.map((exam, index) => (
                  <option key={index} value={exam.exam_name}>
                    {exam.exam_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="section">
            <h3>Step 2: Download Template</h3>
            <p>Download the student list for the selected exam to enter marks</p>
            <button 
              onClick={handleDownloadTemplate}
              disabled={!selectedExam}
              className={!selectedExam ? "btn btn-download disabled" : "btn btn-download"}
            >
              Download Student List Template
            </button>
          </div>

          <div className="section">
            <h3>Step 3: Upload Marks</h3>
            <p>Select your completed marks file and upload</p>
            
            <div className="file-upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx, .xls"
                id="file-input"
                className="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                Choose Excel File
              </label>
              
              {selectedFile && (
                <div className="file-selected">
                  <span className="file-name">{selectedFile.name}</span>
                  <button 
                    onClick={handleClearFile}
                    className="btn-clear"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedExam || isUploading}
              className={
                !selectedFile || !selectedExam || isUploading 
                  ? "btn btn-upload disabled" 
                  : "btn btn-upload"
              }
            >
              {isUploading ? (
                <>
                  <span className="spinner"></span>
                  Uploading...
                </>
              ) : (
                'Upload Data'
              )}
            </button>
          </div>

          {uploadStatus && (
            <div className={uploadStatus.includes('successful') ? "status success" : "status error"}>
              <div className="status-icon">
                {uploadStatus.includes('successful') ? '✓' : '⚠'}
              </div>
              <div className="status-message">{uploadStatus}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationMarksEntry;