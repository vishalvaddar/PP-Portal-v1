import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "./EventDetailsPage.module.css";

const EventDetailsPage = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [districtName, setDistrictName] = useState("");
  const [talukaName, setTalukaName] = useState("");

  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  /* =========================================================
     Fetch Event
  ========================================================= */

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);
        const eventData = res.data;


        eventData.event_photos = Array.isArray(eventData.photos)
          ? eventData.photos.map(p => {
              if (!p.file_path) return null;

              const normalized = p.file_path.replace(/\\/g, "/");

              const fileName = normalized.split("/").pop();

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
     Fetch District Name
  ========================================================= */

  useEffect(() => {
    if (!event?.event_district) return;

    axios.get(`${API_BASE_URL}/api/juris-name/${event.event_district}`)
      .then(res => {
        const name = res.data?.data?.name || res.data?.name;
        if (name) setDistrictName(name);
      })
      .catch(err => console.error(err));

  }, [event?.event_district, API_BASE_URL]);

  /* =========================================================
     Fetch Taluka Name
  ========================================================= */

  useEffect(() => {
    if (!event?.event_block) return;

    axios.get(`${API_BASE_URL}/api/juris-name/${event.event_block}`)
      .then(res => {
        const name = res.data?.data?.name || res.data?.name;
        if (name) setTalukaName(name);
      })
      .catch(err => console.error(err));

  }, [event?.event_block, API_BASE_URL]);

  /* ========================================================= */

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Details...</p>
      </div>
    );

  if (error)
    return <div className={styles.errorContainer}>{error}</div>;

  if (!event)
    return <div className={styles.errorContainer}>Event not found.</div>;

  const {
    event_title,
    event_type_name,
    event_start_date,
    event_end_date,
    event_location,
    event_block,
    event_district,
    cohort_number,
    boys_attended,
    girls_attended,
    parents_attended,
    event_description,
    event_photos
  } = event;

  const totalAttendees =
    (Number(boys_attended) || 0) +
    (Number(girls_attended) || 0) +
    (Number(parents_attended) || 0);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return isNaN(d)
      ? "Invalid Date"
      : d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>

        {/* Top Bar */}
        <div className={styles.topBar}>
          <Link to="/admin/academics/events" className={styles.backLink}>
            ← Back
          </Link>

          <Link
            to={`/admin/academics/events/${eventId}/edit`}
            className={styles.editButton}
          >
            Edit Event
          </Link>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <span className={styles.eventType}>
            {event_type_name || "Event"}
          </span>

          <h1>{event_title}</h1>

          <div className={styles.heroMeta}>
            <div>
              📅 {formatDate(event_start_date)} - {formatDate(event_end_date)}
            </div>
            <div>📍 {event_location}</div>
          </div>
        </div>

        {/* Info Grid */}
        <div className={styles.infoGrid}>

          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <h3>Location Details</h3>

              <div className={styles.infoRow}>
                <span>District</span>
                <strong>{districtName || event_district}</strong>
              </div>

              <div className={styles.infoRow}>
                <span>Taluka</span>
                <strong>{talukaName || event_block}</strong>
              </div>

              <div className={styles.infoRow}>
                <span>Venue</span>
                <strong>{event_location}</strong>
              </div>

              <div className={styles.infoRow}>
                <span>Cohort</span>
                <strong>{cohort_number}</strong>
              </div>
            </div>

            <div className={styles.card}>
              <h3>About Event</h3>
              <p className={styles.description}>
                {event_description || "No description available."}
              </p>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.statsGrid}>

              <div className={styles.statCard}>
                <h2>{boys_attended || 0}</h2>
                <span>Boys</span>
              </div>

              <div className={styles.statCard}>
                <h2>{girls_attended || 0}</h2>
                <span>Girls</span>
              </div>

              <div className={styles.statCard}>
                <h2>{parents_attended || 0}</h2>
                <span>Parents</span>
              </div>

              <div className={styles.statCardTotal}>
                <h2>{totalAttendees}</h2>
                <span>Total</span>
              </div>

            </div>
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

      </div>
    </div>
  );
};

export default EventDetailsPage;
