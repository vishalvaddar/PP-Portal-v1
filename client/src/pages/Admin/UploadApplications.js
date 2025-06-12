import React from "react";
import "./UploadApplicationPage.css"; // Import CSS file for styling
import { Link } from "react-router-dom"; // Import Link for routing

const UploadApplications = () => {
  return (
    <div className="container mt-4">
      <h2 className="text-center">Upload Applications</h2>

      {/* Application Options */}
      <div className="application-options mt-4">
        <div className="option-box">
          <Link to="/new-application" className="option-link">
            <div className="icon-box">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div className="text-box">New Application</div>
          </Link>
        </div>
        <div className="option-box">
          <Link to="/bulk-upload-applications" className="option-link">
            <div className="icon-box">
              <i className="fas fa-upload"></i>
            </div>
            <div className="text-box">Bulk Upload Applications</div>
          </Link>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="instructions mt-4">
        <h3>Instructions</h3>
        <ul>
          <li>Ensure your file is in CSV or Excel format.</li>
          <li>Include headers: Application ID, Name, Email, etc.</li>
          <li>Review the file for errors before uploading.</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadApplications;
