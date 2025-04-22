import React, { useState } from "react";
import "./ShortlistInfo.css"; // Ensure CSS is correctly imported

const ShortlistInfo = () => {
  const [applicantCount, setApplicantCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [activeBox, setActiveBox] = useState(null);

  const handleBoxClick = (boxId) => {
    setActiveBox(boxId);
  };

  const renderMainView = () => (
    <div className="container">
      <h1>Shortlisted Information</h1>
      <div className="counts-container">
        <div className="count-box">
          <p>Total Applicants: {applicantCount}</p>
        </div>
        <div className="count-box">
          <p>Shortlisted Students: {shortlistedCount}</p>
        </div>
      </div>

      <div className="shortlisting-steps-grid">
        <div className="option-box" onClick={() => handleBoxClick("getInfo")}>
          <div className="icon-box">ℹ️</div>
          <div className="text-box">Get Shortlist Info</div>
        </div>
        <div className="option-box" onClick={() => handleBoxClick("freeze")}>
          <div className="icon-box">🔒</div>
          <div className="text-box">Freeze Shortlist</div>
        </div>
        <div className="option-box" onClick={() => handleBoxClick("delete")}>
          <div className="icon-box">🗑️</div>
          <div className="text-box">Delete Shortlist</div>
        </div>
        <div className="option-box" onClick={() => handleBoxClick("download")}>
          <div className="icon-box">⬇️</div>
          <div className="text-box">Download Shortlist</div>
        </div>
      </div>
    </div>
  );

  const renderGetInfo = () => (
    <div className="detailed-view">
      <h2>Get Shortlist Information</h2>
      {/* Add your component or content for fetching and displaying shortlist info here */}
      <button onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  const renderFreeze = () => (
    <div className="detailed-view">
      <h2>Freeze Shortlist</h2>
      {/* Add your component or content for freezing the shortlist here */}
      <button onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  const renderDelete = () => (
    <div className="detailed-view">
      <h2>Delete Shortlist</h2>
      {/* Add your component or content for deleting the shortlist here */}
      <button onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  const renderDownload = () => (
    <div className="detailed-view">
      <h2>Download Shortlist</h2>
      {/* Add your component or content for downloading the shortlist here */}
      <button onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  return (
    <div className="shortlist-info-container">
      {activeBox === null && renderMainView()}
      {activeBox === "getInfo" && renderGetInfo()}
      {activeBox === "freeze" && renderFreeze()}
      {activeBox === "delete" && renderDelete()}
      {activeBox === "download" && renderDownload()}
    </div>
  );
};

export default ShortlistInfo;