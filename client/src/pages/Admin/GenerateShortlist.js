import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin, Building2, ListChecks, Edit, Play, AlertTriangle, CheckCircle, Loader
} from 'lucide-react';
import "./GenerateShortlist.css";

const GenerateShortlist = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [selectionCriteria, setSelectionCriteria] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState("");
  const [shortlistName, setShortlistName] = useState("");
  const [shortlistDescription, setShortlistDescription] = useState("");
  const [shortlistingResult, setShortlistingResult] = useState(null);

  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [submittingShortlist, setSubmittingShortlist] = useState(false);

  const [statesError, setStatesError] = useState(null);
  const [criteriaError, setCriteriaError] = useState(null);
  const [districtsError, setDistrictsError] = useState(null);
  const [blocksError, setBlocksError] = useState(null);

  const currentYear = new Date().getFullYear();

  // 1. Fetch initial states and criteria
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitialData(true);
      try {
        const [statesRes, criteriaRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/allstates`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/criteria`)
        ]);
        setStates(statesRes.data);
        setSelectionCriteria(criteriaRes.data);
      } catch (err) {
        console.error("Initial fetch error:", err);
        setStatesError("Failed to load states.");
        setCriteriaError("Failed to load selection criteria.");
      } finally {
        setLoadingInitialData(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch districts
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedState) return;
      setLoadingDistricts(true);
      setDistrictsError(null);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/districts/${selectedState}`);
        setDistricts(res.data);
        setSelectedDistrict("");
        setBlocks([]);
        setSelectedBlocks([]);
      } catch (err) {
        console.error("Error fetching districts:", err);
        setDistrictsError("Failed to load districts for selected state.");
        setDistricts([]);
        setBlocks([]);
        setSelectedBlocks([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedState]);

  // 3. Fetch blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedDistrict) return;
      setLoadingBlocks(true);
      setBlocksError(null);
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/shortlist/generate/blocks/${selectedDistrict}`);
        setBlocks(res.data);
        setSelectedBlocks([]);
      } catch (err) {
        console.error("Error fetching blocks:", err);
        setBlocksError("Failed to load blocks for selected district.");
        setBlocks([]);
        setSelectedBlocks([]);
      } finally {
        setLoadingBlocks(false);
      }
    };
    fetchBlocks();
  }, [selectedDistrict]);

  const handleBlockChange = (blockName, isFrozen) => {
    if (isFrozen) return;
    setSelectedBlocks((prev) =>
      prev.includes(blockName)
        ? prev.filter((b) => b !== blockName)
        : [...prev, blockName]
    );
  };

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
      setShortlistingResult({ success: res.data.message, shortlistedCount: res.data.shortlistedCount });

      // Reset form
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedBlocks([]);
      setSelectedCriteria("");
      setShortlistName("");
      setShortlistDescription("");
    } catch (err) {
      console.error("Error during shortlisting:", err);
      setShortlistingResult({ error: err.response?.data?.error || "Shortlisting failed." });
    } finally {
      setSubmittingShortlist(false);
    }
  };

  const isFormValid = selectedCriteria && selectedState && selectedDistrict && shortlistName && shortlistDescription && selectedBlocks.length > 0;

  return (
    <div className="generate-shortlist">
      <h2>Shortlist Process</h2>
      <p>Select jurisdiction, criteria, and provide details to generate a shortlist.</p>

      {/* Select State */}
      <div className="location-selection">
        <h3><MapPin className="inline-block mr-2" />Select Jurisdiction</h3>
        {loadingInitialData ? (
          <p><Loader className="inline-block animate-spin mr-2" />Loading states...</p>
        ) : statesError ? (
          <p className="error-message">{statesError}</p>
        ) : (
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
            <option value="">Select State</option>
            {states.map((s) => (
              <option key={s.juris_code} value={s.juris_name}>{s.juris_name}</option>
            ))}
          </select>
        )}

        {/* Districts */}
        {loadingDistricts ? (
          <p><Loader className="inline-block animate-spin mr-2" />Loading districts...</p>
        ) : districtsError ? (
          <p className="error-message">{districtsError}</p>
        ) : (
          <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedState}>
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>
            ))}
          </select>
        )}

        {/* Blocks */}
        {loadingBlocks ? (
          <p><Loader className="inline-block animate-spin mr-2" />Loading blocks...</p>
        ) : blocksError ? (
          <p className="error-message">{blocksError}</p>
        ) : (
          blocks.length > 0 && (
            <div>
              <label><Building2 className="inline-block mr-2" />Select Blocks:</label>
              {blocks.map((block) => (
                <div key={block.juris_code}>
                  <input
                    type="checkbox"
                    checked={selectedBlocks.includes(block.juris_name)}
                    onChange={() => handleBlockChange(block.juris_name, block.is_frozen_block)}
                    disabled={block.is_frozen_block}
                  />
                  <label style={{ color: block.is_frozen_block ? "red" : "inherit" }}>
                    {block.juris_name} {block.is_frozen_block && "(Frozen)"}
                  </label>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Criteria */}
      <div className="selection-criteria">
        <label><ListChecks className="inline-block mr-2" />Selection Criteria:</label>
        {loadingInitialData ? (
          <p><Loader className="inline-block animate-spin mr-2" />Loading criteria...</p>
        ) : criteriaError ? (
          <p className="error-message">{criteriaError}</p>
        ) : (
          <select value={selectedCriteria} onChange={(e) => setSelectedCriteria(e.target.value)} disabled={selectionCriteria.length === 0}>
            <option value="">Select Criteria</option>
            {selectionCriteria.map((c) => (
              <option key={c.criteria_id} value={c.criteria_id}>{c.criteria}</option>
            ))}
          </select>
        )}
      </div>

      {/* Shortlist Details */}
      <div className="shortlist-details">
        <label><Edit className="inline-block mr-2" />Shortlist Name:</label>
        <input type="text" value={shortlistName} onChange={(e) => setShortlistName(e.target.value)} />

        <label><Edit className="inline-block mr-2" />Shortlist Description:</label>
        <textarea value={shortlistDescription} onChange={(e) => setShortlistDescription(e.target.value)} />
      </div>

      {/* Start Button */}
      <button onClick={handleStartShortlisting} disabled={!isFormValid || submittingShortlist}>
        {submittingShortlist ? (
          <><Loader className="inline-block animate-spin mr-2" />Processing...</>
        ) : (
          <><Play className="inline-block mr-2" />Start Shortlisting</>
        )}
      </button>

      {/* Result */}
      {shortlistingResult?.success && (
        <div className="success-box">
          <CheckCircle className="inline-block mr-2 text-green-500" />
          {shortlistingResult.success} (Shortlisted: {shortlistingResult.shortlistedCount})
        </div>
      )}

      {shortlistingResult?.error && (
        <div className="error-box">
          <AlertTriangle className="inline-block mr-2 text-red-500" />
          Error: {shortlistingResult.error}
        </div>
      )}
    </div>
  );
};

export default GenerateShortlist;