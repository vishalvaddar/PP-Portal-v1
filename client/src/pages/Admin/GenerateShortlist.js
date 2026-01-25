import React, { useState, useEffect, useMemo } from "react";
import axios from "axios"; 
import {
    MapPin, Building2, ListChecks, Edit, Play, AlertTriangle, CheckCircle, Loader, FileText
} from 'lucide-react';
import styles from "./GenerateShortlist.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

import { useSystemConfig } from "../../contexts/SystemConfigContext";

const GenerateShortlist = () => {
    const { appliedConfig } = useSystemConfig();
    
    const currentPath = ['Admin', 'Admissions', 'Shortlisting', 'Generate-Shortlist'];
    
    // State definitions
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]); 
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [selectedState, setSelectedState] = useState("");
    const [selectedDivision, setSelectedDivision] = useState(""); 
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedBlocks, setSelectedBlocks] = useState([]);
    const [selectionCriteria, setSelectionCriteria] = useState([]);
    const [selectedCriteria, setSelectedCriteria] = useState("");
    const [shortlistName, setShortlistName] = useState("");
    const [shortlistDescription, setShortlistDescription] = useState("");
    const [shortlistingResult, setShortlistingResult] = useState(null);

    const [loading, setLoading] = useState({
        initial: true,
        divisions: false,
        districts: false,
        blocks: false,
        submit: false,
    });

    const [error, setError] = useState({
        states: null,
        criteria: null,
        divisions: null,
        districts: null,
        blocks: null,
    });

    // 👈 3. Logic to take 2025 from "2025-26"
    const displayYear = useMemo(() => {
        if (appliedConfig && appliedConfig.academic_year) {
            // Split "2025-26" and take the first part "2025"
            return appliedConfig.academic_year.split('-')[0];
        }
        return new Date().getFullYear(); // Fallback
    }, [appliedConfig]);

    // 🚀 Logic to generate Shortlist Name automatically
    useEffect(() => {
        if (selectedDistrict && selectedBlocks.length > 0) {
            // Helper function to handle multi-word 3-letter logic
            const formatToThreeLetters = (name) => {
                return name
                    .split(" ")
                    .filter(word => word.trim().length > 0)
                    .map(word => word.substring(0, 3).toUpperCase())
                    .join("-");
            };

            const districtPart = formatToThreeLetters(selectedDistrict);
            
            // Join all selected blocks. If multiple blocks, separate by underscore (_)
            const blocksPart = selectedBlocks
                .map(block => formatToThreeLetters(block))
                .join("_");

            const finalName = `${districtPart}-${blocksPart}-${displayYear}`;
            setShortlistName(finalName);
        } else {
            setShortlistName("");
        }
    }, [selectedDistrict, selectedBlocks, displayYear]);

    // 1. Fetch initial states and criteria
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(prev => ({ ...prev, initial: true }));
            try {
                const [statesRes, criteriaRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/generate/allstates`),
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/generate/criteria`)
                ]);
                setStates(statesRes.data);
                setSelectionCriteria(criteriaRes.data);
            } catch (err) {
                console.error("Initial fetch error:", err);
                setError(prev => ({
                    ...prev,
                    states: "Failed to load states.",
                    criteria: "Failed to load selection criteria."
                }));
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };
        fetchInitialData();
    }, []);

    // 2. Fetch Divisions when State changes
    useEffect(() => {
        if (!selectedState) {
            setDivisions([]);
            setDistricts([]);
            setBlocks([]);
            setSelectedDivision("");
            setSelectedDistrict("");
            setSelectedBlocks([]);
            return;
        }

        const fetchDivisions = async () => {
            setLoading(prev => ({ ...prev, divisions: true }));
            setError(prev => ({ ...prev, divisions: null }));
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/generate/divisions/${selectedState}`);
                setDivisions(res.data);
            } catch (err) {
                console.error("Error fetching divisions:", err);
                setError(prev => ({ ...prev, divisions: "Failed to load divisions." }));
            } finally {
                setLoading(prev => ({ ...prev, divisions: false }));
                setSelectedDivision("");
                setDistricts([]);
                setSelectedDistrict("");
                setBlocks([]);
                setSelectedBlocks([]);
            }
        };
        fetchDivisions();
    }, [selectedState]);

    // 3. Fetch Districts when Division changes
    useEffect(() => {
        if (!selectedDivision) {
            setDistricts([]);
            setBlocks([]);
            setSelectedDistrict("");
            setSelectedBlocks([]);
            return;
        }

        const fetchDistricts = async () => {
            setLoading(prev => ({ ...prev, districts: true }));
            setError(prev => ({ ...prev, districts: null }));
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/generate/districts/${selectedDivision}`);
                setDistricts(res.data);
            } catch (err) {
                console.error("Error fetching districts:", err);
                setError(prev => ({ ...prev, districts: "Failed to load districts." }));
            } finally {
                setLoading(prev => ({ ...prev, districts: false }));
                setSelectedDistrict("");
                setBlocks([]);
                setSelectedBlocks([]);
            }
        };
        fetchDistricts();
    }, [selectedDivision]);

    // 4. Fetch blocks when District changes
    useEffect(() => {
        if (!selectedState || !selectedDivision || !selectedDistrict) {
            setBlocks([]);
            setSelectedBlocks([]);
            return;
        }

        const fetchBlocks = async () => {
            setLoading(prev => ({ ...prev, blocks: true }));
            setError(prev => ({ ...prev, blocks: null }));
            try {
                const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/generate/blocks/${selectedState}/${selectedDivision}/${selectedDistrict}`);
                setBlocks(res.data);
            } catch (err) {
                console.error("Error fetching blocks:", err);
                setError(prev => ({ ...prev, blocks: "Failed to load blocks." }));
            } finally {
                setLoading(prev => ({ ...prev, blocks: false }));
                setSelectedBlocks([]);
            }
        };
        fetchBlocks();
    }, [selectedDistrict, selectedDivision, selectedState]);

    const handleBlockChange = (blockName, isFrozen) => {
        if (isFrozen) return;
        setSelectedBlocks((prev) =>
            prev.includes(blockName)
                ? prev.filter((b) => b !== blockName)
                : [...prev, blockName]
        );
    };

    const handleStartShortlisting = async () => {
        if (!isFormValid) {
            alert("Please fill all required fields and select at least one unfrozen block.");
            return;
        }

        setLoading(prev => ({ ...prev, submit: true }));
        setShortlistingResult(null);

        const payload = {
            criteriaId: selectedCriteria,
            locations: {
                state: selectedState,
                division: selectedDivision,
                district: selectedDistrict,
                blocks: selectedBlocks,
            },
            name: shortlistName,
            description: shortlistDescription,
            year: displayYear, // 👈 4. Using the Config Year here
        };

        try {
            const res = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/shortlist/generate/start-shortlist`, payload);
            setShortlistingResult({ success: true, message: res.data.message, count: res.data.shortlistedCount });

            // Reset form
            setSelectedState("");
            setSelectedDivision("");
            setSelectedDistrict("");
            setSelectedBlocks([]);
            setSelectedCriteria("");
            setShortlistName("");
            setShortlistDescription("");
        } catch (err) {
            console.error("Error during shortlisting:", err);
            setShortlistingResult({ success: false, message: err.response?.data?.error || "An unexpected error occurred." });
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const isFormValid = selectedCriteria && selectedState && selectedDivision && selectedDistrict && shortlistName && shortlistDescription && selectedBlocks.length > 0;

    return (
        <div className={styles.page}>
            <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
            
            <div className={styles.header}>
                {/* 👈 5. Showing the Year in the UI Title */}
                <h1>Generate New Shortlist for {displayYear}</h1>
            </div>

            <div className={styles.container}>
                <div className={styles.formGrid}>
                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}>
                            <MapPin size={20} />
                            <h3>Select Jurisdiction</h3>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label>State</label>
                            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} disabled={loading.initial}>
                                <option value="">{loading.initial ? 'Loading...' : 'Select a State'}</option>
                                {states.map((s) => (
                                    <option key={s.juris_code} value={s.juris_name}>{s.juris_name}</option>
                                ))}
                            </select>
                            {error.states && <p className={styles.errorMessage}>{error.states}</p>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Division</label>
                            <select 
                                value={selectedDivision} 
                                onChange={(e) => setSelectedDivision(e.target.value)} 
                                disabled={!selectedState || loading.divisions}
                            >
                                <option value="">
                                    {loading.divisions ? 'Loading...' : (selectedState ? 'Select a Division' : 'Select State First')}
                                </option>
                                {divisions.map((d) => (
                                    <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>
                                ))}
                            </select>
                            {error.divisions && <p className={styles.errorMessage}>{error.divisions}</p>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>District</label>
                            <select 
                                value={selectedDistrict} 
                                onChange={(e) => setSelectedDistrict(e.target.value)} 
                                disabled={!selectedDivision || loading.districts}
                            >
                                <option value="">
                                    {loading.districts ? 'Loading...' : (selectedDivision ? 'Select a District' : 'Select Division First')}
                                </option>
                                {districts.map((d) => (
                                    <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>
                                ))}
                            </select>
                            {error.districts && <p className={styles.errorMessage}>{error.districts}</p>}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Blocks</label>
                            <div className={styles.blocksContainer}>
                                {loading.blocks && <div className={styles.loaderSmall}><Loader size={18}/> Loading Blocks...</div>}
                                {error.blocks && <p className={styles.errorMessage}>{error.blocks}</p>}
                                {!loading.blocks && blocks.length === 0 && selectedDistrict && <p className={styles.emptyMessage}>No blocks found for this district.</p>}
                                {blocks.map((block) => (
                                    <div key={block.juris_code} className={`${styles.checkboxWrapper} ${block.is_frozen_block ? styles.disabled : ''}`}>
                                        <input
                                            type="checkbox"
                                            id={`block-${block.juris_code}`}
                                            checked={selectedBlocks.includes(block.juris_name)}
                                            onChange={() => handleBlockChange(block.juris_name, block.is_frozen_block)}
                                            disabled={block.is_frozen_block}
                                        />
                                        <label htmlFor={`block-${block.juris_code}`}>
                                            {block.juris_name} {block.is_frozen_block && "(Frozen)"}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formSection}>
                        <div className={styles.sectionHeader}>
                            <ListChecks size={20} />
                            <h3>Define Criteria & Details</h3>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Selection Criteria</label>
                            <select value={selectedCriteria} onChange={(e) => setSelectedCriteria(e.target.value)} disabled={loading.initial || selectionCriteria.length === 0}>
                                <option value="">{loading.initial ? 'Loading...' : 'Select Criteria'}</option>
                                {selectionCriteria.map((c) => (
                                    <option key={c.criteria_id} value={c.criteria_id}>{c.criteria}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Shortlist Name (Auto-Generated)</label>
                            <div className={styles.inputWrapper}>
                                <FileText size={16} className={styles.inputIcon} />
                                <input 
                                    type="text" 
                                    placeholder="Format: DIST-BLOCK-YEAR" 
                                    value={shortlistName} 
                                    readOnly 
                                    style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Shortlist Description</label>
                            <div className={styles.inputWrapper}>
                                <Edit size={16} className={styles.inputIcon} />
                                <textarea placeholder="Describe this shortlist..." value={shortlistDescription} onChange={(e) => setShortlistDescription(e.target.value)} rows="4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.actionBar}>
                    <div className={styles.result}>
                        {shortlistingResult && (
                            <div className={shortlistingResult.success ? styles.successBox : styles.errorBox}>
                                {shortlistingResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <p>{shortlistingResult.message}</p>
                            </div>
                        )}
                    </div>
                    <button onClick={handleStartShortlisting} disabled={!isFormValid || loading.submit} className={styles.submitButton}>
                        {loading.submit ? (
                            <><Loader className={styles.spinner} size={18} />Processing...</>
                        ) : (
                            <><Play size={18} />Start Shortlisting</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateShortlist;