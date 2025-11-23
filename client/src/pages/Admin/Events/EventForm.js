import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./EventForm.module.css";

import {
    useFetchStates,
    useFetchEducationDistricts,
    useFetchBlocks
} from "../../../hooks/useJurisData";

const EventForm = ({ onSave, onCancel, onOpenAddTypeModal }) => {
    const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

    const [eventTypes, setEventTypes] = useState([]);

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
    });

    const [selectedFiles, setSelectedFiles] = useState(null);
    const [fileError, setFileError] = useState("");

    const [statesList, setStatesList] = useState([]);
    const [districtsList, setDistrictsList] = useState([]);
    const [talukaOptions, setTalukaOptions] = useState([]);
    const [cohortsList, setCohortsList] = useState([]);

    /* ------------------------ FETCH EVENT TYPES ------------------------ */
    useEffect(() => {
        const fetchEventTypes = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/event-types`);
                let list = [];

                if (Array.isArray(res.data)) list = res.data;
                else if (Array.isArray(res.data.data)) list = res.data.data;

                setEventTypes(list);
            } catch (err) {
                console.error("Error fetching event types:", err);
                setEventTypes([]);
            }
        };

        fetchEventTypes();
    }, [API_BASE_URL]);

    /* ------------------------ FETCH STATE / DISTRICT / BLOCK ------------------------ */
    useFetchStates(setStatesList);

    useFetchEducationDistricts(formData.state, setDistrictsList);

    useFetchBlocks(formData.district, setTalukaOptions);

    /* ------------------------ FETCH COHORTS ------------------------ */
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

    /* ------------------------ AUTO GENERATE EVENT TITLE ------------------------ */useEffect(() => {
    const { eventType, startDate, cohort, taluka } = formData;

    if (!eventType || !startDate || !cohort || !taluka) {
        setFormData(prev => ({ ...prev, eventTitle: "" }));
        return;
    }

    // ---- Fetch event type name (because eventType is ID) ----
    const fetchTypeName = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/event-types`);
            const allTypes = res.data;

            const selectedType = allTypes.find(t => t.event_type_id === Number(eventType));

            if (!selectedType) return;

            const typeName = selectedType.event_type_name; // <-- Name

            // ---- Format date ----
            const dateObj = new Date(startDate);
            const dd = String(dateObj.getDate()).padStart(2, "0");
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            const yy = String(dateObj.getFullYear()).slice(-2);

            // ---- Generate title ----
            const title = `${typeName}-${dd}${mm}${yy}-Cohort-${cohort}-${taluka}`
                .replace(/\s+/g, "_"); // replace spaces with underscores

            setFormData(prev => ({ ...prev, eventTitle: title }));
        } catch (err) {
            console.error("Error fetching event types:", err);
        }
    };

    fetchTypeName();

}, [formData.eventType, formData.startDate, formData.cohort, formData.taluka]);


    /* ------------------------ FORM FIELD CHANGE ------------------------ */
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "state") {
            setFormData(prev => ({
                ...prev,
                state: value,
                district: "",
                taluka: ""
            }));
            return;
        }

        if (name === "district") {
            setFormData(prev => ({
                ...prev,
                district: value,
                taluka: ""
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /* ------------------------ PHOTO UPLOAD ------------------------ */
    const handleFileChange = (e) => {
        if (e.target.files.length > 4) {
            setFileError("You can upload max 4 photos.");
            setSelectedFiles(null);
            return;
        }
        setSelectedFiles(e.target.files);
        setFileError("");
    };

    /* ------------------------ SUBMIT ------------------------ */
    const handleSubmit = (e) => {
        e.preventDefault();

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));

        if (selectedFiles) {
            for (let i = 0; i < selectedFiles.length; i++) {
                data.append("photos", selectedFiles[i]);
            }
        }

        onSave(data);
    };

    /* ------------------------ UI ------------------------ */
    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>

                {/* EVENT TYPE */}
                <div className={styles.formGroup}>
                    <div className={styles.labelWithButton}>
                        <label>Event Type</label>
                        <button type="button" onClick={onOpenAddTypeModal} className={styles.addTypeButton}>
                            + Add New
                        </button>
                    </div>

                    <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Event Type...</option>

                        {eventTypes?.map((t) => (
                            <option key={t.event_type_id} value={t.event_type_id}>
                                {t.event_type_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* DATE ROW */}
                <div className={styles.gridTwoCol}>
                    <div className={styles.formGroup}>
                        <label>Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* STATE → DISTRICT → TALUKA */}
                <div className={styles.gridThreeCol}>
                    {/* STATE */}
                    <div className={styles.formGroup}>
                        <label>State</label>
                        <select
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select State…</option>
                            {statesList?.map((s) => (
                                <option key={s.state_id || s.id} value={s.state_id || s.id}>
                                    {s.state_name || s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DISTRICT */}
                    <div className={styles.formGroup}>
                        <label>District</label>
                        <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            disabled={!formData.state}
                            required
                        >
                            <option value="">Select District…</option>
                            {districtsList?.map((d) => (
                                <option key={d.district_id || d.id} value={d.district_id || d.id}>
                                    {d.district_name || d.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* TALUKA */}
                    <div className={styles.formGroup}>
                        <label>Taluka</label>
                        <select
                            name="taluka"
                            value={formData.taluka}
                            onChange={handleChange}
                            disabled={!formData.district}
                            required
                        >
                            <option value="">Select Taluka…</option>
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
                    <label>Event Location</label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Venue / Landmark"
                    />
                </div>

                {/* COHORT */}
                <div className={styles.formGroup}>
                    <label>Cohort</label>
                    <select
                        name="cohort"
                        value={formData.cohort}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Cohort…</option>
                        {cohortsList.map((c) => (
                            <option key={c.cohort_number} value={c.cohort_number}>
                                {c.cohort_name || `Cohort ${c.cohort_number}`}
                            </option>
                        ))}
                    </select>
                </div>

                {/* AUTO TITLE */}
                <div className={styles.formGroup}>
                    <label>Event Title (Auto Generated)</label>
                    <input
                        type="text"
                        name="eventTitle"
                        value={formData.eventTitle}
                        readOnly
                        className={styles.readOnlyInput}
                    />
                </div>

                {/* ATTENDANCE */}
                <fieldset className={styles.attendanceFieldset}>
                    <legend>Attendance</legend>

                    <div className={styles.gridThreeCol}>
                        <div className={styles.formGroup}>
                            <label>Boys</label>
                            <input
                                type="number"
                                name="boysCount"
                                min="0"
                                value={formData.boysCount}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Girls</label>
                            <input
                                type="number"
                                name="girlsCount"
                                min="0"
                                value={formData.girlsCount}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Parents</label>
                            <input
                                type="number"
                                name="parentsCount"
                                min="0"
                                value={formData.parentsCount}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </fieldset>

                {/* PHOTOS */}
                <div className={styles.formGroup}>
                    <label>Upload Photos (max 4)</label>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} />
                    {fileError && <div className={styles.fileError}>{fileError}</div>}
                </div>

                {/* BUTTONS */}
                <div className={styles.buttonContainer}>
                    <button type="button" onClick={onCancel} className={styles.secondaryButton}>
                        Cancel
                    </button>

                    <button type="submit" className={styles.submitButton}>
                        Save Event
                    </button>
                </div>

            </form>
        </div>
    );
};

export default EventForm;
