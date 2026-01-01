import React from 'react';
import styles from './EventList.module.css';

const EventList = ({ events, onViewDetails }) => {

  const calculateTotal = (e) => {
    // Ensure we handle both snake_case (API) or camelCase if your prop names vary
    return (
      (Number(e.boys_attended || e.boys_count) || 0) +
      (Number(e.girls_attended || e.girls_count) || 0) +
      (Number(e.parents_attended || e.parents_count) || 0)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.listContainer}>
      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No events found.</p>
          <span>Click "Add New Event" above to create one.</span>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.eventTable}>
            <thead>
              <tr>
                <th className={styles.thLeft}>Event Title</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>Location</th>
                <th>Attendees</th>
                <th className={styles.thRight}>Action</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <tr key={event.event_id} className={styles.tableRow}>
                  <td className={styles.titleCell}>
                    <div className={styles.titleText}>{event.event_title}</div>
                    <div className={styles.subText}>{event.cohort_number ? `Cohort ${event.cohort_number}` : ''}</div>
                  </td>
                  
                  <td>
                    <span className={styles.typeBadge}>
                      {event.event_type_name || event.event_type || 'Event'}
                    </span>
                  </td>
                  
                  <td className={styles.dateCell}>
                    {formatDate(event.event_start_date || event.start_date)}
                  </td>
                  
                  <td className={styles.locationCell}>
                    {event.event_location || event.location || "N/A"}
                  </td>
                  
                  <td className={styles.numberCell}>
                    {calculateTotal(event)}
                  </td>

                  <td className={styles.actionCell}>
                    <button
                      className={styles.viewButton}
                      onClick={() => onViewDetails(event.event_id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventList;