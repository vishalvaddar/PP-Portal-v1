import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "./EventDetailsPage.module.css";

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const isUpdateMode = new URLSearchParams(window.location.search).get("mode") === "update";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [districtName, setDistrictName] = useState("");
  const [talukaName, setTalukaName] = useState("");

  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  // Sammelan Dropdown States
  const [sammelanEvents, setSammelanEvents] = useState([]);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  // Jurisdiction States
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");

  // Dual-Box States
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [selectedBlocks, setSelectedBlocks] = useState([]);

  // Student Table States
  const [students, setStudents] = useState([]);
  const [presentStudentIds, setPresentStudentIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Documentation States ---
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false); // Fixes no-undef error

  /* =========================================================
      Fetch Event Details
  ========================================================= */
  useEffect(() => {
    if (!eventId || eventId === "attendance" || eventId === "manage") {
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
        const eventData = res.data;

        eventData.event_photos = Array.isArray(eventData.photos)
          ? eventData.photos.map((p) => {
              if (!p.file_path) return null;
              const fileName = p.file_path.replace(/\\/g, "/").split("/").pop();
              return `${API_BASE_URL}/uploads/events/photos/${fileName}`;
            }).filter(Boolean)
          : [];

        setEvent(eventData);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Could not load event details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, API_BASE_URL]);

  /* =========================================================
      Attendance Cascading Logic
  ========================================================= */
  useEffect(() => {
    if (!isUpdateMode) return;
    axios.get(`${API_BASE_URL}/api/attendance/sammelan-list`).then((res) => setSammelanEvents(res.data?.data || []));
    axios.get(`${API_BASE_URL}/api/attendance/jurisdictions?type=state`).then((res) => setStates(res.data?.data || []));
  }, [isUpdateMode, API_BASE_URL]);

  useEffect(() => {
    if (selectedState) {
      axios.get(`${API_BASE_URL}/api/attendance/jurisdictions?type=division&stateName=${selectedState}`)
        .then((res) => setDivisions(res.data?.data || []));
    }
  }, [selectedState, API_BASE_URL]);

  useEffect(() => {
    if (selectedDivision) {
      axios.get(`${API_BASE_URL}/api/attendance/jurisdictions`, {
          params: { type: "district", divisionNames: [selectedDivision] },
        })
        .then((res) => {
          setAvailableDistricts(res.data?.data || []);
          setSelectedDistricts([]);
        })
        .catch((err) => console.error("Error fetching districts:", err));
    }
  }, [selectedDivision, API_BASE_URL]);

  useEffect(() => {
    if (selectedDistricts.length > 0 && selectedState && selectedDivision) {
      const districtNames = selectedDistricts.map((d) => d.juris_name);
      axios.get(`${API_BASE_URL}/api/attendance/jurisdictions`, {
          params: {
            type: "block",
            stateName: selectedState,
            divisionNames: [selectedDivision],
            districtNames: districtNames,
          },
        })
        .then((res) => setAvailableBlocks(res.data?.data || []))
        .catch((err) => console.error("Block fetch error:", err));
    } else {
      setAvailableBlocks([]);
    }
  }, [selectedDistricts, selectedState, selectedDivision, API_BASE_URL]);

  /* =========================================================
      Handlers
  ========================================================= */
  const moveToSelected = (item, type) => {
    if (type === "district") {
      setAvailableDistricts((prev) => prev.filter((i) => i.juris_code !== item.juris_code));
      setSelectedDistricts((prev) => [...prev, item]);
    } else {
      setAvailableBlocks((prev) => prev.filter((i) => i.juris_code !== item.juris_code));
      setSelectedBlocks((prev) => [...prev, item]);
    }
  };

  const moveToAvailable = (item, type) => {
    if (type === "district") {
      setSelectedDistricts((prev) => prev.filter((i) => i.juris_code !== item.juris_code));
      setAvailableDistricts((prev) => [...prev, item]);
    } else {
      setSelectedBlocks((prev) => prev.filter((i) => i.juris_code !== item.juris_code));
      setAvailableBlocks((prev) => [...prev, item]);
    }
  };

  const handleSearchStudents = async (pageNumber = 1) => {
    if (!selectedEventTitle) return alert("Please select a Sammelan Event.");
    const actualPage = typeof pageNumber === "number" ? pageNumber : 1;

    try {
      const distNames = selectedDistricts.map((d) => d.juris_name);
      const blockNames = selectedBlocks.map((b) => b.juris_name);

      const res = await axios.post(`${API_BASE_URL}/api/attendance/students-list`, {
          eventTitle: selectedEventTitle,
          stateName: selectedState || null,
          districtNames: distNames.length > 0 ? distNames : null,
          blockNames: blockNames.length > 0 ? blockNames : null,
          page: actualPage,
      });

      const fetchedStudents = res.data?.data || [];
      setStudents(fetchedStudents);
      setCurrentPage(actualPage);

      if (fetchedStudents.length > 0) {
        const allIds = fetchedStudents.map((s) => s.student_id);
        setPresentStudentIds((prev) => Array.from(new Set([...prev, ...allIds])));
      } else {
        alert("No students found.");
      }
    } catch (err) {
      alert("Failed to load students.");
    }
  };

const handleSaveAttendance = async () => {
  const selectedEventObj = sammelanEvents.find((e) => e.event_title === selectedEventTitle);
  const finalEventId = eventId || selectedEventObj?.event_id;

  if (!finalEventId) return alert("Select an Event first.");
  if (presentStudentIds.length === 0) return alert("No students marked present.");

  // --- STEP 1: INITIAL CONFIRMATION ---
  if (!attendanceSaved) {
    const confirm = window.confirm(`Confirm attendance for ${presentStudentIds.length} students?`);
    if (confirm) setAttendanceSaved(true);
    return;
  }

  // --- STEP 2: VALIDATION (Optional but limited) ---
  // NEW: Check limits before sending to avoid Multer silent errors
  if (selectedPhotos.length > 4) {
    return alert("You can only upload a maximum of 4 photos.");
  }
  if (selectedReports.length > 1) {
    return alert("You can only upload 1 report.");
  }

  const formData = new FormData();
  // IMPORTANT: Text fields MUST come before files for Multer renaming to work
  formData.append("eventId", finalEventId);
  formData.append("eventTitle", selectedEventTitle);
  formData.append("studentIds", JSON.stringify(presentStudentIds));

  // Images and Reports are now optional - only append if they exist
  if (selectedPhotos && selectedPhotos.length > 0) {
    selectedPhotos.forEach((file) => formData.append("photos", file));
  }
  if (selectedReports && selectedReports.length > 0) {
    selectedReports.forEach((file) => formData.append("reports", file));
  }

  try {
    setIsSaving(true);
    await axios.post(`${API_BASE_URL}/api/attendance/save`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert("Attendance saved successfully!");
    setAttendanceSaved(false); 
    setStudents([]);
    setSelectedPhotos([]); // Clear local state
    setSelectedReports([]);
  } catch (err) {
    // If Multer blocks the request (e.g. file too large), it falls here
    const errorMsg = err.response?.data?.message || "Check file sizes (Max 5MB) or server.";
    alert("Failed to save: " + errorMsg);
  } finally {
    setIsSaving(false);
  }
};

  /* =========================================================
      Rendering
  ========================================================= */
  if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div><p>Loading...</p></div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>; // Added error display
  if (!event && !isUpdateMode) return <div className={styles.errorContainer}>Event not found.</div>;

  const event_photos = event?.event_photos || [];
  
  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d) ? "Invalid Date" : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {isUpdateMode ? (
          <div className={styles.attendanceSammelanSection}>
            <div className={styles.topBar}>
              <Link to="/admin/academics/events" className={styles.backLink}>← Back</Link>
              <h2 className={styles.sectionTitle}>Attendance Sammelan Tracking</h2>
            </div>

            <div className={styles.filterGrid}>
              <div className={styles.formGroup}>
                <label>1. Select Sammelan Event</label>
                <select value={selectedEventTitle} onChange={(e) => setSelectedEventTitle(e.target.value)}>
                  <option value="">-- Choose Event --</option>
                  {sammelanEvents.map((e) => <option key={e.event_id} value={e.event_title}>{e.event_title}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>2. Select State</label>
                <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                  <option value="">-- Choose State --</option>
                  {states.map((s) => <option key={s.juris_code} value={s.juris_name}>{s.juris_name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>3. Select Division</label>
                <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)} disabled={!selectedState}>
                  <option value="">-- Choose Division --</option>
                  {divisions.map((d) => <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.dualBoxContainer}>
              <div className={styles.box}>
                <h4>Available Districts</h4>
                <ul>{availableDistricts.map((d) => <li key={d.juris_code} onClick={() => moveToSelected(d, "district")}>{d.juris_name} +</li>)}</ul>
              </div>
              <div className={styles.box}>
                <h4>Selected Districts</h4>
                <ul>{selectedDistricts.map((d) => <li key={d.juris_code} onClick={() => moveToAvailable(d, "district")}>{d.juris_name} ×</li>)}</ul>
              </div>
            </div>

            <div className={styles.dualBoxContainer} style={{ marginTop: "20px" }}>
              <div className={styles.box}>
                <h4>Available Blocks</h4>
                <ul>{availableBlocks.map((b) => <li key={b.juris_code} onClick={() => moveToSelected(b, "block")}>{b.juris_name} +</li>)}</ul>
              </div>
              <div className={styles.box}>
                <h4>Selected Blocks</h4>
                <ul>{selectedBlocks.map((b) => <li key={b.juris_code} onClick={() => moveToAvailable(b, "block")}>{b.juris_name} ×</li>)}</ul>
              </div>
            </div>

            <button className={styles.primaryButton} onClick={() => handleSearchStudents(1)}>Search Students</button>

            {students.length > 0 && (
              <div className={styles.studentListSection}>
                <table className={styles.studentTable}>
                  <thead><tr><th>Mark Present</th><th>Student Name</th><th>District</th><th>Block</th></tr></thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.student_id}>
                        <td>
                          <input type="checkbox" checked={presentStudentIds.includes(s.student_id)}
                            onChange={(e) => {
                              if (e.target.checked) setPresentStudentIds((prev) => [...prev, s.student_id]);
                              else setPresentStudentIds((prev) => prev.filter((id) => id !== s.student_id));
                            }} 
                          />
                        </td>
                        <td>{s.student_name}</td><td>{s.district_name}</td><td>{s.block_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className={styles.paginationControls}>
                  <button className={styles.pageBtn} onClick={() => handleSearchStudents(currentPage - 1)} disabled={currentPage === 1}>← Previous</button>
                  <span className={styles.pageInfo}>Page {currentPage}</span>
                  <button className={styles.pageBtn} onClick={() => handleSearchStudents(currentPage + 1)} disabled={students.length < 15}>Next →</button>
                </div>

                <div className={styles.tableFooter}>
                  <span>Marked: {presentStudentIds.length} students</span>
                  
                  {!attendanceSaved ? (
                    <button className={styles.saveBtn} onClick={handleSaveAttendance}>Confirm Attendance</button>
                  ) : (
                    <div className={styles.finalStepContainer}>
                      <div className={styles.uploadSection}>
                        <div className={styles.uploadCard}>
                          <h4>📸 Sammelan Photos (Max 4)</h4>
                          <input type="file" multiple accept="image/*" onChange={(e) => setSelectedPhotos(Array.from(e.target.files).slice(0, 4))} />
                        </div>
                        <div className={styles.uploadCard}>
                          <h4>📄 Event Report (Max 5MB)</h4>
                          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setSelectedReports(Array.from(e.target.files).slice(0, 1))} />
                        </div>
                      </div>
                      <button className={styles.saveBtn} onClick={handleSaveAttendance} disabled={isSaving}>{isSaving ? "Uploading..." : "Final Submit & Save All"}</button>
                      <button className={styles.backLink} onClick={() => setAttendanceSaved(false)} style={{ border: "none", background: "none", marginTop: "10px", cursor: "pointer" }}>← Change Attendance</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NORMAL VIEW (Read-only) */
          <>
            <div className={styles.topBar}>
              <Link to="/admin/academics/events" className={styles.backLink}>← Back</Link>
              <Link to={`/admin/academics/events/${eventId}/edit`} className={styles.editButton}>Edit Event</Link>
            </div>
            <div className={styles.hero}>
              <span className={styles.eventType}>{event.event_type_name || "Event"}</span>
              <h1>{event.event_title}</h1>
              <div className={styles.heroMeta}>
                <div>📅 {formatDate(event.event_start_date)} - {formatDate(event.event_end_date)}</div>
                <div>📍 {event.event_location}</div>
              </div>
            </div>
            {/* Gallery */}
        <div className={styles.gallerySection}>
          <h3>Event Gallery</h3>

          {event_photos.length ? (
            <div className={styles.galleryGrid}>
              {event_photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt="event"
                  className={styles.galleryImg}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              No images uploaded
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventDetailsPage;