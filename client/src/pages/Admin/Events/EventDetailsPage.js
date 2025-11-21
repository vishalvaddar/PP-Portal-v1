import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './EventDetailsPage.module.css';

// --- MOCK DATA ---
// In a real app, you would fetch this event by its ID
const MOCK_EVENTS = [
  {
    id: 1,
    eventTitle: 'Sammelan251025-Cohort-3-Ankola',
    eventType: 'Pratibha Sammelan',
    startDate: '2025-10-25',
    endDate: '2025-10-27',
    district: 'Uttara Kannada',
    taluka: 'Ankola',
    location: 'Nature Bound Sahyadris, Sunksal',
    cohort: '3',
    boysCount: 50,
    girlsCount: 55,
    parentsCount: 10,
    photos: [
      'https://via.placeholder.com/300x200/EEE/CCC?text=Event+Photo+1',
      'https://via.placeholder.com/300x200/EEE/CCC?text=Event+Photo+2',
    ]
  },
  { id: 2, eventTitle: 'Ignite200925-Cohort-2-Hubballi', /* ...other data */ },
];
// -----------------

const EventDetailsPage = () => {
  const { eventId } = useParams(); // Get the ID from the URL
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // --- API Call Simulation ---
    // In a real app:
    // const fetchEvent = async () => {
    //   const response = await axios.get(`/api/events/${eventId}`);
    //   setEvent(response.data);
    //   setLoading(false);
    // }
    // fetchEvent();

    // Mock implementation:
    const foundEvent = MOCK_EVENTS.find(e => e.id.toString() === eventId);
    setEvent(foundEvent);
    setLoading(false);
    // -------------------------
  }, [eventId]);

  if (loading) {
    return <div>Loading event details...</div>;
  }

  if (!event) {
    return <div>Event not found.</div>;
  }

  const totalAttendees = (event.boysCount || 0) + (event.girlsCount || 0) + (event.parentsCount || 0);

  return (
    <div className={styles.detailsContainer}>
      <Link to="/admin/academics/events" className={styles.backLink}>
        &larr; Back to Events List
      </Link>
      
      <header className={styles.header}>
        <h1>{event.eventTitle}</h1>
        <span className={styles.eventType}>{event.eventType}</span>
      </header>

      <div className={styles.contentGrid}>
        {/* --- Main Details --- */}
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <h3>Event Details</h3>
            <div className={styles.detailItem}>
              <strong>Dates:</strong>
              <span>{event.startDate} to {event.endDate}</span>
            </div>
            <div className={styles.detailItem}>
              <strong>Location:</strong>
              <span>{event.location} ({event.taluka}, {event.district})</span>
            </div>
            <div className={styles.detailItem}>
              <strong>Cohort:</strong>
              <span>{event.cohort}</span>
            </div>
          </div>
          
          <div className={styles.card}>
            <h3>Photos</h3>
            <div className={styles.photoGrid}>
              {event.photos && event.photos.length > 0 ? (
                event.photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Event photo ${index + 1}`} />
                ))
              ) : (
                <p>No photos were uploaded for this event.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Sidebar --- */}
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
            <hr className={styles.divider} />
            <div className={`${styles.detailItem} ${styles.total}`}>
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