import React from "react";
import { Link } from "react-router-dom";
import "./Shortlisting.css";

const Shortlisting = () => {
  return (
    <div className="container mt-4">
      <h2 className="text-center">Shortlisting</h2>

      
      <div className="shortlisting-steps mt-4">
        
        <div className="option-box">
          <Link to="/create-shortlisting-criteria" className="option-link">
            <div className="icon-box">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div className="text-box">Create Criteria</div>
          </Link>
        </div>

        
        <div className="option-box">
          <Link to="/generate-shortlist" className="option-link">
            <div className="icon-box">
              <i className="fas fa-upload"></i>
            </div>
            <div className="text-box">Generate Shortlist</div>
          </Link>
        </div>
      </div>

      
      <div className="shortlist-container mt-4">
        <h1>Shortlisting Process</h1>
        <h3>Instructions</h3>
        <ul>
          <li>Ensure that the criteria you are using exists; if not, add it.</li>
          <li>Review the shortlisted students before clicking "Save."</li>
          <li>Only one shortlist can be created for a district and block at a time.</li>
          <li>If you want to generate a new list for a block that already has one, first delete the existing shortlist.</li>
          <li>You can't generate a list for a block where exams are already being conducted.</li>
        </ul>
      </div>
    </div>
  );
};

export default Shortlisting;
