import React, { useState, useEffect } from 'react';
import styles from './EventForm.module.css'; // Using the CSS module

// --- Placeholder Data ---
// This is now passed in as props, but we keep cohort/district logic
const cohorts = ['1', '2', '3', '4', '5'];
const districts = {
  'Belagavi': ['Athani', 'Belagavi', 'Gokak', 'Khanapur', 'Raybag', 'Savadatti'],
  'Dharwad': ['Dharwad', 'Hubballi', 'Kalghatgi', 'Kundgol', 'Navalgund'],
  'Uttara Kannada': ['Ankola', 'Haliyal', 'Karwar', 'Joida', 'Mundgod', 'Sirsi'],
};
// ------------------------

const EventForm = ({ eventTypes, onSave, onCancel, onOpenAddTypeModal }) => {
  const [formData, setFormData] = useState({
    eventType: '',
    startDate: '',
    endDate: '',
    district: '',
    taluka: '',
    location: '',
    cohort: '',
    eventTitle: '',
    boysCount: 0,
    girlsCount: 0,
    parentsCount: 0,
  });

  const [selectedFiles, setSelectedFiles] = useState(null);
  const [talukaOptions, setTalukaOptions] = useState([]);
  const [fileError, setFileError] = useState('');

  // --- Auto-generate Event Title ---
  useEffect(() => {
    // (This logic is identical to your previous version)
    const { eventType, startDate, cohort, taluka } = formData;
    if (!eventType || !startDate || !cohort || !taluka) {
      setFormData(prev => ({ ...prev, eventTitle: '' }));
      return;
    }
    let typeName = 'Event';
    if (eventType.includes('Sammelan')) typeName = 'Sammelan';
    else if (eventType.includes('Ignite')) typeName = 'Ignite';
    else if (eventType.includes('Induction')) typeName = 'Induction';
    let dateStr = '';
    try {
      const date = new Date(startDate);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yy = String(date.getFullYear()).slice(-2);
      dateStr = `${dd}${mm}${yy}`;
    } catch (e) { dateStr = 'XXXXXX'; }
    const cohortStr = `Cohort-${cohort}`;
    const talukaStr = taluka;
    const title = [typeName, dateStr, cohortStr, talukaStr].filter(Boolean).join('-');
    setFormData(prev => ({ ...prev, eventTitle: title }));
  }, [formData.eventType, formData.startDate, formData.cohort, formData.taluka]);

  // --- Handle Dependent Dropdown (Talukas) ---
  useEffect(() => {
    if (formData.district) {
      setTalukaOptions(districts[formData.district] || []);
      setFormData(prev => ({ ...prev, taluka: '' }));
    } else {
      setTalukaOptions([]);
    }
  }, [formData.district]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFileError('');
    if (e.target.files.length > 4) {
      setFileError('You can only upload a maximum of 4 photos.');
      setSelectedFiles(null);
      e.target.value = null;
    } else {
      setSelectedFiles(e.target.files);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Use FormData for file uploads
    const data = new FormData();
    for (const key in formData) {
      data.append(key, formData[key]);
    }
    if (selectedFiles) {
      for (let i = 0; i < selectedFiles.length; i++) {
        data.append('photos', selectedFiles[i]);
      }
    }
    
    // Pass the data up to the parent
    onSave(data);
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>

        {/* --- Event Type --- */}
        <div className={styles.formGroup}>
          <div className={styles.labelWithButton}>
            <label htmlFor="eventType">Event Type</label>
            <button 
              type="button" 
              className={styles.addTypeButton}
              onClick={onOpenAddTypeModal}
            >
              + Add New
            </button>
          </div>
          <select id="eventType" name="eventType" value={formData.eventType} onChange={handleChange} required>
            <option value="">Select Event Type...</option>
            {eventTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        {/* --- Dates --- */}
        <div className={styles.gridTwoCol}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate">Event Start Date</label>
            <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="endDate">Event End Date</label>
            <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required />
          </div>
        </div>

        {/* (Rest of form is identical: Place, Location, Cohort, Title) ... */}

        {/* --- Place --- */}
        <div className={styles.gridTwoCol}>
          <div className={styles.formGroup}>
            <label htmlFor="district">District</label>
            <select id="district" name="district" value={formData.district} onChange={handleChange} required>
              <option value="">Select District...</option>
              {Object.keys(districts).map(dist => <option key={dist} value={dist}>{dist}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="taluka">Taluka</label>
            <select id="taluka" name="taluka" value={formData.taluka} onChange={handleChange} required disabled={!formData.district}>
              <option value="">Select Taluka...</option>
              {talukaOptions.map(taluk => <option key={taluk} value={taluk}>{taluk}</option>)}
            </select>
          </div>
        </div>

        {/* --- Location --- */}
        <div className={styles.formGroup}>
          <label htmlFor="location">Event Location (e.g., Nature Bound Sahyadris, Sunksal)</label>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Specific venue or landmark" />
        </div>

        {/* --- Cohort --- */}
        <div className={styles.formGroup}>
          <label htmlFor="cohort">Cohort</label>
          <select id="cohort" name="cohort" value={formData.cohort} onChange={handleChange} required>
            <option value="">Select Cohort...</option>
            {cohorts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* --- Event Title (Auto-generated) --- */}
        <div className={styles.formGroup}>
          <label htmlFor="eventTitle">Event Title (Auto-Generated)</label>
          <input 
            type="text" 
            id="eventTitle" 
            name="eventTitle" 
            value={formData.eventTitle} 
            readOnly 
            className={styles.readOnlyInput} 
          />
        </div>

        {/* --- Attendance Counts --- */}
        <fieldset className={styles.attendanceFieldset}>
          <legend>Attendance</legend>
          <div className={styles.gridThreeCol}>
            <div className={styles.formGroup}>
              <label htmlFor="boysCount">Number of Boys</label>
              <input type="number" id="boysCount" name="boysCount" value={formData.boysCount} onChange={handleChange} min="0" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="girlsCount">Number of Girls</label>
              <input type="number" id="girlsCount" name="girlsCount" value={formData.girlsCount} onChange={handleChange} min="0" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="parentsCount">Number of Parents</label>
              <input type="number" id="parentsCount" name="parentsCount" value={formData.parentsCount} onChange={handleChange} min="0" />
            </div>
          </div>
        </fieldset>
        
        {/* --- Photo Upload --- */}
        <div className={styles.formGroup}>
          <label htmlFor="photos">Upload Photos (Up to 4)</label>
          <input type="file" id="photos" name="photos" onChange={handleFileChange} multiple accept="image/*" />
          {fileError && <div className={styles.fileError}>{fileError}</div>}
        </div>

        {/* --- Form Actions --- */}
        <div className={styles.buttonContainer}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
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