import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin, Building2, ListChecks, Edit, Play, AlertTriangle, CheckCircle, Loader
} from 'lucide-react'; // Removed Users and UserCheck as they're no longer used for general counts
import "./GenerateShortlist.css";

const GenerateShortlist = () => {
  // State for location data
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);

  // State for selected location values
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState([]);

  // State for selection criteria
  const [selectionCriteria, setSelectionCriteria] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState("");

  // State for shortlist naming
  const [shortlistName, setShortlistName] = useState("");
  const [shortlistDescription, setShortlistDescription] = useState("");

  // State for shortlisting process result ONLY
  const [shortlistingResult, setShortlistingResult] = useState(null);

  // Removed: State for total applicants and shortlisted students (not needed)
  // const [totalApplicants, setTotalApplicants] = useState(0);
  // const [shortlistedStudents, setShortlistedStudents] = useState(0);
  // const [loadingCounts, setLoadingCounts] = useState(false);

  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true); // For states & criteria
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [submittingShortlist, setSubmittingShortlist] = useState(false);

  // Error states for initial data fetches
  const [statesError, setStatesError] = useState(null);
  const [criteriaError, setCriteriaError] = useState(null);
  const [districtsError, setDistrictsError] = useState(null);
  const [blocksError, setBlocksError] = useState(null);


  const currentYear = new Date().getFullYear();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/allstates`)
      .then((res) => setStates(res.data))
      .catch((err) => console.error("Error fetching all states:", err));
  }, []);

  // --- Effect Hooks for Data Fetching ---

  // 1. Fetch States and Selection Criteria on component mount
  useEffect(() => {

    axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/criteria`)
      .then((res) => setSelectionCriteria(res.data))
      .catch((err) => console.error("Error fetching criteria:", err));

    const fetchInitialData = async () => {
      setLoadingInitialData(true);
      setStatesError(null);
      setCriteriaError(null);
      try {
        const [statesRes, criteriaRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/allstates`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/criteria`)
        ]);
        setStates(statesRes.data);
        setSelectionCriteria(criteriaRes.data);
      } catch (err) {
        console.error("Error fetching initial data (states/criteria):", err);
        if (err.response) {
          if (err.response.status === 500 && err.config.url.includes('criteria')) {
             setCriteriaError("Failed to load selection criteria. Server error.");
          } else if (err.response.status === 500 && err.config.url.includes('allstates')) {
             setStatesError("Failed to load states. Server error.");
          } else {
             setStatesError("Failed to load states.");
             setCriteriaError("Failed to load selection criteria.");
          }
        } else if (err.request) {
          setStatesError("Network error: Could not connect to backend to fetch states.");
          setCriteriaError("Network error: Could not connect to backend to fetch criteria.");
        } else {
          setStatesError("An unexpected error occurred while fetching states.");
          setCriteriaError("An unexpected error occurred while fetching criteria.");
        }
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchInitialData();

  }, []);


  // 2. Fetch Districts when a State is selected
  useEffect(() => {

    if (selectedState) {
      axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/districts/${selectedState}`)
        .then((res) => {

    const fetchDistricts = async () => {
      if (selectedState) {
        setLoadingDistricts(true);
        setDistrictsError(null);
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/districts/${selectedState}`);

          setDistricts(res.data);
          setSelectedDistrict(""); // Reset district selection when state changes
          setBlocks([]); // Clear blocks
          setSelectedBlocks([]); // Clear selected blocks
        } catch (err) {
          console.error("Error fetching districts:", err);
          setDistrictsError("Failed to load districts for selected state.");
          setDistricts([]);
          setSelectedDistrict("");
          setBlocks([]);
          setSelectedBlocks([]);
        } finally {
          setLoadingDistricts(false);
        }
      } else {
        setDistricts([]);
        setSelectedDistrict("");
        setBlocks([]);
        setSelectedBlocks([]);
      }
    };
    fetchDistricts();
  }, [selectedState]);


  // 3. Fetch Blocks when a District is selected
  useEffect(() => {

    if (selectedDistrict) {
      setLoadingBlocks(true);
      axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/blocks/${selectedDistrict}`)
        .then((res) => {

    const fetchBlocks = async () => {
      if (selectedDistrict) {
        setLoadingBlocks(true);
        setBlocksError(null);
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/blocks/${selectedDistrict}`);

          setBlocks(res.data);
          setSelectedBlocks([]); // Clear selected blocks when district changes
        } catch (err) {
          console.error("Error fetching blocks:", err);
          setBlocksError("Failed to load blocks for selected district.");
          setBlocks([]);
          setSelectedBlocks([]);
        } finally {
          setLoadingBlocks(false);
        }
      } else {
        setBlocks([]);
        setSelectedBlocks([]);
      }
    };
    fetchBlocks();
  }, [selectedDistrict]);

  // Removed: No longer fetching general applicant counts on mount or after shortlisting
  // useEffect(() => {
  //   fetchApplicantCounts();
  // }, []);


  // --- Event Handlers and Logic ---

  const handleBlockChange = (blockName, isFrozen) => {
    if (isFrozen) return;

    setSelectedBlocks((prev) =>
      prev.includes(blockName)
        ? prev.filter((b) => b !== blockName)
        : [...prev, blockName]
    );
  };


  const fetchApplicantCounts = async () => {
    setLoadingCounts(true);
    try {
      const totalRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/total-applicants?year=${currentYear}`);
      const shortlistedRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/shortlisted-students`);
      setTotalApplicants(totalRes.data.count || 0);
      setShortlistedStudents(shortlistedRes.data.count || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Removed: This function is no longer needed
  // const fetchApplicantCounts = async () => {
  //   setLoadingCounts(true);
  //   try {
  //     const totalRes = await axios.get(`http://localhost:5000/api/total-applicants?year=${currentYear}`);
  //     const shortlistedRes = await axios.get("http://localhost:5000/api/shortlisted-students");
  //     setTotalApplicants(totalRes.data.count || 0);
  //     setShortlistedStudents(shortlistedRes.data.count || 0);
  //   } catch (error) {
  //     console.error("Error fetching counts:", error);
  //   } finally {
  //     setLoadingCounts(false);
  //   }
  // };


  const handleStartShortlisting = async () => {
    if (!selectedCriteria || !selectedState || !selectedDistrict || !shortlistName || !shortlistDescription || selectedBlocks.length === 0) {
      alert("Please fill all required fields and select at least one unfrozen block.");
      return;
    }

    setSubmittingShortlist(true);
    setShortlistingResult(null);

    const payload = {
      criteriaId: selectedCriteria,
      locations: {
        state: selectedState,
        district: selectedDistrict,
        blocks: selectedBlocks,
      },
      name: shortlistName,
      description: shortlistDescription,
      year: currentYear,
    };

    try {

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/start-shortlist`, payload);

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/start-shortlist`, payload);

      setShortlistingResult({ success: res.data.message, shortlistedCount: res.data.shortlistedCount });

      // Removed: No longer calling fetchApplicantCounts after shortlisting
      // fetchApplicantCounts();

      // Optionally reset form fields after successful submission
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedBlocks([]);
      setSelectedCriteria("");
      setShortlistName("");
      setShortlistDescription("");
    } catch (err) {
      console.error("Error during shortlisting process:", err);
      const msg = err.response?.data?.error || "Shortlisting failed due to an unexpected error.";
      setShortlistingResult({ error: msg });
    } finally {
      setSubmittingShortlist(false);
    }
  };

  const isFormValid = selectedCriteria && selectedState && selectedDistrict && shortlistName && shortlistDescription && selectedBlocks.length > 0;

  return (
    <div className="generate-shortlist">
      <h2>Shortlist Process</h2>
      <p>Select jurisdiction, criteria, and provide details to generate a shortlist.</p>

      {/* Jurisdiction Section */}
      <div className="location-selection">
        <h3><MapPin className="inline-block mr-2" />Select Jurisdiction</h3>

        {loadingInitialData ? (
          <p className="loading-message"><Loader className="inline-block animate-spin mr-2" />Loading states...</p>
        ) : statesError ? (
          <p className="error-message"><AlertTriangle className="inline-block mr-2" />{statesError}</p>
        ) : (
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="dropdown" aria-label="Select State">
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.juris_code} value={state.juris_name}>{state.juris_name}</option>
            ))}
          </select>
        )}

        {loadingDistricts ? (
          <p className="loading-message"><Loader className="inline-block animate-spin mr-2" />Loading districts...</p>
        ) : districtsError ? (
          <p className="error-message"><AlertTriangle className="inline-block mr-2" />{districtsError}</p>
        ) : (
          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="dropdown" disabled={!selectedState}>
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district.juris_code} value={district.juris_name}>{district.juris_name}</option>
            ))}
          </select>
        )}

        {loadingBlocks ? (
          <p className="loading-message"><Loader className="inline-block animate-spin mr-2" />Loading blocks...</p>
        ) : blocksError ? (
          <p className="error-message"><AlertTriangle className="inline-block mr-2" />{blocksError}</p>
        ) : (
          blocks.length > 0 && (
            <div className="checkbox-group">
              <label><Building2 className="inline-block mr-2" />Select Blocks:</label>
              {blocks.map((block) => (
                <div key={block.juris_code}>
                  <input
                    type="checkbox"
                    id={block.juris_name}
                    checked={selectedBlocks.includes(block.juris_name)}
                    onChange={() => handleBlockChange(block.juris_name, block.is_frozen_block)}
                    disabled={block.is_frozen_block}
                  />
                  <label htmlFor={block.juris_name} style={{ color: block.is_frozen_block ? "red" : "inherit" }}>
                    {block.juris_name}
                    {block.is_frozen_block && <span style={{ marginLeft: 5 }}>(Frozen)</span>}
                  </label>
                </div>
              ))}
            </div>
          )
        )}
        {!loadingBlocks && !blocksError && selectedDistrict && blocks.length === 0 && (
            <p className="info-message">No blocks found for the selected district.</p>
        )}
      </div>

      {/* Selection Criteria Section */}
      <div className="selection-criteria">
        <label htmlFor="criteria" className="criteria-label">
          <ListChecks className="inline-block mr-2" />Selection Criteria:
        </label>
        {loadingInitialData ? (
          <p className="loading-message"><Loader className="inline-block animate-spin mr-2" />Loading criteria...</p>
        ) : criteriaError ? (
          <p className="error-message"><AlertTriangle className="inline-block mr-2" />{criteriaError}</p>
        ) : (
          <select
            id="criteria"
            value={selectedCriteria}
            onChange={(e) => setSelectedCriteria(e.target.value)}
            className="dropdown"
            disabled={selectionCriteria.length === 0}
          >
            <option value="">Select Criteria</option>
            {selectionCriteria.map((criteria) => (
              <option key={criteria.criteria_id} value={criteria.criteria_id}>{criteria.criteria}</option>
            ))}
          </select>
        )}
        {!loadingInitialData && !criteriaError && selectionCriteria.length === 0 && (
            <p className="info-message">No selection criteria available.</p>
        )}
      </div>

      {/* Shortlist Details Section */}
      <div className="shortlist-details">
        <label htmlFor="shortlist-name" className="shortlist-label"><Edit className="inline-block mr-2" />Shortlist Name:</label>
        <input
          type="text"
          id="shortlist-name"
          value={shortlistName}
          onChange={(e) => setShortlistName(e.target.value)}
          className="shortlist-input"
          placeholder="e.g. Bailhongal_Kittur_Shortlist"
          aria-required="true"
        />

        <label htmlFor="shortlist-description" className="shortlist-label"><Edit className="inline-block mr-2" />Shortlist Description:</label>
        <textarea
          id="shortlist-description"
          value={shortlistDescription}
          onChange={(e) => setShortlistDescription(e.target.value)}
          className="shortlist-textarea"
          placeholder="e.g. This shortlist includes the Bailhongal and Kittur blocks..."
          aria-required="true"
        />
      </div>

      {/* Start Shortlisting Button */}
      <button
        onClick={handleStartShortlisting}
        className="start-button"
        disabled={!isFormValid || submittingShortlist}
      >
        {submittingShortlist ? (
          <><Loader className="inline-block animate-spin mr-2" />Processing...</>
        ) : (
          <><Play className="inline-block mr-2" />Start Shortlisting Process</>
        )}
      </button>

      {/* Shortlisting Result Display */}
      {shortlistingResult?.success && (
        <div className="shortlisting-result success-box">
          <CheckCircle className="inline-block mr-2 text-green-500" />
          <p>{shortlistingResult.success}</p>
          <p>Total Shortlisted Applicants: {shortlistingResult.shortlistedCount}</p>
        </div>
      )}

      {shortlistingResult?.error && (
        <div className="shortlisting-result error-box">
          <AlertTriangle className="inline-block mr-2 text-red-500" />
          <p>Error: {shortlistingResult.error}</p>
        </div>
      )}

      {/* Removed: Applicant Counts Display Section */}
      {/* {loadingCounts && <p>Loading applicant counts...</p>}
      {totalApplicants > 0 && (
        <div className="applicant-counts">
          <p><Users className="inline-block mr-2" />Total Applicants ({currentYear}): {totalApplicants} | <UserCheck className="inline-block mr-2" />Shortlisted Students: {shortlistedStudents}</p>
        </div>
      )} */}
    </div>
  );
};

export default GenerateShortlist;
