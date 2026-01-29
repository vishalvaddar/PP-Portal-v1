import React from 'react';
import styles from './EventList.module.css';

const EventList = ({ events, onViewDetails, onDelete }) => {
  const calculateTotalAttendees = (event) => {
    return (
      Number(event.boys_attended || event.boys_count || 0) +
      Number(event.girls_attended || event.girls_count || 0) +
      Number(event.parents_attended || event.parents_count || 0)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDelete = (e, eventId) => {
    e.stopPropagation();
    if (window.confirm('Delete this event permanently?')) {
      onDelete(eventId);
    }
  };

  if (!events?.length) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>No events found</p>
        <p className={styles.emptySubtitle}>
          Click "Add New Event" to create your first event.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Event</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Location</th>
              <th className={styles.th}>Attendees</th>
              <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => (
              <tr key={event.event_id} className={styles.row}>
                <td className={styles.cell}>
                  <div className={styles.eventTitle}>{event.event_title}</div>
                  {event.cohort_number && (
                    <div className={styles.eventSubtitle}>
                      Cohort {event.cohort_number}
                    </div>
                  )}
                </td>

                <td className={styles.cell}>
                  <span className={`${styles.badge} ${styles[event.event_type_name?.toLowerCase()] || styles.badgeDefault}`}>
                    {event.event_type_name || event.event_type || 'Event'}
                  </span>
                </td>

                <td className={styles.cell}>{formatDate(event.event_start_date || event.start_date)}</td>

                <td className={styles.cell}>
                  {event.event_location || event.location || '—'}
                </td>

                <td className={`${styles.cell} ${styles.numberCell}`}>
                  {calculateTotalAttendees(event)}
                </td>

                <td className={`${styles.cell} ${styles.actionsCell}`}>
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnView}`}
                      onClick={() => onViewDetails(event.event_id)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDelete}`}
                      onClick={(e) => handleDelete(e, event.event_id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventList;