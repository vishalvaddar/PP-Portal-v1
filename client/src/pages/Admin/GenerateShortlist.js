import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin, Building2, ListChecks, Edit, Users,
  UserCheck, Play, AlertTriangle, CheckCircle
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
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [shortlistedStudents, setShortlistedStudents] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    axios.get("http://localhost:5000/api/shortlist/generate/allstates")
      .then((res) => setStates(res.data))
      .catch((err) => console.error("Error fetching all states:", err));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/shortlist/generate/criteria")
      .then((res) => setSelectionCriteria(res.data))
      .catch((err) => console.error("Error fetching criteria:", err));
  }, []);

  useEffect(() => {
    if (selectedState) {
      axios.get(`http://localhost:5000/api/shortlist/generate/districts/${selectedState}`)
        .then((res) => {
          setDistricts(res.data);
          setSelectedDistrict("");
          setBlocks([]);
          setSelectedBlocks([]);
        })
        .catch((err) => console.error("Error fetching districts:", err));
    } else {
      setDistricts([]);
      setBlocks([]);
      setSelectedDistrict("");
      setSelectedBlocks([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      setLoadingBlocks(true);
      axios.get(`http://localhost:5000/api/shortlist/generate/blocks/${selectedDistrict}`)
        .then((res) => {
          setBlocks(res.data);
          setSelectedBlocks([]);
        })
        .catch((err) => {
          console.error("Error fetching blocks:", err);
          setBlocks([]);
          setSelectedBlocks([]);
        })
        .finally(() => setLoadingBlocks(false));
    } else {
      setBlocks([]);
      setSelectedBlocks([]);
    }
  }, [selectedDistrict]);

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
      const totalRes = await axios.get(`http://localhost:5000/api/total-applicants?year=${currentYear}`);
      const shortlistedRes = await axios.get("http://localhost:5000/api/shortlisted-students");
      setTotalApplicants(totalRes.data.count || 0);
      setShortlistedStudents(shortlistedRes.data.count || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
    } finally {
      setLoadingCounts(false);
    }
  };

  const handleStartShortlisting = async () => {
    if (!selectedCriteria || !selectedState || !selectedDistrict || !shortlistName || !shortlistDescription || selectedBlocks.length === 0) {
      alert("Please fill all required fields and select at least one unfrozen block.");
      return;
    }

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
      const res = await axios.post("http://localhost:5000/api/shortlist/generate/start-shortlist", payload);
      setShortlistingResult({ success: res.data.message, shortlistedCount: res.data.shortlistedCount });
      fetchApplicantCounts();
    } catch (err) {
      const msg = err.response?.data?.error || "Shortlisting failed.";
      setShortlistingResult({ error: msg });
    }
  };

  const isFormValid = selectedCriteria && selectedState && selectedDistrict && shortlistName && shortlistDescription && selectedBlocks.length > 0;

  return (
    <div className="generate-shortlist">
      <h2>Shortlist Process</h2>
      <p>Select jurisdiction, criteria, and provide details to generate a shortlist.</p>

      {/* Jurisdiction */}
      <div className="location-selection">
        <h3><MapPin className="inline-block mr-2" />Select Jurisdiction</h3>
        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="dropdown" aria-label="Select State">
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.juris_code} value={state.juris_name}>{state.juris_name}</option>
          ))}
        </select>

        <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="dropdown" disabled={!selectedState} aria-label="Select District">
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.juris_code} value={district.juris_name}>{district.juris_name}</option>
          ))}
        </select>

        {loadingBlocks ? <p>Loading blocks...</p> : (
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
      </div>

      {/* Selection Criteria */}
      <div className="selection-criteria">
        <label htmlFor="criteria" className="criteria-label">
          <ListChecks className="inline-block mr-2" />Selection Criteria:
        </label>
        <select
          id="criteria"
          value={selectedCriteria}
          onChange={(e) => setSelectedCriteria(e.target.value)}
          className="dropdown"
        >
          <option value="">Select Criteria</option>
          {selectionCriteria.map((criteria) => (
            <option key={criteria.criteria_id} value={criteria.criteria_id}>{criteria.criteria}</option>
          ))}
        </select>
      </div>

      {/* Shortlist Details */}
      <div className="shortlist-details">
        <label htmlFor="shortlist-name" className="shortlist-label"><Edit className="inline-block mr-2" />Shortlist Name:</label>
        <input
          type="text"
          id="shortlist-name"
          value={shortlistName}
          onChange={(e) => setShortlistName(e.target.value)}
          className="shortlist-input"
          placeholder="e.g. Bailhongal_Kittur_Shortlist"
        />

        <label htmlFor="shortlist-description" className="shortlist-label"><Edit className="inline-block mr-2" />Shortlist Description:</label>
        <textarea
          id="shortlist-description"
          value={shortlistDescription}
          onChange={(e) => setShortlistDescription(e.target.value)}
          className="shortlist-textarea"
          placeholder="e.g. This shortlist includes the Bailhongal and Kittur blocks..."
        />
      </div>

      <button
        onClick={handleStartShortlisting}
        className="start-button"
        disabled={!isFormValid}
      >
        <Play className="inline-block mr-2" />Start Shortlisting Process
      </button>

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

      {loadingCounts && <p>Loading applicant counts...</p>}
      {totalApplicants > 0 && (
        <div className="applicant-counts">
          <p><Users className="inline-block mr-2" />Total Applicants ({currentYear}): {totalApplicants} | <UserCheck className="inline-block mr-2" />Shortlisted Students: {shortlistedStudents}</p>
        </div>
      )}
    </div>
  );
};

export default GenerateShortlist;
