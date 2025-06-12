import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapPin, // For State and District
  Building2, // For Blocks
  ListChecks, // For Selection Criteria
  Edit,       // For Shortlist Name/Description
  Users,       // For Total Applicants
  UserCheck,       // For Shortlisted Students
  Play,       // For Start Shortlisting
  AlertTriangle, //For error
  CheckCircle, //For Success
} from 'lucide-react';
import "./GenerateShortlist.css"; // You can keep your existing CSS file

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
    axios.get("http://localhost:5000/api/allstates")
      .then(response => {
        setStates(response.data);
      })
      .catch(error => console.error("Error fetching allstates:", error));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/api/criteria")
      .then(response => {
        setSelectionCriteria(response.data);
      })
      .catch(error => console.error("Error fetching criteria:", error));
  }, []);


  useEffect(() => {
    if (selectedState) {
      axios.get(`http://localhost:5000/api/districts/${selectedState}`)
        .then(response => {
          setDistricts(response.data);
          setSelectedDistrict("");
          setBlocks([]);
          setSelectedBlocks([]);
        })
        .catch(error => console.error("Error fetching districts:", error));
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
      axios.get(`http://localhost:5000/api/blocks/${selectedDistrict}`)
        .then(response => {
          setBlocks(response.data);
          setSelectedBlocks([]);
          setLoadingBlocks(false);
        })
        .catch(error => {
          console.error("Error fetching blocks:", error);
          setBlocks([]);
          setSelectedBlocks([]);
          setLoadingBlocks(false);
        });
    } else {
      setBlocks([]);
      setSelectedBlocks([]);
    }
  }, [selectedDistrict]);

  const handleBlockChange = (blockName, isFrozen) => {
    if (!isFrozen) {
      setSelectedBlocks(prev =>
        prev.includes(blockName)
          ? prev.filter(b => b !== blockName)
          : [...prev, blockName]
      );
    }
  };

  const fetchApplicantCounts = async () => {
    setLoadingCounts(true);
    try {
      const totalResponse = await axios.get(`http://localhost:5000/api/total-applicants?year=${currentYear}`);
      setTotalApplicants(totalResponse.data.count);
      const shortlistedResponse = await axios.get("http://localhost:5000/api/shortlisted-students");
      setShortlistedStudents(shortlistedResponse.data.count);
    } catch (error) {
      console.error("Error fetching applicant counts:", error);
    } finally {
      setLoadingCounts(false);
    }
  }

  const handleStartShortlisting = async () => {
    if (selectedCriteria && selectedState && selectedDistrict && shortlistName && shortlistDescription) {
      const selectedLocations = {
        state: selectedState,
        district: selectedDistrict,
        blocks: selectedBlocks,
      };

      console.log("selectedState:", selectedState);
      console.log("selectedDistrict:", selectedDistrict);
      console.log("selectedLocations:", selectedLocations);
      console.log("currentYear:", currentYear);

      try {
        const response = await axios.post("http://localhost:5000/api/start-shortlist", {
          criteriaId: selectedCriteria,
          locations: selectedLocations,
          name: shortlistName,
          description: shortlistDescription,
          year: currentYear, // Pass the current year
        });
        console.log("Shortlisting started:", response.data);
        setShortlistingResult({ success: response.data.message, shortlistedCount: response.data.shortlistedCount });

        // Optionally refetch counts if needed
        fetchApplicantCounts();

      } catch (error) {
        console.error("Error starting shortlisting:", error);
        if (error.response && error.response.status === 409) {
          // Display the specific error message from the backend
          setShortlistingResult({ error: error.response.data.error });
        } else {
          setShortlistingResult({ error: "Shortlisting failed." });
        }
      }
    } else {
      alert("Please provide all the required information.");
    }
  };

  return (
    <div className="generate-shortlist">
      <h2>Shortlist Process</h2>
      <p>Configure the shortlist by selecting the jurisdiction, criteria, and providing shortlist details.</p>

      <div className="location-selection">
        <h3><MapPin className="inline-block mr-2" />Select Jurisdiction</h3>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="dropdown"
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.juris_code} value={state.juris_name}>
              {state.juris_name}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          disabled={!selectedState}
          className="dropdown"
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.juris_code} value={district.juris_name}>
              {district.juris_name}
            </option>
          ))}
        </select>

        {loadingBlocks ? (
          <p>Loading blocks...</p>
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
                  <label
                    htmlFor={block.juris_name}
                    style={{ color: block.is_frozen_block ? 'red' : 'inherit' }}
                  >
                    {block.juris_name}
                    {block.is_frozen_block && <span style={{ marginLeft: '5px', color: 'red' }}>(Frozen shorlist on this)</span>}
                  </label>
                </div>
              ))}
            </div>
          )
        )}
      </div>

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
            <option key={criteria.criteria_id} value={criteria.criteria_id}>
              {criteria.criteria}
            </option>
          ))}
        </select>
      </div>

      <div className="shortlist-details">
        <label htmlFor="shortlist-name" className="shortlist-label">
          <Edit className="inline-block mr-2" />Shortlist Name:
        </label>
        <input
          type="text"
          id="shortlist-name"
          value={shortlistName}
          onChange={(e) => setShortlistName(e.target.value)}
          className="shortlist-input"
          placeholder="Bailhongal_Kittur_shortlist"
        />

        <label htmlFor="shortlist-description" className="shortlist-label">
          <Edit className="inline-block mr-2"/>Shortlist Description:
        </label>
        <textarea
          id="shortlist-description"
          value={shortlistDescription}
          onChange={(e) => setShortlistDescription(e.target.value)}
          className="shortlist-textarea"
          placeholder="This shortlist includes the Bailhongal and Kittur blocks of Belagavi district."
        />
      </div>

      <button onClick={handleStartShortlisting} className="start-button" disabled={blocks.some(block => block.is_frozen_block && selectedBlocks.includes(block.juris_name))}>
        <Play className="inline-block mr-2" />
        Start Shortlisting Process
      </button>

      {shortlistingResult && shortlistingResult.success && (
        <div className="shortlisting-result success-box">
          <CheckCircle className="inline-block mr-2 text-green-500" />
          <p>{shortlistingResult.success}</p>
          {shortlistingResult.shortlistedCount !== undefined && (
            <p>Total Shortlisted Applicants: {shortlistingResult.shortlistedCount}</p>
          )}
        </div>
      )}
      {shortlistingResult && shortlistingResult.error && (
        <div className="shortlisting-result error-box">
          <AlertTriangle className="inline-block mr-2 text-red-500"/>
          <p>Error: {shortlistingResult.error}</p>
        </div>
      )}

      {loadingCounts && <p>Loading applicant counts...</p>}
      {totalApplicants > 0 && shortlistedStudents >= 0 && (
        <div className="applicant-counts">
           <p><Users className="inline-block mr-2"/>Total Applicants Count ({currentYear}): {totalApplicants} | <UserCheck className="inline-block mr-2"/>Shortlisted Students Count (All Batches): {shortlistedStudents}</p>
        </div>
      )}
    </div>
  );
};

export default GenerateShortlist;