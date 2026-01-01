import React, { useState } from "react";
import styles from "./AddEventTypeModal.module.css";

const AddEventTypeModal = ({ isOpen, onClose, onSave }) => {
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmed = newType.trim();

    if (!trimmed) {
      setError("Event type name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // onSave should return a Promise
      await onSave(trimmed);

      setNewType("");
      onClose();
    } catch (err) {
      // backend-friendly error handling
      if (err?.response?.status === 409) {
        setError("Event type already exists");
      } else {
        setError(
          err?.response?.data?.msg || "Failed to create event type"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Add New Event Type</h2>

        <div className={styles.formGroup}>
          <label htmlFor="newType">Event Type Name</label>
          <input
            type="text"
            id="newType"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="e.g., Volunteer Meetup"
            disabled={loading}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventTypeModal;
