import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./EventEditPage.module.css";

// Import your hooks
import { 
  useFetchStates,
  useFetchEducationDistricts, 
  useFetchBlocks 
} from "../../../hooks/useJurisData";

const EventEditPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Dropdown Data
    const [eventTypes, setEventTypes] = useState([]);
    
    // Jurisdiction States
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        event_type_id: "",
        event_title: "",
        event_description: "",
        event_start_date: "",
        event_end_date: "",
        event_location: "",
        event_state: "",
        event_district: "",
        event_block: "",
        cohort_number: "",
        boys_attended: 0,
        girls_attended: 0,
        parents_attended: 0,
    });

    // File States
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [newPhotos, setNewPhotos] = useState([]);
    const [newReports, setNewReports] = useState([]);

    // --- Hooks ---
    useFetchStates(setStates);
    useFetchEducationDistricts(formData.event_state, setDistricts);
    useFetchBlocks(formData.event_district, setBlocks);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Types
                const typesRes = await axios.get(`${API_BASE_URL}/api/event-types`);
                setEventTypes(typesRes.data.data || typesRes.data || []);

                // 2. Fetch Event
                const eventRes = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
                const data = eventRes.data;

                // 3. Format Dates
                const startDate = data.event_start_date ? new Date(data.event_start_date).toISOString().split('T')[0] : "";
                const endDate = data.event_end_date ? new Date(data.event_end_date).toISOString().split('T')[0] : "";

                setFormData({
                    event_type_id: data.event_type_id || "",
                    event_title: data.event_title || "",
                    event_description: data.event_description || "",
                    event_start_date: startDate,
                    event_end_date: endDate,
                    event_location: data.event_location || "",
                    event_state: data.event_state || "",
                    event_district: data.event_district || "",
                    event_block: data.event_block || "",
                    cohort_number: data.cohort_number || "",
                    boys_attended: data.boys_attended || 0,
                    girls_attended: data.girls_attended || 0,
                    parents_attended: data.parents_attended || 0,
                });

                if (data.photos && Array.isArray(data.photos)) {
                    setExistingPhotos(data.photos);
                }

            } catch (err) {
                console.error("Error loading data:", err);
                setError("Failed to load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId, API_BASE_URL]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'event_state') {
            setFormData(prev => ({ ...prev, event_district: "", event_block: "" }));
        }
        if (name === 'event_district') {
            setFormData(prev => ({ ...prev, event_block: "" }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (e.target.name === 'photos') {
            setNewPhotos(files);
        } else if (e.target.name === 'reports') {
            setNewReports(files);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            newPhotos.forEach(file => data.append("photos", file));
            newReports.forEach(file => data.append("reports", file));

            const res = await axios.put(`${API_BASE_URL}/api/events/${eventId}`, data);

            if (res.data.success) {
                setSuccess("Event updated successfully!");
                setTimeout(() => {
                    navigate(`/admin/academics/events/view/${eventId}`);
                }, 1500);
            }

        } catch (err) {
            console.error("Error updating event:", err);
            setError(err.response?.data?.message || "Failed to update event.");
            window.scrollTo(0,0);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.loadingScreen}><div className={styles.spinner}></div><p>Loading Event...</p></div>;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>Edit Event</h1>
                    </div>
                    <button type="button" onClick={() => navigate(-1)} className={styles.backButton}>
                        &larr; Cancel & Go Back
                    </button>
                </header>

                {error && <div className={styles.alertError}>{error}</div>}
                {success && <div className={styles.alertSuccess}>{success}</div>}

                <form onSubmit={handleSubmit} className={styles.formContent}>
                    
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Basic Information</h2>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Event Type <span className={styles.req}>*</span></label>
                                    <select 
                                        name="event_type_id" 
                                        value={formData.event_type_id} 
                                        onChange={handleChange}
                                        className={styles.input}
                                        required
                                    >
                                        <option value="">-- Select Type --</option>
                                        {eventTypes.map(type => (
                                            <option key={type.event_type_id} value={type.event_type_id}>
                                                {type.event_type_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                                    <label className={styles.label}>Event Title <span className={styles.req}>*</span></label>
                                    <input 
                                        type="text" 
                                        name="event_title" 
                                        value={formData.event_title} 
                                        onChange={handleChange} 
                                        className={styles.input}
                                        placeholder="Enter event title"
                                        required 
                                    />
                                </div>
                            </div>

                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Start Date <span className={styles.req}>*</span></label>
                                    <input 
                                        type="date" 
                                        name="event_start_date" 
                                        value={formData.event_start_date} 
                                        onChange={handleChange} 
                                        className={styles.input}
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>End Date <span className={styles.req}>*</span></label>
                                    <input 
                                        type="date" 
                                        name="event_end_date" 
                                        value={formData.event_end_date} 
                                        onChange={handleChange} 
                                        className={styles.input}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea 
                                    name="event_description" 
                                    rows="4"
                                    value={formData.event_description} 
                                    onChange={handleChange} 
                                    className={styles.textarea}
                                    placeholder="Briefly describe the event highlights..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECTION: LOCATION */}
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Location & Jurisdiction</h2>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.gridRow}>
                                 <div className={styles.formGroup}>
                                    <label className={styles.label}>State</label>
                                    <select name="event_state" value={formData.event_state} onChange={handleChange} className={styles.input}>
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>District</label>
                                    <select name="event_district" value={formData.event_district} onChange={handleChange} disabled={!formData.event_state} className={styles.input}>
                                        <option value="">Select District</option>
                                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Block</label>
                                    <select name="event_block" value={formData.event_block} onChange={handleChange} disabled={!formData.event_district} className={styles.input}>
                                        <option value="">Select Block</option>
                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Specific Venue / Address</label>
                                <input 
                                    type="text" 
                                    name="event_location" 
                                    value={formData.event_location} 
                                    onChange={handleChange} 
                                    className={styles.input}
                                    placeholder="e.g. Govt High School Auditorium, Belagavi"
                                />
                            </div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Attendance Records</h2>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Boys</label>
                                    <input type="number" name="boys_attended" value={formData.boys_attended} onChange={handleChange} className={styles.input} min="0" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Girls</label>
                                    <input type="number" name="girls_attended" value={formData.girls_attended} onChange={handleChange} className={styles.input} min="0" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Parents</label>
                                    <input type="number" name="parents_attended" value={formData.parents_attended} onChange={handleChange} className={styles.input} min="0" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Cohort No.</label>
                                    <input type="text" name="cohort_number" value={formData.cohort_number} onChange={handleChange} className={styles.input} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Multimedia Uploads</h2>
                        </div>
                        <div className={styles.cardBody}>
                            
                            {existingPhotos.length > 0 && (
                                <div className={styles.existingPhotosWrapper}>
                                    <p className={styles.subLabel}>Currently Uploaded Photos:</p>
                                    <div className={styles.photoGrid}>
                                        {existingPhotos.map((photo, idx) => (
                                            <div key={idx} className={styles.photoThumb}>
                                                <img 
                                                    src={`${API_BASE_URL}/${photo.file_path ? photo.file_path.replace(/\\/g, "/") : ""}`} 
                                                    alt="Thumb" 
                                                    onError={(e) => e.target.style.display='none'}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Add Photos (Max 4)</label>
                                    <div className={styles.fileDropZone}>
                                        <input 
                                            type="file" 
                                            name="photos" 
                                            multiple 
                                            accept="image/*" 
                                            onChange={handleFileChange} 
                                            className={styles.fileInput}
                                        />
                                        <div className={styles.fileDropText}>
                                            {newPhotos.length > 0 ? `Selected ${newPhotos.length} image(s)` : "Click to Select Images"}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section>

                    <div className={styles.footerActions}>
                        <button type="submit" className={styles.saveBtn} disabled={submitting}>
                            {submitting ? "Updating..." : "Save Changes"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EventEditPage;