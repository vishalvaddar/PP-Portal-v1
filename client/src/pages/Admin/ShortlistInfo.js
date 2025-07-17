import React, { useState, useEffect, useRef } from "react";
import styles from "./ShortlistInfo.module.css";
import * as XLSX from "xlsx";

const ShortlistInfo = () => {
  const [applicantCount, setApplicantCount] = useState(0);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [activeBox, setActiveBox] = useState(null);
  const [shortlistNames, setShortlistNames] = useState([]);
  const [nonFrozenShortlistNames, setNonFrozenShortlistNames] = useState([]);
  const [selectedShortlistInfo, setSelectedShortlistInfo] = useState(null);
  const [selectedShortlistFreezeName, setSelectedShortlistFreezeName] = useState("");
  const [selectedShortlistFreezeId, setSelectedShortlistFreezeId] = useState(null);
  const [selectedShortlistDeleteName, setSelectedShortlistDeleteName] = useState("");
  const [selectedShortlistDeleteId, setSelectedShortlistDeleteId] = useState(null);
  const [selectedShortlistDownloadName, setSelectedShortlistDownloadName] = useState("");
  const [shortlistedData, setShortlistedData] = useState([]);
  const [showDownloadConfirmation, setShowDownloadConfirmation] = useState(false);
  const [showPreviewTable, setShowPreviewTable] = useState(false);
  const applicantCountRef = useRef(0);
  const shortlistedCountRef = useRef(0);
  const [loadingShortlistNames, setLoadingShortlistNames] = useState(true);
  const [loadingNonFrozenNames, setLoadingNonFrozenNames] = useState(true);
  const [shortlistNamesError, setShortlistNamesError] = useState(null);
  const [nonFrozenNamesError, setNonFrozenNamesError] = useState(null);

  // API Endpoints
  const BASE_API_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/info`;
  const GET_NAMES_ENDPOINT = `${BASE_API_URL}/names`;
  const GET_NON_FROZEN_NAMES_ENDPOINT = `${BASE_API_URL}/non-frozen-names`;
  const GET_COUNTS_ENDPOINT = `${BASE_API_URL}/counts`;
  const FREEZE_ENDPOINT = `${BASE_API_URL}/freeze`;
  const DELETE_ENDPOINT = `${BASE_API_URL}/delete`;
  const GET_INFO_BY_NAME_ENDPOINT = `${BASE_API_URL}`;
  const DOWNLOAD_SHOW_ENDPOINT = `${BASE_API_URL}/show-data`;
  const DOWNLOAD_ENDPOINT = `${BASE_API_URL}/download-data`;

  useEffect(() => {
    // Fetch shortlist names
    const fetchShortlistNames = async () => {
      setLoadingShortlistNames(true);
      try {
        const res = await fetch(GET_NAMES_ENDPOINT);
        const data = await res.json();
        setShortlistNames(data);
      } catch (error) {
        console.error("Error fetching shortlist names:", error);
        setShortlistNamesError("Failed to load shortlist names.");
      } finally {
        setLoadingShortlistNames(false);
      }
    };

    // Fetch non-frozen shortlist names
    const fetchNonFrozenShortlistNames = async () => {
      setLoadingNonFrozenNames(true);
      try {
        const res = await fetch(GET_NON_FROZEN_NAMES_ENDPOINT);
        const data = await res.json();
        setNonFrozenShortlistNames(data);
      } catch (error) {
        console.error("Error fetching non-frozen shortlist names:", error);
        setNonFrozenNamesError("Failed to load non-frozen shortlists.");
      } finally {
        setLoadingNonFrozenNames(false);
      }
    };

    // Fetch applicant counts and animate them
    const fetchCounts = async () => {
      try {
        const res = await fetch(GET_COUNTS_ENDPOINT);
        const data = await res.json();
        animateCount(0, data.totalApplicants, setApplicantCount, applicantCountRef);
        animateCount(0, data.totalShortlisted, setShortlistedCount, shortlistedCountRef);
      } catch (error) {
        console.error("Error fetching applicant counts:", error);
      }
    };

    fetchShortlistNames();
    fetchNonFrozenShortlistNames();
    fetchCounts();
  }, []);

  const animateCount = (start, end, setState, ref) => {
    let current = start;
    const duration = 1500;
    const increment = Math.ceil((end - start) / (duration / 16));
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        clearInterval(timer);
        setState(end);
      } else {
        setState(current);
      }
    }, 16);
    ref.current = end;
  };

  const handleBoxClick = (boxId) => {
    setActiveBox(boxId);
    setSelectedShortlistInfo(null);
    setShortlistedData([]);
    setShowDownloadConfirmation(false);
    setShowPreviewTable(false);
  };

  // Render dropdown options for shortlist names
  const renderShortlistOptions = (names, loading, errorMessage) => {
    if (loading) return <option disabled>Loading shortlists...</option>;
    if (errorMessage) return <option disabled>{errorMessage}</option>;
    if (names && names.length > 0) {
      return [
        <option key="default" value="" disabled>
          Select a Shortlist
        </option>,
        ...names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        )),
      ];
    }
    return <option disabled>No shortlists exist.</option>;
  };

  // Render dropdown options for non-frozen shortlist names
  const renderNonFrozenShortlistOptions = (names, loading, errorMessage) => {
    if (loading) return <option disabled>Loading shortlists...</option>;
    if (errorMessage) return <option disabled>{errorMessage}</option>;
    if (names && names.length > 0) {
      return [
        <option key="default" value="" disabled>
          Select a Shortlist
        </option>,
        ...names.map((item) => (
          <option key={item.id} value={item.name}>
            {item.name}
          </option>
        )),
      ];
    }
    return <option disabled>No non-frozen shortlists exist!</option>;
  };

  // Fetch and show detailed shortlist info
  const handleShortlistSelectInfo = async (event) => {
    const selectedName = event.target.value;
    if (!selectedName) {
      setSelectedShortlistInfo(null);
      return;
    }
    try {
      const res = await fetch(`${GET_INFO_BY_NAME_ENDPOINT}/${selectedName}`);
      const data = await res.json();
      setSelectedShortlistInfo(data);
    } catch (error) {
      console.error(`Error fetching info for ${selectedName}:`, error);
    }
  };

  // Handle freeze shortlist selection
  const handleShortlistSelectFreeze = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      const selectedShortlist = nonFrozenShortlistNames.find((item) => item.name === selectedValue);
      setSelectedShortlistFreezeName(selectedValue);
      setSelectedShortlistFreezeId(selectedShortlist?.id ?? null);
    } else {
      setSelectedShortlistFreezeName("");
      setSelectedShortlistFreezeId(null);
    }
  };

  // Submit freeze shortlist request
  const handleFreezeSubmit = async () => {
    if (!selectedShortlistFreezeId) {
      alert("Please select a shortlist to freeze.");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to freeze the shortlist "${selectedShortlistFreezeName}"? This action cannot be undone.`
      )
    ) {
      try {
        const res = await fetch(FREEZE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistFreezeId }),
        });
        const data = await res.json();
        alert(data.message);
        window.location.reload();
      } catch (error) {
        console.error("Error freezing shortlist:", error);
      }
    }
  };

  // Handle delete shortlist selection
  const handleShortlistSelectDelete = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      const selectedShortlist = nonFrozenShortlistNames.find((item) => item.name === selectedValue);
      setSelectedShortlistDeleteName(selectedValue);
      setSelectedShortlistDeleteId(selectedShortlist?.id ?? null);
    } else {
      setSelectedShortlistDeleteName("");
      setSelectedShortlistDeleteId(null);
    }
  };

  // Submit delete shortlist request
  const handleDeleteSubmit = async () => {
    if (!selectedShortlistDeleteId) {
      alert("Please select a shortlist to delete.");
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete the shortlist "${selectedShortlistDeleteName}"? This action cannot be undone.`
      )
    ) {
      try {
        const res = await fetch(DELETE_ENDPOINT, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistDeleteId }),
        });
        const data = await res.json();
        alert(data.message);
        window.location.reload();
      } catch (error) {
        console.error("Error deleting shortlist:", error);
      }
    }
  };

  // Handle shortlist selection for download
  const handleShortlistSelectDownload = (event) => {
    setSelectedShortlistDownloadName(event.target.value);
    setShortlistedData([]);
    setShowDownloadConfirmation(false);
    setShowPreviewTable(false);
  };

  // Show shortlisted data preview
  const handleShowData = async () => {
    if (!selectedShortlistDownloadName) {
      alert("Please select a shortlist to view.");
      return;
    }
    try {
      const res = await fetch(`${DOWNLOAD_SHOW_ENDPOINT}/${selectedShortlistDownloadName}`);
      const data = await res.json();
      setShortlistedData(data.data);
      setShowPreviewTable(true);
    } catch (error) {
      console.error("Error fetching show data:", error);
    }
  };

  // Handle download confirmation response
  const handleDownloadConfirmation = async (confirm) => {
    if (confirm) {
      try {
        const res = await fetch(`${DOWNLOAD_ENDPOINT}/${selectedShortlistDownloadName}`);
        const data = await res.json();
        downloadExcel(data.data, data.name);
        resetDownloadState();
      } catch (error) {
        console.error("Error fetching download data:", error);
      }
    } else {
      resetDownloadState();
      window.location.reload(); // Refresh the page on "No"
    }
  };

  const resetDownloadState = () => {
    setShowDownloadConfirmation(false);
    setSelectedShortlistDownloadName("");
    setShortlistedData([]);
    setShowPreviewTable(false);
    setActiveBox(null);
  };

  // Export data as Excel file
  const downloadExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortlisted Applicants");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // Render the main overview with counts and options
  const renderMainView = () => (
    <div className={styles.container}>
      <h1>Shortlisted Information</h1>
      <div className={styles.countsContainer}>
        <div className={styles.countBox}>
          <p>Total Applicants: {applicantCount}</p>
        </div>
        <div className={styles.countBox}>
          <p>Shortlisted Students: {shortlistedCount}</p>
        </div>
      </div>

      <div className={styles.shortlistingStepsGrid}>
        <div className={styles.optionBox} onClick={() => handleBoxClick("getInfo")}>
          <div className="icon-box">ℹ</div>
          <div className="text-box">Get Shortlist Info</div>
        </div>
        <div className={styles.optionBox} onClick={() => handleBoxClick("freeze")}>
          <div className="icon-box">🔒</div>
          <div className="text-box">Freeze Shortlist</div>
        </div>
        <div className={styles.optionBox} onClick={() => handleBoxClick("delete")}>
          <div className="icon-box">🗑</div>
          <div className="text-box">Delete Shortlist</div>
        </div>
        <div className={styles.optionBox} onClick={() => handleBoxClick("download")}>
          <div className="icon-box">⬇</div>
          <div className="text-box">Show/Download</div>
        </div>
      </div>
    </div>
  );

  // Render detailed views for each action
  const renderGetInfo = () => (
    <div className="detailed-view get-info-view">
      <h2>Get Shortlist Information</h2>
      <select onChange={handleShortlistSelectInfo} defaultValue="">
        {renderShortlistOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistInfo && (
        <div className="shortlist-details-info">
          <h3>{selectedShortlistInfo.name}</h3>
          <p>
            <strong>Description:</strong>{" "}
            <span className="justified-text">{selectedShortlistInfo.description}</span>
          </p>
          <p>
            <strong>Criteria Used:</strong>{" "}
            <span className="justified-text">{selectedShortlistInfo.criteria}</span>
          </p>
          <p>
            <strong>Blocks Included:</strong>{" "}
            {Array.isArray(selectedShortlistInfo.blocks)
              ? selectedShortlistInfo.blocks.join(", ")
              : "N/A"}
          </p>
          <p>
            <strong>Total Students in Blocks:</strong> {selectedShortlistInfo.totalStudents}
          </p>
          <p>
            <strong>Total Shortlisted Students:</strong> {selectedShortlistInfo.shortlistedCount}
          </p>
        </div>
      )}
      <div className="back-button-container">
        <button onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  const renderFreeze = () => (
    <div className="detailed-view">
      <h2>Freeze Shortlist</h2>
      <select onChange={handleShortlistSelectFreeze} defaultValue="">
        {renderNonFrozenShortlistOptions(nonFrozenShortlistNames, loadingNonFrozenNames, nonFrozenNamesError)}
      </select>
      {selectedShortlistFreezeName && <p>You have selected: {selectedShortlistFreezeName} to freeze.</p>}
      <button onClick={handleFreezeSubmit} disabled={!selectedShortlistFreezeId}>
        Freeze Shortlist
      </button>
      <div className="back-button-container">
        <button onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  const renderDelete = () => (
    <div className="detailed-view">
      <h2>Delete Shortlist</h2>
      <select onChange={handleShortlistSelectDelete} defaultValue="">
        {renderNonFrozenShortlistOptions(nonFrozenShortlistNames, loadingNonFrozenNames, nonFrozenNamesError)}
      </select>
      {selectedShortlistDeleteName && <p>You have selected: {selectedShortlistDeleteName} to delete.</p>}
      <button onClick={handleDeleteSubmit} disabled={!selectedShortlistDeleteId}>
        Delete Shortlist
      </button>
      <div className="back-button-container">
        <button onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  const renderDownload = () => (
    <div className="detailed-view download-view">
      <h2>Show/Download Shortlist Data</h2>
      <select onChange={handleShortlistSelectDownload} defaultValue="">
        {renderShortlistOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistDownloadName && (
        <>
          <p>You have selected: {selectedShortlistDownloadName}.</p>
          <button onClick={handleShowData} disabled={!selectedShortlistDownloadName}>
            Show Data
          </button>

          {showPreviewTable && shortlistedData.length > 0 && (
            <div className="shortlisted-data-preview">
              <h3>Data Preview</h3>
              <table>
                <thead>
                  <tr>
                    {Object.keys(shortlistedData[0]).map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shortlistedData.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, idx) => (
                        <td key={idx}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>Showing first 10 rows only.</p>
              <button onClick={() => setShowDownloadConfirmation(true)}>Download Full Data</button>
            </div>
          )}

          {showDownloadConfirmation && (
            <div className="download-confirmation-popup">
              <p>Are you sure you want to download the shortlist "{selectedShortlistDownloadName}"?</p>
              <button onClick={() => handleDownloadConfirmation(true)}>Yes</button>
              <button onClick={() => handleDownloadConfirmation(false)}>No</button>
            </div>
          )}
        </>
      )}
      <div className="back-button-container">
        <button onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  // Main render
  return (
    <div>
      {!activeBox && renderMainView()}
      {activeBox === "getInfo" && renderGetInfo()}
      {activeBox === "freeze" && renderFreeze()}
      {activeBox === "delete" && renderDelete()}
      {activeBox === "download" && renderDownload()}
    </div>
  );
};

export default ShortlistInfo;
