import React, { useState } from 'react';
import styles from './AddEventTypeModal.module.css';

const AddEventTypeModal = ({ isOpen, onClose, onSave }) => {
  const [newType, setNewType] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (newType.trim()) {
      onSave(newType.trim());
      setNewType('');
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        <h2>Add New Event Type</h2>
        
        <div className={styles.formGroup}>
          <label htmlFor="newType">Event Type Name</label>
          <input
            type="text"
            id="newType"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="e.g., Volunteer Meetup"
          />
        </div>

        <div className={styles.buttonContainer}>
          <button className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.primaryButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventTypeModal;