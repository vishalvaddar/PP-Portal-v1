import React from 'react';
import styles from './EventList.module.css';

const EventList = ({ events, onViewDetails }) => {

  const calculateTotal = (e) => {
    return (Number(e.boysCount) || 0) + (Number(e.girlsCount) || 0);
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
              <th>Attendees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>{event.eventTitle}</td>
                <td>{event.eventType}</td>
                <td>{event.startDate}</td>
                <td>{event.location}</td>
                <td>{calculateTotal(event)}</td>
                <td>
                  <button 
                    className={styles.actionButton}
                    onClick={() => onViewDetails(event.id)}
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