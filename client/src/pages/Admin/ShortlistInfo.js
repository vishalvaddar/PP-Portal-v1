import React, { useState, useEffect, useRef } from "react";
import styles from "./ShortlistInfo.module.css"; // Ensure this import is correct and points to your CSS module
import * as xlsx from "xlsx"; // Import xlsx library

// IMPORTANT: Assume onClose is passed as a prop from a parent component.
// `onClose`: a function provided by the parent to close the modal or navigate away.
// You might need to adjust prop names based on your actual component structure.
function ShortlistInfo({ onClose }) {
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
  const applicantCountRef = useRef(0);
  const shortlistedCountRef = useRef(0);
  const [loadingShortlistNames, setLoadingShortlistNames] = useState(true);
  const [loadingNonFrozenNames, setLoadingNonFrozenNames] = useState(true);
  const [shortlistNamesError, setShortlistNamesError] = useState(null);
  const [nonFrozenNamesError, setNonFrozenNamesError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);


  // API Endpoints
  const BASE_API_URL = `${process.env.REACT_APP_API_URL}/api/shortlist/info`;

  const GET_NAMES_ENDPOINT = `${BASE_API_URL}/names`;
  const GET_NON_FROZEN_NAMES_ENDPOINT = `${BASE_API_URL}/non-frozen-names`;
  const GET_COUNTS_ENDPOINT = `${BASE_API_URL}/counts`;
  const FREEZE_ENDPOINT = `${BASE_API_URL}/freeze`;
  const DELETE_ENDPOINT = `${BASE_API_URL}/delete`;
  const GET_INFO_BY_NAME_ENDPOINT = `${BASE_API_URL}`;
  const DOWNLOAD_DATA_ENDPOINT = `${BASE_API_URL}/download-data`;

  // --- useEffects for Initial Data Loading ---
  useEffect(() => {
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

    fetchShortlistNames();
    fetchNonFrozenShortlistNames();
    fetchCounts();
  }, []);

  // --- Helper for animating counts ---
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

  // --- Handlers for UI Interactions ---
  const handleBoxClick = (boxId) => {
    console.log(`Clicked on box: ${boxId}`);
    setActiveBox(boxId);
    setSelectedShortlistInfo(null);
    setShowDownloadConfirmation(false);
    setSelectedShortlistDownloadName(""); // Clear download selection on box change
  };

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
      console.error(`Error fetching info for ${selectedName}:`, error);
      setSelectedShortlistInfo(null);
      alert(`Failed to fetch shortlist info: ${error.message}`);
    }
  };

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

  const handleFreezeSubmit = async () => {
    if (!selectedShortlistFreezeId) {
      alert("Please select a shortlist to freeze.");
      return;
    }
    if (window.confirm(`Are you sure you want to freeze the shortlist "${selectedShortlistFreezeName}"? This action cannot be undone.`)) {
      try {
        const res = await fetch(FREEZE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistFreezeId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `HTTP error! status: ${res.status}`);
        alert(data.message);
        window.location.reload(); // Reload to update UI
      } catch (error) {
        console.error("Error freezing shortlist:", error);
        alert(`Failed to freeze shortlist: ${error.message}`);
      }
    }
  };

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

  const handleDeleteSubmit = async () => {
    if (!selectedShortlistDeleteId) {
      alert("Please select a shortlist to delete.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the shortlist "${selectedShortlistDeleteName}"? This action cannot be undone.`)) {
      try {
        const res = await fetch(DELETE_ENDPOINT, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistDeleteId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `HTTP error! status: ${res.status}`);
        alert(data.message);
        window.location.reload(); // Reload to update UI
      } catch (error) {
        console.error("Error deleting shortlist:", error);
        alert(`Failed to delete shortlist: ${error.message}`);
      }
    }
  };

  const handleShortlistSelectDownload = (event) => {
    const selectedName = event.target.value;
    setSelectedShortlistDownloadName(selectedName);
    setShowDownloadConfirmation(false); // Reset confirmation state
  };

  // This function is triggered when user clicks 'Download' button in the UI
  const handleInitiateDownload = () => {
    if (!selectedShortlistDownloadName) {
      alert("Please select a shortlist to download.");
      return;
    }
    setShowDownloadConfirmation(true); // Show confirmation dialog
  };

  // This function handles the "Yes/No" from the confirmation dialog
  const handleDownloadConfirmationResponse = async (confirm) => {
    setShowDownloadConfirmation(false); // Hide the confirmation dialog

    if (confirm) {
      setIsDownloading(true); // Show loading indicator
      try {
        const response = await fetch(`${DOWNLOAD_DATA_ENDPOINT}/${selectedShortlistDownloadName}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Download API response:", result);

        if (result.status === "no_data") {
          alert(result.message);
          // If no data, go back to the main ShortlistInfo view or close modal
          if (onClose) {
            onClose(); // Use the passed onClose prop
          } else {
            setActiveBox(null); // Fallback to main view if onClose is not provided
            setSelectedShortlistDownloadName(""); // Clear selection
          }
        } else if (result.status === "success") {
          if (Array.isArray(result.data) && result.data.length > 0) {
            downloadExcel(result.data, result.name);
            alert("Download successful!");
            if (onClose) {
              onClose(); // Go back/close after successful download
            } else {
              setActiveBox(null);
              setSelectedShortlistDownloadName("");
            }
          } else {
            alert("Received successful status but no data was provided for download.");
            if (onClose) {
              onClose();
            } else {
              setActiveBox(null);
              setSelectedShortlistDownloadName("");
            }
          }
        } else {
          alert("Unexpected response status from server.");
        }
      } catch (error) {
        console.error("Error fetching download data:", error);
        alert(`Error fetching download data: ${error.message}`);
      } finally {
        setIsDownloading(false); // Hide loading indicator
      }
    } else {
      // User clicked 'No' on confirmation
      setActiveBox(null); // Go back to main view
      setSelectedShortlistDownloadName(""); // Clear selection
    }
  };

  const downloadExcel = (data, fileName) => {
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Shortlisted Applicants");
    xlsx.writeFile(workbook, `${fileName}_Shortlisted_Students.xlsx`);
  };

  // --- Render Functions for Different Views ---
  const renderMainView = () => (
    <div className={styles.container}>
      <h1 className={styles.heading}>Shortlist Management</h1>
      <div className={styles.countsContainer}>
        <div className={styles.countBox}>
          <p className={styles.countBoxText}>Total Applicants: {applicantCount}</p>
        </div>
        <div className={styles.countBox}>
          <p className={styles.countBoxText}>Shortlisted Students: {shortlistedCount}</p>
        </div>
      </div>

      <div className={styles.shortlistingStepsGrid}>
        <div className={styles.optionBox} onClick={() => handleBoxClick("getInfo")}>
          <div className={styles.iconBox}>ℹ</div>
          <div className={styles.textBox}>Get Shortlist Info</div>
        </div>
        <div className={styles.optionBox} onClick={() => handleBoxClick("freeze")}>
          <div className={styles.iconBox}>🔒</div>
          <div className={styles.textBox}>Freeze Shortlist</div>
        </div>
        <div className={styles.optionBox} onClick={() => handleBoxClick("delete")}>
          <div className={styles.iconBox}>🗑</div>
          <div className={styles.textBox}>Delete Shortlist</div>
        </div>
        <div className={styles.optionBox} onClick={() => handleBoxClick("download")}>
          <div className={styles.iconBox}>⬇</div>
          <div className={styles.textBox}>Download Shortlist</div>
        </div>
      </div>
    </div>
  );

  const renderGetInfo = () => (
    <div className={`${styles.detailedView} ${styles.getInfoView}`}> {/* Combine classes using template literal */}
      <h2 className={styles.detailedViewHeading}>Get Shortlist Information</h2>
      <select onChange={handleShortlistSelectInfo} value={selectedShortlistInfo?.name || ""}>
        {renderShortlistOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistInfo && (
        <div className={styles.shortlistDetailsInfo}>
          <h3 className={styles.shortlistDetailsInfoHeading}>{selectedShortlistInfo.name}</h3>
          <p className={styles.shortlistDetailsInfoText}>
            <strong>Description:</strong>{" "}
            <span className={styles.justifiedText}>{selectedShortlistInfo.description}</span>
          </p>
          <p className={styles.shortlistDetailsInfoText}>
            <strong>Criteria Used:</strong>{" "}
            <span className={styles.justifiedText}>{selectedShortlistInfo.criteria}</span>
          </p>
          <p className={styles.shortlistDetailsInfoText}>
            <strong>Blocks Included:</strong>{" "}
            {Array.isArray(selectedShortlistInfo.blocks)
              ? selectedShortlistInfo.blocks.join(", ")
              : "N/A"}
          </p>
          <p className={styles.shortlistDetailsInfoText}>
            <strong>Total Students in Blocks:</strong> {selectedShortlistInfo.totalStudents}
          </p>
          <p className={styles.shortlistDetailsInfoText}>
            <strong>Total Shortlisted Students:</strong> {selectedShortlistInfo.shortlistedCount}
          </p>
          <p className={styles.shortlistDetailsInfoText}>
            <strong>Is Frozen:</strong> {selectedShortlistInfo.isFrozen ? "Yes" : "No"}
          </p>
        </div>
      )}
      <div className={styles.backButtonContainer}>
        <button className={styles.detailedViewButton} onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  const renderFreeze = () => (
    <div className={styles.detailedView}>
      <h2 className={styles.detailedViewHeading}>Freeze Shortlist</h2>
      <select onChange={handleShortlistSelectFreeze} value={selectedShortlistFreezeName}>
        {renderNonFrozenShortlistOptions(nonFrozenShortlistNames, loadingNonFrozenNames, nonFrozenNamesError)}
      </select>
      {selectedShortlistFreezeName && <p>You have selected: {selectedShortlistFreezeName} to freeze.</p>}
      <button className={styles.detailedViewButton} onClick={handleFreezeSubmit} disabled={!selectedShortlistFreezeId}>
        Freeze Shortlist
      </button>
      <div className={styles.backButtonContainer}>
        <button className={styles.detailedViewButton} onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  const renderDelete = () => (
    <div className={styles.detailedView}>
      <h2 className={styles.detailedViewHeading}>Delete Shortlist</h2>
      <select onChange={handleShortlistSelectDelete} value={selectedShortlistDeleteName}>
        {renderNonFrozenShortlistOptions(nonFrozenShortlistNames, loadingNonFrozenNames, nonFrozenNamesError)}
      </select>
      {selectedShortlistDeleteName && <p>You have selected: {selectedShortlistDeleteName} to delete.</p>}
      <button className={styles.detailedViewButton} onClick={handleDeleteSubmit} disabled={!selectedShortlistDeleteId}>
        Delete Shortlist
      </button>
      <div className={styles.backButtonContainer}>
        <button className={styles.detailedViewButton} onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  const renderDownload = () => (
    <div className={`${styles.detailedView} ${styles.downloadView}`}> {/* Using both detailedView and downloadView classes */}
      <h2 className={styles.detailedViewHeading}>Download Shortlist Data For calling </h2>
      <select onChange={handleShortlistSelectDownload} value={selectedShortlistDownloadName}>
        {renderShortlistOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistDownloadName && (
        <p>You have selected: {selectedShortlistDownloadName} for download.</p>
      )}
      <button className={`${styles.detailedViewButton} ${styles.belowButton}`} onClick={handleInitiateDownload} disabled={!selectedShortlistDownloadName || isDownloading}>
        {isDownloading ? "Downloading..." : "Download Shortlist"}
      </button>

      {showDownloadConfirmation && (
        <div className={styles.downloadConfirmation}>
          <p>Are you sure you want to download data for "{selectedShortlistDownloadName}"?</p>
          <div className={styles.confirmationButtons}>
            <button className={styles.confirmationButton} onClick={() => handleDownloadConfirmationResponse(true)}>Yes</button>
            <button className={styles.confirmationButton} onClick={() => handleDownloadConfirmationResponse(false)}>No</button>
          </div>
        </div>
      )}

      <div className={styles.backButtonContainer}>
        <button className={styles.detailedViewButton} onClick={() => setActiveBox(null)}>Back</button>
      </div>
    </div>
  );

  // --- Main Render Logic ---
  const renderContent = () => {
    switch (activeBox) {
      case "getInfo":
        return renderGetInfo();
      case "freeze":
        return renderFreeze();
      case "delete":
        return renderDelete();
      case "download":
        return renderDownload();
      default:
        return renderMainView();
    }
  };

  return (
    <div className={styles.shortlistInfoContainer}> {/* Main container for the component */}
      {renderContent()}
    </div>
  );
}

export default ShortlistInfo;
