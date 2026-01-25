import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './EventsDashboardPage.module.css';

import EventList from './EventList';
import EventForm from './EventForm'; // Ensure path is correct
import AddEventTypeModal from './AddEventTypeModal';

const EventsDashboardPage = () => {
  const [view, setView] = useState('list');
  const [allEvents, setAllEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Used to force re-render/re-fetch in EventForm when a new type is added
  const [typesUpdateTrigger, setTypesUpdateTrigger] = useState(0);

  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  // --- Fetch Events List ---
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      setAllEvents(response.data);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    if (view === 'list') {
      fetchEvents();
    }
  }, [view, API_BASE_URL]);

  // --- Handlers ---

  const handleSaveEvent = async (formData) => {
    // formData is a FormData object containing fields and files passed from EventForm
    try {
      setIsLoading(true); 
      
      await axios.post(`${API_BASE_URL}/api/events`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // On success, refresh the list and switch view
      await fetchEvents();
      setView('list');

    } catch (err) {
      console.error("Error saving event:", err);
      const msg = err.response?.data?.msg || 'Failed to save event.';
      alert(`Error: ${msg}`);
      setIsLoading(false); // Stop loading if error occurs
    }
  };

  const handleAddNewEventType = async (newType) => {
    try {
      await axios.post(`${API_BASE_URL}/api/event-types`, { event_type_name: newType });
      
      setIsModalOpen(false);
      
      setTypesUpdateTrigger(prev => prev + 1);
      
      alert('Event type added successfully!');
    } catch (err) {
      console.error("Error saving event type:", err);
      const msg = err.response?.data?.msg || 'Failed to save event type.';
      alert(`Error: ${msg}`);
    }
  };

  const handleViewDetails = (eventId) => {
    navigate(`/admin/academics/events/${eventId}`);
  };

  // --- Render Logic ---

  const renderContent = () => {
    if (view === 'form') {
      return (
        <EventForm
          // key forces re-mount (and re-fetch of dropdowns) when a new type is added
          key={typesUpdateTrigger} 
          onSave={handleSaveEvent}
          onCancel={() => setView('list')}
          onOpenAddTypeModal={() => setIsModalOpen(true)}
        />
      );
    }
    
    if (isLoading) return <div className={styles.message}>Loading events...</div>;
    if (error) return <div className={styles.messageError}>{error}</div>;

    return (
      <EventList
        events={allEvents}
        onViewDetails={handleViewDetails}
      />
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Events Management</h1>
        {view === 'list' && (
          <button
            className={styles.primaryButton}
            onClick={() => setView('form')}
          >
            Add New Event
          </button>
        )}
      </header>
      
      <main className={styles.content}>
        {renderContent()}
      </main>

      <AddEventTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddNewEventType}
      />
    </div>
  );
};

export default EventsDashboardPage;