import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios
import styles from './EventsDashboardPage.module.css';

import EventList from './EventList';
import EventForm from './EventForm';
import AddEventTypeModal from './AddEventTypeModal';

// --- REMOVE MOCK DATA ---
// const MOCK_EVENTS = [...];
// const INITIAL_EVENT_TYPES = [...];
// ----------------------------

const EventsDashboardPage = () => {
  const [view, setView] = useState('list');
  const [allEvents, setAllEvents] = useState([]); // Default to empty array
  const [eventTypes, setEventTypes] = useState([]); // Default to empty array
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state
  const navigate = useNavigate();

  // --- ✨ FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch both sets of data in parallel
        const [eventsRes, typesRes] = await Promise.all([
          axios.get('/api/events'), // Make sure your axios baseURL is set
          axios.get('/api/event-types')
        ]);
        
        setAllEvents(eventsRes.data);
        setEventTypes(typesRes.data);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch data when in 'list' view
    if (view === 'list') {
      fetchData();
    }
  }, [view]); // Re-fetch when view changes back to 'list'

  // --- ✨ UPDATED HANDLERS ---

  const handleSaveEvent = async (formData) => {
    // formData is already a FormData object from EventForm
    try {
      // The backend (multer) will parse the FormData
      const response = await axios.post('/api/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add new event to the list and switch view
      setAllEvents(prev => [response.data, ...prev]);
      setView('list');

    } catch (err) {
      console.error("Error saving event:", err);
      alert(`Error: ${err.response?.data?.msg || 'Failed to save event.'}`);
    }
  };

  const handleAddNewEventType = async (newType) => {
    try {
      const response = await axios.post('/api/event-types', { name: newType });
      // Add the new type (response.data.name) to the state
      setEventTypes(prev => [...prev, response.data.name]);
      
    } catch (err) {
      console.error("Error saving event type:", err);
      alert(`Error: ${err.response?.data?.msg || 'Failed to save event type.'}`);
    }
  };

  const handleViewDetails = (eventId) => {
    navigate(`/admin/academics/events/${eventId}`);
  };

  // --- RENDER LOGIC ---

  const renderContent = () => {
    if (view === 'form') {
      return (
        <EventForm
          eventTypes={eventTypes} // Pass fetched types
          onSave={handleSaveEvent}
          onCancel={() => setView('list')}
          onOpenAddTypeModal={() => setIsModalOpen(true)}
        />
      );
    }
    
    // Handle loading and error states for the list
    if (isLoading) return <div className={styles.message}>Loading events...</div>;
    if (error) return <div className={styles.messageError}>{error}</div>;

    return (
      <EventList
        events={allEvents} // Pass fetched events
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