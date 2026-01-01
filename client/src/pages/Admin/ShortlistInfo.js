import React, { useState, useEffect, useRef } from "react";
import styles from "./ShortlistInfo.module.css";
import * as xlsx from "xlsx"; 
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

function ShortlistInfo({ onClose }) {
  // Path for Breadcrumbs
  const currentPath = ['Admin', 'Admissions', 'Shortlisting', 'Shortlist-Info'];

  // --- State Variables ---
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

  const [showDownloadConfirmation, setShowDownloadConfirmation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Loading states
  const [loadingShortlistNames, setLoadingShortlistNames] = useState(true);
  const [loadingNonFrozenNames, setLoadingNonFrozenNames] = useState(true);

  // Error states
  const [shortlistNamesError, setShortlistNamesError] = useState(null);
  const [nonFrozenNamesError, setNonFrozenNamesError] = useState(null);

  // Refs for animated counts
  const applicantCountRef = useRef(0);
  const shortlistedCountRef = useRef(0);

  // --- API Endpoints ---
  const BASE_API_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist-info`;

  const GET_NAMES_ENDPOINT = `${BASE_API_URL}/names`;
  const GET_NON_FROZEN_NAMES_ENDPOINT = `${BASE_API_URL}/non-frozen-names`;
  const GET_COUNTS_ENDPOINT = `${BASE_API_URL}/counts`;
  const FREEZE_ENDPOINT = `${BASE_API_URL}/freeze`;
  const DELETE_ENDPOINT = `${BASE_API_URL}/delete`;
  const GET_INFO_BY_NAME_ENDPOINT = `${BASE_API_URL}`;
  const DOWNLOAD_DATA_ENDPOINT = `${BASE_API_URL}/download-data`;

  // --- Data Fetching: useEffect ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await Promise.all([fetchShortlistNames(), fetchNonFrozenShortlistNames(), fetchCounts()]);
  };

  const fetchShortlistNames = async () => {
    setLoadingShortlistNames(true);
    try {
      const res = await fetch(GET_NAMES_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setShortlistNames(data);
    } catch (error) {
      console.error("Error fetching shortlist names:", error);
      setShortlistNamesError("Failed to load shortlist names.");
    } finally {
      setLoadingShortlistNames(false);
    }
  };

  const fetchNonFrozenShortlistNames = async () => {
    setLoadingNonFrozenNames(true);
    try {
      const res = await fetch(GET_NON_FROZEN_NAMES_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setNonFrozenShortlistNames(data);
    } catch (error) {
      console.error("Error fetching non-frozen shortlist names:", error);
      setNonFrozenNamesError("Failed to load non-frozen shortlists.");
    } finally {
      setLoadingNonFrozenNames(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const res = await fetch(GET_COUNTS_ENDPOINT);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      animateCount(0, data.totalApplicants, setApplicantCount, applicantCountRef);
      animateCount(0, data.totalShortlisted, setShortlistedCount, shortlistedCountRef);
    } catch (error) {
      console.error("Error fetching applicant counts:", error);
    }
  };

  // Helper for animated count
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

  // --- Handlers ---
  const handleBoxClick = (boxId) => {
    setActiveBox(boxId);
    // Reset selections when switching views
    setSelectedShortlistInfo(null);
    setShowDownloadConfirmation(false);
    setSelectedShortlistDownloadName("");
  };

  // Render Options for Shortlist Select
  const renderOptions = (names, loading, errorMessage, isFullObject = false) => {
    if (loading) return <option disabled>Loading...</option>;
    if (errorMessage) return <option disabled>{errorMessage}</option>;
    if (names && names.length > 0) {
      return [
        <option key="default" value="" disabled>
          Select a Shortlist
        </option>,
        ...names.map((item) =>
          isFullObject ? (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ) : (
            <option key={item} value={item}>
              {item}
            </option>
          )
        ),
      ];
    }
    return <option disabled>No shortlists exist.</option>;
  };

  // Fetch info by selected name
  const handleShortlistSelectInfo = async (event) => {
    const selectedName = event.target.value;
    if (!selectedName) {
      setSelectedShortlistInfo(null);
      return;
    }
    try {
      const res = await fetch(`${GET_INFO_BY_NAME_ENDPOINT}/${selectedName}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSelectedShortlistInfo(data);
    } catch (error) {
      console.error(`Error fetching info:`, error);
      setSelectedShortlistInfo(null);
      alert(`Failed to fetch shortlist info: ${error.message}`);
    }
  };

  // Freeze Shortlist Handlers
  const handleShortlistSelectFreeze = (event) => {
    const value = event.target.value;
    const selected = nonFrozenShortlistNames.find((item) => item.name === value);
    setSelectedShortlistFreezeName(value);
    setSelectedShortlistFreezeId(selected?.id ?? null);
  };

  const handleFreezeSubmit = async () => {
    if (!selectedShortlistFreezeId) return;
    if (window.confirm(`Freeze ${selectedShortlistFreezeName}?`)) {
      try {
        const res = await fetch(FREEZE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistFreezeId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error");
        alert(data.message);
        window.location.reload();
      } catch (error) {
        alert(`Freeze failed: ${error.message}`);
      }
    }
  };

  // Delete Shortlist Handlers
  const handleShortlistSelectDelete = (event) => {
    const value = event.target.value;
    const selected = nonFrozenShortlistNames.find((item) => item.name === value);
    setSelectedShortlistDeleteName(value);
    setSelectedShortlistDeleteId(selected?.id ?? null);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedShortlistDeleteId) return;
    if (window.confirm(`Delete ${selectedShortlistDeleteName}?`)) {
      try {
        const res = await fetch(DELETE_ENDPOINT, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistDeleteId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error");
        alert(data.message);
        window.location.reload();
      } catch (error) {
        alert(`Delete failed: ${error.message}`);
      }
    }
  };

  // Download Handlers
  const handleShortlistSelectDownload = (event) => {
    setSelectedShortlistDownloadName(event.target.value);
    setShowDownloadConfirmation(false);
  };

  const handleInitiateDownload = () => {
    if (!selectedShortlistDownloadName) {
      alert("Select a shortlist to download");
      return;
    }
    setShowDownloadConfirmation(true);
  };

  const handleDownloadConfirmationResponse = async (confirm) => {
    setShowDownloadConfirmation(false);
    if (confirm) {
      setIsDownloading(true);
      try {
        const response = await fetch(`${DOWNLOAD_DATA_ENDPOINT}/${selectedShortlistDownloadName}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error");
        }
        const result = await response.json();
        handleDownloadResponse(result);
      } catch (error) {
        alert(`Download error: ${error.message}`);
      } finally {
        setIsDownloading(false);
      }
    } else {
      // Cancel download, go back
      setActiveBox(null);
      setSelectedShortlistDownloadName("");
    }
  };

  const handleDownloadResponse = (result) => {
    if (result.status === "no_data") {
      alert(result.message);
      if (onClose) onClose();
      else {
        setActiveBox(null);
        setSelectedShortlistDownloadName("");
      }
    } else if (result.status === "success") {
      if (Array.isArray(result.data) && result.data.length > 0) {
        downloadExcel(result.data, result.name);
        alert("Download successful");
        if (onClose) onClose();
        else {
          setActiveBox(null);
          setSelectedShortlistDownloadName("");
        }
      } else {
        alert("No data available for download");
        if (onClose) onClose();
        else {
          setActiveBox(null);
          setSelectedShortlistDownloadName("");
        }
      }
    } else {
      alert("Unexpected server response");
    }
  };

  const downloadExcel = (data, fileName) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Applicants");
    xlsx.writeFile(workbook, `${fileName}_Applicants.xlsx`);
  };

  // --- Render Functions ---
  const renderMainView = () => (
    <div className={styles.container}>
      <h1 className={styles.heading}>Shortlist Management</h1>
      <div className={styles.countsContainer}>
        <div className={styles.countBox}>
          <p className={styles.countBoxText}>Total Students: {applicantCount}</p>
        </div>
        <div className={styles.countBox}>
          <p className={styles.countBoxText}>Shortlisted Students: {shortlistedCount}</p>
        </div>
      </div>
      <div className={styles.shortlistingStepsGrid}>
        {[
          { icon: "ℹ", label: "Get Shortlist Info", boxId: "getInfo" },
          { icon: "🔒", label: "Freeze Shortlist", boxId: "freeze" },
          { icon: "🗑", label: "Delete Shortlist", boxId: "delete" },
          { icon: "⬇", label: "Download Shortlist", boxId: "download" },
        ].map((item) => (
          <div
            key={item.boxId}
            className={styles.optionBox}
            onClick={() => handleBoxClick(item.boxId)}
          >
            <div className={styles.iconBox}>{item.icon}</div>
            <div className={styles.textBox}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGetInfo = () => (
    <div className={`${styles.detailedView} ${styles.getInfoView}`}>
      <h2 className={styles.detailedViewHeading}>Get Shortlist Information</h2>
      <select onChange={handleShortlistSelectInfo} value={selectedShortlistInfo?.name || ""}>
        {renderOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistInfo && (
        <div className={styles.shortlistDetailsInfo}>
          {/* Details display, same as previous */}
        </div>
      )}
      <button className={styles.backButton} onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  const renderFreeze = () => (
    <div className={styles.detailedView}>
      <h2 className={styles.detailedViewHeading}>Freeze Shortlist</h2>
      <select onChange={handleShortlistSelectFreeze} value={selectedShortlistFreezeName}>
        {renderOptions(nonFrozenShortlistNames, loadingNonFrozenNames, nonFrozenNamesError, true)}
      </select>
      {selectedShortlistFreezeName && (
        <p>You have selected: {selectedShortlistFreezeName} to freeze.</p>
      )}
      <button
        className={styles.freezeButton}
        onClick={handleFreezeSubmit}
        disabled={!selectedShortlistFreezeId}
      >
        Freeze Shortlist
      </button>
      <button className={styles.backButton} onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  const renderDelete = () => (
    <div className={styles.detailedView}>
      <h2 className={styles.detailedViewHeading}>Delete Shortlist</h2>
      <select onChange={handleShortlistSelectDelete} value={selectedShortlistDeleteName}>
        {renderOptions(nonFrozenShortlistNames, loadingNonFrozenNames, nonFrozenNamesError, true)}
      </select>
      {selectedShortlistDeleteName && (
        <p>You have selected: {selectedShortlistDeleteName} to delete.</p>
      )}
      <button
        className={styles.deleteButton}
        onClick={handleDeleteSubmit}
        disabled={!selectedShortlistDeleteId}
      >
        Delete Shortlist
      </button>
      <button className={styles.backButton} onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  const renderDownload = () => (
    <div className={`${styles.detailedView} ${styles.downloadView}`}>
      <h2 className={styles.detailedViewHeading}>Download Shortlist Data</h2>
      <select onChange={handleShortlistSelectDownload} value={selectedShortlistDownloadName}>
        {renderOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistDownloadName && (
        <p>You have selected: {selectedShortlistDownloadName} for download.</p>
      )}
      <button
        className={`${styles.downloadButton} ${styles.belowButton}`}
        onClick={handleInitiateDownload}
        disabled={!selectedShortlistDownloadName || isDownloading}
      >
        {isDownloading ? "Downloading..." : "Download Shortlist"}
      </button>

      {showDownloadConfirmation && (
        <div className={styles.downloadConfirmation}>
          <p>Are you sure you want to download data for "{selectedShortlistDownloadName}"?</p>
          <div className={styles.confirmationButtons}>
            <button onClick={() => handleDownloadConfirmationResponse(true)}>Yes</button>
            <button onClick={() => handleDownloadConfirmationResponse(false)}>No</button>
          </div>
        </div>
      )}

      <button className={styles.backButton} onClick={() => setActiveBox(null)}>Back</button>
    </div>
  );

  // Main render based on activeBox
  const renderContent = () => {
    switch (activeBox) {
      case "getInfo": return renderGetInfo();
      case "freeze": return renderFreeze();
      case "delete": return renderDelete();
      case "download": return renderDownload();
      default: return renderMainView();
    }
  };

  return (
    <div className={styles.shortlistInfoContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
      {renderContent()}
    </div>
  );
}

export default ShortlistInfo;