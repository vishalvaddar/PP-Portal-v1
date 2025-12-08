import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "./EventDetailsPage.module.css";

const EventDetailsPage = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
                const eventData = res.data;

                // Safely convert photos CSV string to an array
                if (eventData.event_photos && typeof eventData.event_photos === 'string') {
                    eventData.event_photos = eventData.event_photos
                        .split(",")
                        .map((p) => p.trim())
                        .filter(p => p.length > 0);
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

    if (loading) return <p className={styles.statusMessage}>Loading event details...</p>;
    if (error) return <p className={`${styles.statusMessage} ${styles.errorMessage}`}>{error}</p>;
    if (!event) return <p className={styles.statusMessage}>Event not found.</p>;

    // Destructure for cleaner access and provide safe defaults
    const {
        eventTitle,
        eventType_name, // Assuming the backend returns the name alongside the ID
        eventType,
        startDate,
        endDate,
        location,
        taluka,
        district,
        state, // Include state in the display
        cohort,
        boysCount,
        girlsCount,
        parentsCount,
        description,
        event_photos,
    } = event;

    const totalAttendees =
        (Number(boysCount) || 0) +
        (Number(girlsCount) || 0) +
        (Number(parentsCount) || 0);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        // Use a standard format, e.g., DD/MM/YYYY
        return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString("en-IN", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className={styles.detailsContainer}>
            <Link to="/admin/academics/events" className={styles.backLink}>
                ← Back to Events List
            </Link>

            <header className={styles.header}>
                <h1 className={styles.title}>{eventTitle || "Untitled Event"}</h1>
                <span className={styles.eventTypeTag}>{eventType_name || `Type ID: ${eventType}` || "Unknown Type"}</span>
            </header>
            
            <hr className={styles.separator} />

            <div className={styles.contentGrid}>
                
                {/* MAIN CONTENT COLUMN */}
                <div className={styles.mainContent}>

                    {/* EVENT DETAILS */}
                    <div className={styles.card}>
                        <h3 className={styles.cardHeader}>📌 Event Information</h3>
                        
                        <div className={styles.detailItem}>
                            <strong className={styles.detailLabel}>Dates:</strong>
                            <span className={styles.detailValue}>
                                {formatDate(startDate)} {startDate !== endDate && `to ${formatDate(endDate)}`}
                            </span>
                        </div>

                        <div className={styles.detailItem}>
                            <strong className={styles.detailLabel}>Location:</strong>
                            <span className={styles.detailValue}>
                                {location || "N/A"}
                                <span className={styles.locationJurisdiction}>
                                    ({taluka}, {district}, {state})
                                </span>
                            </span>
                        </div>
                        
                        <div className={styles.detailItem}>
                            <strong className={styles.detailLabel}>Cohort:</strong>
                            <span className={styles.detailValue}>{cohort || "N/A"}</span>
                        </div>
                    </div>
                    
                    {/* DESCRIPTION */}
                    <div className={styles.card}>
                        <h3 className={styles.cardHeader}>📝 Description</h3>
                        <p className={styles.descriptionText}>{description || "No description provided for this event."}</p>
                    </div>

                    {/* PHOTOS SECTION */}
                    <div className={styles.card}>
                        <h3 className={styles.cardHeader}>📸 Event Photos ({event_photos?.length || 0})</h3>
                        <div className={styles.photoGrid}>
                            {event_photos && event_photos.length > 0 ? (
                                event_photos.map((photo, idx) => (
                                    <a 
                                        key={idx} 
                                        href={`${API_BASE_URL}/${photo}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={styles.photoWrapper}
                                    >
                                        <img
                                            src={`${API_BASE_URL}/${photo}`}
                                            alt={`Event Photo ${idx + 1}`}
                                            className={styles.photo}
                                        />
                                    </a>
                                ))
                            ) : (
                                <p>No photos uploaded for this event.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* SIDEBAR COLUMN */}
                <aside className={styles.sidebar}>
                    <div className={`${styles.card} ${styles.attendanceCard}`}>
                        <h3 className={styles.cardHeader}>👥 Attendance Summary</h3>

                        <div className={styles.attendanceItem}>
                            <strong className={styles.detailLabel}>Boys:</strong>
                            <span className={styles.attendanceCount}>{boysCount || 0}</span>
                        </div>

                        <div className={styles.attendanceItem}>
                            <strong className={styles.detailLabel}>Girls:</strong>
                            <span className={styles.attendanceCount}>{girlsCount || 0}</span>
                        </div>

                        <div className={styles.attendanceItem}>
                            <strong className={styles.detailLabel}>Parents:</strong>
                            <span className={styles.attendanceCount}>{parentsCount || 0}</span>
                        </div>

                        <div className={styles.totalRow}>
                            <strong className={styles.detailLabel}>Total Attendees:</strong>
                            <span className={styles.totalCount}>{totalAttendees}</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default EventDetailsPage;