import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "./EventDetailsPage.module.css";

const EventDetailsPage = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for resolved names
    const [districtName, setDistrictName] = useState("");
    const [talukaName, setTalukaName] = useState("");

    const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

    // 1. Fetch Event Data
    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
                const eventData = res.data;

                // Fix Photos Array
                if (Array.isArray(eventData.photos)) {
                    eventData.event_photos = eventData.photos.map((p) => {
                        return p.file_path ? p.file_path.replace(/\\/g, "/") : "";
                    }).filter(path => path.length > 0);
                } else {
                    eventData.event_photos = [];
                }

                setEvent(eventData);
            } catch (err) {
                console.error("Error fetching event:", err);
                setError("Could not load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, API_BASE_URL]);

    // 2. Fetch District Name
    useEffect(() => {
        if (event?.event_district) {
            axios.get(`${API_BASE_URL}/api/juris-name/${event.event_district}`)
                .then((res) => {
                    const name = res.data?.data?.name || res.data?.name;
                    if (name) setDistrictName(name);
                })
                .catch((err) => console.error("Error fetching district name:", err));
        }
    }, [event?.event_district, API_BASE_URL]);

    // 3. Fetch Taluka Name
    useEffect(() => {
        if (event?.event_block) {
            axios.get(`${API_BASE_URL}/api/juris-name/${event.event_block}`)
                .then((res) => {
                    const name = res.data?.data?.name || res.data?.name;
                    if (name) setTalukaName(name);
                })
                .catch((err) => console.error("Error fetching taluka name:", err));
        }
    }, [event?.event_block, API_BASE_URL]);


    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div><p>Loading Details...</p></div>;
    if (error) return <div className={styles.errorContainer}>{error}</div>;
    if (!event) return <div className={styles.errorContainer}>Event not found.</div>;

    const {
        event_title,
        event_type_name,
        eventType,
        event_start_date,
        event_end_date,
        event_location: location,
        event_block: talukaId,
        event_district: districtId,
        cohort_number: cohort,
        boys_attended: boysCount,
        girls_attended: girlsCount,
        parents_attended: parentsCount,
        event_description: description,
        event_photos,
    } = event;

    const totalAttendees =
        (Number(boysCount) || 0) +
        (Number(girlsCount) || 0) +
        (Number(parentsCount) || 0);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString("en-IN", {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                
                {/* Top Navigation Bar */}
                <div className={styles.topBar}>
                    <Link to="/admin/academics/events" className={styles.backLink}>
                        &larr; Back to Events
                    </Link>
                    <Link to={`/admin/academics/events/${eventId}/edit`} className={styles.editButton}>
                        Edit Event
                    </Link>
                </div>

                {/* Hero / Header Section */}
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <span className={styles.eventTypeTag}>{event_type_name || eventType || "Event"}</span>
                        <h1 className={styles.title}>{event_title || "Untitled Event"}</h1>
                        <div className={styles.metaRow}>
                            <span className={styles.metaItem}>📅 {formatDate(event_start_date)} {event_start_date !== event_end_date && ` - ${formatDate(event_end_date)}`}</span>
                            <span className={styles.metaItem}>📍 {location || "No Location"}</span>
                        </div>
                    </div>
                </header>

                {/* Main Content Grid - Full Width Layout */}
                <div className={styles.gridContainer}>
                    
                    {/* Column 1: Details & Jurisdiction */}
                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>📍 Jurisdiction & Location</h3>
                        <div className={styles.infoList}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>District</span>
                                <span className={styles.value}>{districtName || districtId || "N/A"}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Taluka / Block</span>
                                <span className={styles.value}>{talukaName || talukaId || "N/A"}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Venue</span>
                                <span className={styles.value}>{location || "N/A"}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Cohort</span>
                                <span className={styles.value}>{cohort || "N/A"}</span>
                            </div>
                        </div>
                    </section>

                    {/* Column 2: Attendance Stats */}
                    <section className={styles.card}>
                        <h3 className={styles.cardTitle}>👥 Attendance Overview</h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statBox}>
                                <span className={styles.statNumber}>{boysCount || 0}</span>
                                <span className={styles.statLabel}>Boys</span>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statNumber}>{girlsCount || 0}</span>
                                <span className={styles.statLabel}>Girls</span>
                            </div>
                            <div className={styles.statBox}>
                                <span className={styles.statNumber}>{parentsCount || 0}</span>
                                <span className={styles.statLabel}>Parents</span>
                            </div>
                            <div className={`${styles.statBox} ${styles.totalBox}`}>
                                <span className={styles.statNumber}>{totalAttendees}</span>
                                <span className={styles.statLabel}>Total</span>
                            </div>
                        </div>
                    </section>

                    {/* Full Width: Description */}
                    <section className={`${styles.card} ${styles.fullWidth}`}>
                        <h3 className={styles.cardTitle}>📝 About this Event</h3>
                        <div className={styles.descriptionContent}>
                            {description ? description : <span className={styles.placeholderText}>No description provided.</span>}
                        </div>
                    </section>

                    {/* Full Width: Photos */}
                    <section className={`${styles.card} ${styles.fullWidth}`}>
                        <h3 className={styles.cardTitle}>📸 Gallery ({event_photos?.length || 0})</h3>
                        {event_photos && event_photos.length > 0 ? (
                            <div className={styles.galleryGrid}>
                                {event_photos.map((photoPath, idx) => (
                                    <a 
                                        key={idx} 
                                        href={`${API_BASE_URL}/${photoPath}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={styles.galleryItem}
                                    >
                                        <img
                                            src={`${API_BASE_URL}/${photoPath}`}
                                            alt={`Event ${idx + 1}`}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.src = "https://via.placeholder.com/300x200?text=Image+Error"; 
                                            }}
                                        />
                                        <div className={styles.overlay}>View Full Size</div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>No photos available for this event.</div>
                        )}
                    </section>

                </div>
            </div>
        </div>
    );
};

export default EventDetailsPage;