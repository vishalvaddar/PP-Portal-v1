import React from "react";
import { Link } from "react-router-dom";
import "./Shortlisting.css";

const Shortlisting = () => {
  return (
    <div className="container mt-4">
      <h2 className="text-center">Shortlisting</h2>

      <div className="shortlisting-steps mt-4">
        <div className="option-box">
          <Link to="/generate-shortlist" className="option-link">
            <div className="icon-box">
              <i className="fas fa-upload"></i>
            </div>
            <div className="text-box">Generate Shortlist</div>
          </Link>
        </div>

        <div className="option-box">
          <Link to="/shortlist-info" className="option-link">
            <div className="icon-box">
              <i className="fas fa-info-circle"></i> {/* Changed icon for clarity */}
            </div>
            <div className="text-box">Shortlisted Information</div>
          </Link>
        </div>
      </div>

      <div className="shortlist-container mt-4">
        <h1>Shortlisting Process</h1>
        <h3>Instructions</h3>
        <ul>
          <li>
            The first step is to generate a shortlist based on the state,
            district, and optionally multiple blocks, using specific criteria.
          </li>
          <li>
            You can generate a shortlist multiple times.
            Only one shortlist can exist for a specific block at any given time.
            To finalize and secure a shortlist, you need to freeze it from the
            "Shortlisted Information" interface.
            Similarly, deletion of a shortlist is also done through the "Shortlisted Information" interface.
          </li>
          <li>
            From the "Shortlisted Information" interface, you can access all the
            details of the generated shortlist and can download the selected student list from there.
          </li>
          
        </ul>
      </div>
    </div>
  );
};

export default Shortlisting;