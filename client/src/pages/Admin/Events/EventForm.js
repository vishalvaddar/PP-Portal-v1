import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./EventForm.module.css";

import {
    useFetchStates,
    useFetchEducationDistricts,
    useFetchBlocks
} from "../../../hooks/useJurisData";

// 1. Custom Hook for Event Types
const useFetchEventTypes = (API_BASE_URL) => {
    const [eventTypes, setEventTypes] = useState([]);

    useEffect(() => {
        const fetchEventTypes = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/event-types`);
                let list = [];

                // Standardizing response data access
                if (Array.isArray(res.data)) list = res.data;
                else if (Array.isArray(res.data.data)) list = res.data.data;

                setEventTypes(list);
            } catch (err) {
                console.error("Error fetching event types:", err);
                // Informative error to show to user if possible
                setEventTypes([]);
            }
        };

        fetchEventTypes();
    }, [API_BASE_URL]);

    return eventTypes;
};


const EventForm = ({ onSave, onCancel, onOpenAddTypeModal }) => {
    const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

    // Use custom hook for event types
    const eventTypes = useFetchEventTypes(API_BASE_URL);

    // Initial form state now includes 'description' for consistency
    const [formData, setFormData] = useState({
        eventType: "",
        startDate: "",
        endDate: "",
        state: "",
        district: "",
        taluka: "",
        location: "",
        cohort: "",
        eventTitle: "",
        boysCount: 0,
        girlsCount: 0,
        parentsCount: 0,
        description: "",
    });

    const [selectedFiles, setSelectedFiles] = useState(null);
    const [fileError, setFileError] = useState("");

    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [talukaOptions, setTalukaOptions] = useState([]);
    const [cohortsList, setCohortsList] = useState([]);
    
    useFetchStates(setStatesList);
    useFetchEducationDistricts(formData.state, setDistrictsList);
    useFetchBlocks(formData.district, setTalukaOptions);


    // --- FETCH COHORTS ---
    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/batches/cohorts`);
                setCohortsList(res.data || []);
            } catch (err) {
                console.error("Error fetching cohorts:", err);
            }
        };
        fetchCohorts();
    }, [API_BASE_URL]);


    // --- AUTO GENERATE EVENT TITLE ---
    useEffect(() => {
        const { eventType, startDate, cohort, taluka } = formData;

        if (!eventType || !startDate || !cohort || !taluka || eventTypes.length === 0) {
            setFormData(prev => ({ ...prev, eventTitle: "" }));
            return;
        }

        // Find selected event type name from the already fetched list
        const selectedType = eventTypes.find(t => t.event_type_id === Number(eventType));

        if (!selectedType) {
            setFormData(prev => ({ ...prev, eventTitle: "Error-EventType-NotFound" }));
            return;
        }

        const typeName = selectedType.event_type_name;

        // ---- Format date (YYYY-MM-DD to DDMMYY) ----
        const dateObj = new Date(startDate);
        const dd = String(dateObj.getDate()).padStart(2, "0");
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const yy = String(dateObj.getFullYear()).slice(-2);

        // ---- Generate title ----
        const title = `${typeName}-${dd}${mm}${yy}-Cohort-${cohort}-${taluka}`
            .replace(/\s+/g, "_") // replace spaces with underscores
            .toUpperCase();

        setFormData(prev => ({ ...prev, eventTitle: title }));

    }, [formData.eventType, formData.startDate, formData.cohort, formData.taluka, eventTypes]); 


    // --- FORM FIELD CHANGE HANDLER ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            let newState = { ...prev, [name]: value };

            // Conditional resetting of dependent fields
            if (name === "state") {
                newState.district = "";
                newState.taluka = "";
            } else if (name === "district") {
                newState.taluka = "";
            } else if (name === "boysCount" || name === "girlsCount" || name === "parentsCount") {
                 // Ensure number fields are stored as numbers if possible, defaulting to 0
                 newState[name] = Math.max(0, Number(value));
            }

            return newState;
        });
    }, []);

    // --- PHOTO UPLOAD HANDLER ---
    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files.length > 4) {
            setFileError("You can upload a maximum of 4 photos.");
            setSelectedFiles(null);
            e.target.value = null; // Clear the file input
            return;
        }
        setSelectedFiles(files);
        setFileError("");
    };

    // --- SUBMIT HANDLER ---
    const handleSubmit = (e) => {
        e.preventDefault();

        // Simple validation check for number fields
        if (formData.boysCount < 0 || formData.girlsCount < 0 || formData.parentsCount < 0) {
            alert("Attendance counts cannot be negative.");
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));

        if (selectedFiles) {
            for (let i = 0; i < selectedFiles.length; i++) {
                data.append("photos", selectedFiles[i]);
            }
        }

        onSave(data);
    };

    // --- UI ---
    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>

                {/* EVENT TYPE */}
                <div className={styles.formGroup}>
                    <div className={styles.labelWithButton}>
                        <label htmlFor="eventTypeSelect">Event Type</label>
                        <button type="button" onClick={onOpenAddTypeModal} className={styles.addTypeButton}>
                            + Add New Type
                        </button>
                    </div>

                    <select
                        id="eventTypeSelect"
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        required
                        disabled={eventTypes.length === 0}
                    >
                        <option value="">{eventTypes.length === 0 ? "Loading Event Types..." : "Select Event Type..."}</option>
                        {eventTypes.map((t) => (
                            <option key={t.event_type_id} value={t.event_type_id}>
                                {t.event_type_name}
                            </option>
                        ))}
                    </select>
                </div>

                                {/* COHORT */}
                <div className={styles.formGroup}>
                    <label htmlFor="cohortSelect">For Cohort</label>
                    <select
                        id="cohortSelect"
                        name="cohort"
                        value={formData.cohort}
                        onChange={handleChange}
                        required
                        disabled={cohortsList.length === 0}
                    >
                        <option value="">{cohortsList.length === 0 ? "Loading Cohorts..." : "Select Cohort…"}</option>
                        {cohortsList.map((c) => (
                            <option key={c.cohort_number} value={c.cohort_number}>
                                {c.cohort_name || `Cohort ${c.cohort_number}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* DATE ROW */}
                <div className={styles.gridTwoCol}>
                    <div className={styles.formGroup}>
                        <label htmlFor="startDateInput">Start Date</label>
                        <input
                            id="startDateInput"
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="endDateInput">End Date</label>
                        <input
                            id="endDateInput"
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <fieldset className={styles.attendanceFieldset}>
                    <legend>Event Location</legend>
                    <div className={styles.gridThreeCol}>
                    {/* STATE */}
                    <div className={styles.formGroup}>
                        <label htmlFor="stateSelect">State</label>
                        <select
                            id="stateSelect"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            required
                            disabled={statesList.length === 0}
                        >
                            <option value="">{statesList.length === 0 ? "Loading States..." : "Select State…"}</option>
                            {statesList?.map((s) => (
                                <option key={s.state_id || s.id} value={s.state_id || s.id}>
                                    {s.state_name || s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DISTRICT */}
                    <div className={styles.formGroup}>
                        <label htmlFor="districtSelect">District</label>
                        <select
                            id="districtSelect"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            disabled={!formData.state || districtsList.length === 0}
                            required
                        >
                            <option value="">{districtsList.length === 0 ? "Loading Districts..." : "Select District…"}</option>
                            {districtsList?.map((d) => (
                                <option key={d.district_id || d.id} value={d.district_id || d.id}>
                                    {d.district_name || d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* TALUKA */}
                    <div className={styles.formGroup}>
                        <label htmlFor="talukaSelect">Taluka</label>
                        <select
                            id="talukaSelect"
                            name="taluka"
                            value={formData.taluka}
                            onChange={handleChange}
                            disabled={!formData.district || talukaOptions.length === 0}
                            required
                        >
                            <option value="">{talukaOptions.length === 0 ? "Loading Talukas..." : "Select Taluka…"}</option>
                            {talukaOptions?.map((blk) => (
                                <option key={blk.block_id || blk.id} value={blk.block_id || blk.id}>
                                    {blk.block_name || blk.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* LOCATION */}
                <div className={styles.formGroup}>
                    <label htmlFor="locationInput">Venue</label>
                    <input
                        id="locationInput"
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Venue / Landmark"
                        required
                    />
                </div>


                </fieldset>

                
                {/* AUTO TITLE */}
                <div className={styles.formGroup}>
                    <label htmlFor="eventTitleInput">Event Title</label>
                    <input
                        id="eventTitleInput"
                        type="text"
                        name="eventTitle"
                        value={formData.eventTitle}
                        readOnly
                        className={styles.readOnlyInput}
                        placeholder="Title auto-generates when required fields are selected..."
                    />
                </div>

                {/* ATTENDANCE */}
                <fieldset className={styles.attendanceFieldset}>
                    <legend>Attendance Count</legend>

                    <div className={styles.gridThreeCol}>
                        <div className={styles.formGroup}>
                            <label htmlFor="boysCountInput">Boys</label>
                            <input
                                id="boysCountInput"
                                type="number"
                                name="boysCount"
                                min="0"
                                value={formData.boysCount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="girlsCountInput">Girls</label>
                            <input
                                id="girlsCountInput"
                                type="number"
                                name="girlsCount"
                                min="0"
                                value={formData.girlsCount}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="parentsCountInput">Parents / Guardians</label>
                            <input
                                id="parentsCountInput"
                                type="number"
                                name="parentsCount"
                                min="0"
                                value={formData.parentsCount}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </fieldset>

                {/* DESCRIPTION */}
                <div className={styles.formGroup}>
                    <label htmlFor="descriptionTextarea">Event Description / Notes (Optional)</label>
                    <textarea
                        id="descriptionTextarea"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3" // Added a row attribute for better visual cue
                    />
                </div>

                {/* PHOTOS */}
                <div className={styles.formGroup}>
                    <label htmlFor="photosInput">Upload Photos (max 4)</label>
                    <input id="photosInput" type="file" multiple accept="image/*" onChange={handleFileChange} />
                    {fileError && <div className={styles.fileError}>{fileError}</div>}
                    <p className={styles.fileHint}>Selected: {selectedFiles ? selectedFiles.length : 0} file(s)</p>
                </div>

                {/* BUTTONS */}
                <div className={styles.buttonContainer}>
                    <button type="button" onClick={onCancel} className={`${styles.button} ${styles.secondaryButton}`}>
                        Cancel
                    </button>

                    <button type="submit" className={`${styles.button} ${styles.submitButton}`}>
                        Save Event
                    </button>
                </div>

            </form>
        </div>
    );
};

export default EventForm;