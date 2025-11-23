import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "./EventDetailsPage.module.css";

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/events/${eventId}`);

        // Convert photos CSV → array
        if (res.data.event_photos) {
          res.data.event_photos = res.data.event_photos.split(",").map((p) => p.trim());
        } else {
          res.data.event_photos = [];
        }

        setEvent(res.data);
        console.log("Fetched event data:", res.data);
      } catch (err) {
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) return <p>Loading event details...</p>;
  if (!event) return <p>Event not found.</p>;

  const totalAttendees =
    (Number(event.boysCount) || 0) +
    (Number(event.girlsCount) || 0) +
    (Number(event.parentsCount) || 0);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN");
  };

  return (
    <div className={styles.detailsContainer}>
      <Link to="/admin/academics/events" className={styles.backLink}>
        ← Back to Events List
      </Link>

      <header className={styles.header}>
        <h1>{event.event_title}</h1>
        <span className={styles.eventType}>{event.eventType}</span>
      </header>

      <div className={styles.contentGrid}>
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Event Details</h3>
            <div className={styles.detailItem}>
              <strong>Event Title:</strong>
              <span>{event.eventTitle}</span>
            </div>

            <div className={styles.detailItem}>
              <strong>Dates:</strong>
              <span>
                {formatDate(event.startDate)} to{" "}
                {formatDate(event.endDate)}
              </span>
            </div>

            <div className={styles.detailItem}>
              <strong>Location:</strong>
              <span>
                {event.location} ({event.taluka}, {event.district})
              </span>
            </div>

            <div className={styles.detailItem}>
              <strong>Cohort:</strong>
              <span>{event.cohort}</span>
            </div>
          </div>

          {/* PHOTOS */}
          <div className={styles.card}>
            <h3>Photos</h3>
            <div className={styles.photoGrid}>
              {event.event_photos && event.event_photos.length > 0 ? (
                event.event_photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={`${API_BASE_URL}/${photo}`}
                    alt={"Event " + idx}
                    className={styles.photo}
                  />
                ))
              ) : (
                <p>No photos uploaded for this event.</p>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h3>Attendance</h3>

            <div className={styles.detailItem}>
              <strong>Boys:</strong>
              <span>{event.boysCount}</span>
            </div>

            <div className={styles.detailItem}>
              <strong>Girls:</strong>
              <span>{event.girlsCount}</span>
            </div>

            <div className={styles.detailItem}>
              <strong>Parents:</strong>
              <span>{event.parentsCount}</span>
            </div>

            <hr />

            <div className={styles.detailItem}>
              <strong>Total:</strong>
              <span>{totalAttendees}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EventDetailsPage;
