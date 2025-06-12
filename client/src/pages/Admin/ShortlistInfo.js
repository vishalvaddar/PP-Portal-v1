import React, { useState, useEffect, useRef } from "react";
import "./ShortlistInfo.css";
import * as XLSX from 'xlsx';

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

  const API_ENDPOINT = "http://localhost:5000/api/shortlists";
  const GET_INFO_ENDPOINT = `${API_ENDPOINT}/info`;
  const FREEZE_ENDPOINT = `${API_ENDPOINT}/freeze`;
  const DELETE_ENDPOINT = `${API_ENDPOINT}/delete`;
  const DOWNLOAD_SHOW_ENDPOINT = `${API_ENDPOINT}/show-data`;
  const DOWNLOAD_ENDPOINT = `${API_ENDPOINT}/download-data`;

  useEffect(() => {
    setLoadingShortlistNames(true);
    fetch(`${API_ENDPOINT}/names`)
      .then(response => response.json())
      .then(data => {
        setShortlistNames(data);
        setLoadingShortlistNames(false);
      })
      .catch(error => {
        console.error("Error fetching shortlist names:", error);
        setShortlistNamesError("Failed to load shortlist names.");
        setLoadingShortlistNames(false);
      });

    setLoadingNonFrozenNames(true);
    fetch(`${API_ENDPOINT}/non-frozen-names`)
      .then(response => response.json())
      .then(data => {
        setNonFrozenShortlistNames(data);
        setLoadingNonFrozenNames(false);
      })
      .catch(error => {
        console.error("Error fetching non-frozen shortlist names:", error);
        setNonFrozenNamesError("Failed to load non-frozen shortlists.");
        setLoadingNonFrozenNames(false);
      });

    fetch(`${API_ENDPOINT}/counts`)
      .then(response => response.json())
      .then(data => {
        animateCount(0, data.totalApplicants, setApplicantCount, applicantCountRef);
        animateCount(0, data.totalShortlisted, setShortlistedCount, shortlistedCountRef);
      })
      .catch(error => console.error("Error fetching applicant counts:", error));

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

  const renderShortlistOptions = (names, loading, errorMessage) => {
    if (loading) {
      return <option disabled>Loading shortlists...</option>;
    }
    if (errorMessage) {
      return <option disabled>{errorMessage}</option>;
    }
    if (names && names.length > 0) {
      return [<option key="default" value="" disabled>Select a Shortlist</option>].concat(
        names.map(name => (
          <option key={name} value={name}>{name}</option>
        ))
      );
    }
    return <option disabled>No shortlists exist.</option>;
  };

  const renderNonFrozenShortlistOptions = (names, loading, errorMessage) => {
    if (loading) {
      return <option disabled>Loading shortlists...</option>;
    }
    if (errorMessage) {
      return <option disabled>{errorMessage}</option>;
    }
    if (names && names.length > 0) {
      return [<option key="default" value="" disabled>Select a Shortlist</option>].concat(
        names.map(item => (
          <option key={item.id} value={item.name}>{item.name}</option>
        ))
      );
    }
    return <option disabled>No non-frozen shortlists exist!</option>;
  };

  const handleShortlistSelectInfo = (event) => {
    const selectedName = event.target.value;
    if (selectedName) {
      fetch(`${GET_INFO_ENDPOINT}/${selectedName}`)
        .then(response => response.json())
        .then(data => setSelectedShortlistInfo(data))
        .catch(error => console.error(`Error fetching info for ${selectedName}:`, error));
    } else {
      setSelectedShortlistInfo(null);
    }
  };

  const handleShortlistSelectFreeze = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      const selectedShortlist = nonFrozenShortlistNames.find(
        (item) => item.name === selectedValue
      );
      setSelectedShortlistFreezeName(selectedValue);
      setSelectedShortlistFreezeId(selectedShortlist?.id);
    } else {
      setSelectedShortlistFreezeName("");
      setSelectedShortlistFreezeId(null);
    }
  };

  const handleFreezeSubmit = () => {
    if (selectedShortlistFreezeId) {
      if (window.confirm(`Are you sure you want to freeze the shortlist "${selectedShortlistFreezeName}"? This action cannot be undone.`)) {
        fetch(FREEZE_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistFreezeId }),
        })
          .then(response => response.json())
          .then(data => {
            alert(data.message);
            window.location.reload();
          })
          .catch(error => console.error("Error freezing shortlist:", error));
      }
    } else {
      alert("Please select a shortlist to freeze.");
    }
  };

  const handleShortlistSelectDelete = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      const selectedShortlist = nonFrozenShortlistNames.find(
        (item) => item.name === selectedValue
      );
      setSelectedShortlistDeleteName(selectedValue);
      setSelectedShortlistDeleteId(selectedShortlist?.id);
    } else {
      setSelectedShortlistDeleteName("");
      setSelectedShortlistDeleteId(null);
    }
  };

  const handleDeleteSubmit = () => {
    if (selectedShortlistDeleteId) {
      if (window.confirm(`Are you sure you want to delete the shortlist "${selectedShortlistDeleteName}"? This action cannot be undone.`)) {
        fetch(DELETE_ENDPOINT, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shortlistBatchId: selectedShortlistDeleteId }),
        })
          .then(response => response.json())
          .then(data => {
            alert(data.message);
            window.location.reload();
          })
          .catch(error => console.error("Error deleting shortlist:", error));
      }
    } else {
      alert("Please select a shortlist to delete.");
    }
  };

  const handleShortlistSelectDownload = (event) => {
    setSelectedShortlistDownloadName(event.target.value);
    setShortlistedData([]);
    setShowDownloadConfirmation(false);
    setShowPreviewTable(false);
  };

  const handleShowData = () => {
    if (selectedShortlistDownloadName) {
      fetch(`${DOWNLOAD_SHOW_ENDPOINT}/${selectedShortlistDownloadName}`)
        .then(response => response.json())
        .then(data => {
          setShortlistedData(data.data);
          setShowPreviewTable(true);
        })
        .catch(error => console.error("Error fetching show data:", error));
    } else {
      alert("Please select a shortlist to view.");
    }
  };

  const handleDownloadConfirmation = (confirm) => {
    if (confirm) {
      fetch(`${DOWNLOAD_ENDPOINT}/${selectedShortlistDownloadName}`)
        .then(response => response.json())
        .then(data => {
          downloadExcel(data.data, data.name);
          setShowDownloadConfirmation(false);
          setSelectedShortlistDownloadName("");
          setShortlistedData([]);
          setShowPreviewTable(false);
          setActiveBox(null);
        })
        .catch(error => console.error("Error fetching download data:", error));
    } else {
      setShowDownloadConfirmation(false);
      window.location.reload(); // Refresh the page on "No"
    }
  };

  const downloadExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortlisted Applicants");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
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
          <div className="text-box">Show/Download</div>
        </div>
      </div>
    </div>
  );

  const renderGetInfo = () => (
    <div className="detailed-view get-info-view">
      <h2>Get Shortlist Information</h2>
      <select onChange={handleShortlistSelectInfo} defaultValue="">
        {renderShortlistOptions(shortlistNames, loadingShortlistNames, shortlistNamesError)}
      </select>
      {selectedShortlistInfo && (
        <div className="shortlist-details-info">
          <h3>{selectedShortlistInfo.name}</h3>
          <p><strong>Description:</strong> <span className="justified-text">{selectedShortlistInfo.description}</span></p>
          <p><strong>Criteria Used:</strong> <span className="justified-text">{selectedShortlistInfo.criteria}</span></p>
          <p><strong>Blocks Included:</strong> {selectedShortlistInfo.blocks.join(", ")}</p>
          <p><strong>Total Students in Blocks:</strong> {selectedShortlistInfo.totalStudents}</p>
          <p><strong>Total Shortlisted Students:</strong> {selectedShortlistInfo.shortlistedCount}</p>
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
              <h3>Shortlisted Applicants (Preview)</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(shortlistedData[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shortlistedData.map((applicant, index) => (
                      <tr key={index}>
                        {Object.values(applicant).map((value, index) => (
                          <td key={index}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!showDownloadConfirmation && (
                <button onClick={() => setShowDownloadConfirmation(true)}>Download</button>
              )}
            </div>
          )}

          {showDownloadConfirmation && (
            <div className="download-confirmation">
              <p>Do you want to download all data as an Excel file?</p>
              <div className="confirmation-buttons">
                <button onClick={() => handleDownloadConfirmation(true)}>Yes</button>
                <button onClick={() => handleDownloadConfirmation(false)}>No</button>
              </div>
            </div>
          )}
        </>
      )}
      {activeBox === "download" && !showDownloadConfirmation && (
        <div className="back-button-container">
          <button onClick={() => setActiveBox(null)}>Back</button>
        </div>
      )}
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