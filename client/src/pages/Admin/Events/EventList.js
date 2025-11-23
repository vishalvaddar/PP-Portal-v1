import React from 'react';
import styles from './EventList.module.css';

const EventList = ({ events, onViewDetails }) => {

  const calculateTotal = (e) => {
    return (
      (Number(e.boys_count) || 0) +
      (Number(e.girls_count) || 0) +
      (Number(e.parents_count) || 0)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  return (
    <div className={styles.listContainer}>
      {events.length === 0 ? (
        <p>No events found. Click "Add New Event" to get started.</p>
      ) : (
        <table className={styles.eventTable}>
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>Location</th>
              <th>Total Attendees</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.event_id}>
                <td>{event.event_title}</td>
                <td>{event.event_type}</td>
                <td>{formatDate(event.start_date)}</td>
                <td>{event.location}</td>
                <td>{calculateTotal(event)}</td>

                <td>
                  <button
                    className={styles.actionButton}
                    onClick={() => onViewDetails(event.event_id)}
                  >
                    View Details
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}
    </div>
  );
};

export default EventList;
