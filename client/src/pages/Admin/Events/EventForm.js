import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./EventForm.module.css";

import {
  useFetchStates,
  useFetchEducationDistricts,
  useFetchBlocks
} from "../../../hooks/useJurisData";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const useFetchEventTypes = () => {
  const [eventTypes, setEventTypes] = useState([]);

  useEffect(() => {
    let mounted = true;

    const fetchEventTypes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/event-types`);
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        if (mounted) setEventTypes(list);
      } catch (err) {
        console.error("Error fetching event types:", err);
        if (mounted) setEventTypes([]);
      }
    };

    fetchEventTypes();
    return () => (mounted = false);
  }, []);

  return eventTypes;
};

const EventForm = ({ onSave, onCancel, onOpenAddTypeModal }) => {
  const eventTypes = useFetchEventTypes();

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
    description: ""
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
  }, []);

  useEffect(() => {
    const { eventType, startDate, cohort, taluka } = formData;

    const selectedType = eventTypes.find(
      (t) => t.event_type_id === Number(eventType)
    );

    const selectedBlock = talukaOptions.find(
      (b) => String(b.block_id || b.id) === String(taluka)
    );
    const currentTalukaName = selectedBlock ? (selectedBlock.block_name || selectedBlock.name) : "";

    if (!selectedType || !startDate || !cohort || !currentTalukaName) {
      setFormData((p) => ({ ...p, eventTitle: "" }));
      return;
    }

    const d = new Date(startDate);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);

    const title = `${selectedType.event_type_name}-${dd}${mm}${yy}-COHORT-${cohort}-${currentTalukaName}`
      .replace(/\s+/g, "_")
      .toUpperCase();

    setFormData((p) => ({ ...p, eventTitle: title }));

  }, [formData.eventType, formData.startDate, formData.cohort, formData.taluka, eventTypes, talukaOptions]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "state") {
        next.district = "";
        next.taluka = "";
      }
      if (name === "district") {
        next.taluka = "";
      }
      if (["boysCount", "girlsCount", "parentsCount"].includes(name)) {
        next[name] = Math.max(0, Number(value));
      }

      return next;
    });
  }, []);

  const handleFileChange = (e) => {
    const files = e.target.files;

    if (files.length > 4) {
      setFileError("You can upload a maximum of 4 photos.");
      e.target.value = null;
      setSelectedFiles(null);
      return;
    }

    setFileError("");
    setSelectedFiles(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries({
      event_type_id: formData.eventType,
      event_title: formData.eventTitle,
      event_description: formData.description || "",
      event_start_date: formData.startDate,
      event_end_date: formData.endDate,
      event_district: formData.district,
      event_block: formData.taluka,
      event_location: formData.location,
      cohort_number: formData.cohort,
      boys_attended: formData.boysCount,
      girls_attended: formData.girlsCount,
      parents_attended: formData.parentsCount
    }).forEach(([k, v]) => data.append(k, v));

    selectedFiles &&
      [...selectedFiles].forEach((file) => data.append("photos", file));

    onSave(data);
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>

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

            <div className={styles.formGroup}>
              <label htmlFor="talukaSelect">Taluka/Block</label>
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

        <div className={styles.formGroup}>
          <label htmlFor="eventTitleInput">Event Title</label>
          <input
            id="eventTitleInput"
            type="text"
            name="eventTitle"
            value={formData.eventTitle}
            readOnly
            className={styles.readOnlyInput}
            placeholder="auto generated title(event_type-date-cohort-taluka_name)"
          />
        </div>

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

        <div className={styles.formGroup}>
          <label htmlFor="descriptionTextarea">Event Description / Notes (Optional)</label>
          <textarea
            id="descriptionTextarea"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="photosInput">Upload Photos (max 4)</label>
          <input id="photosInput" type="file" multiple accept="image/*" onChange={handleFileChange} />
          {fileError && <div className={styles.fileError}>{fileError}</div>}
          <p className={styles.fileHint}>Selected: {selectedFiles ? selectedFiles.length : 0} file(s)</p>
        </div>

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