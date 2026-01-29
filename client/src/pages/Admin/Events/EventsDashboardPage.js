import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './EventsDashboardPage.module.css';

import EventList from './EventList';
import EventForm from './EventForm';
import AddEventTypeModal from './AddEventTypeModal';

const EventsDashboardPage = () => {
  const [view, setView] = useState('list');
  const [allEvents, setAllEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [typesUpdateTrigger, setTypesUpdateTrigger] = useState(0);

  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  // --- Fetch Events List ---
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      setAllEvents(response.data?.data || response.data || []); 
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please ensure the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (view === 'list') {
      fetchEvents();
    }
  }, [view, fetchEvents]);

  // --- Handlers ---

  const handleSaveEvent = async (formData) => {
    try {
      setIsLoading(true);
      
      await axios.post(`${API_BASE_URL}/api/events`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert("Event saved successfully!");
      setView('list');

    } catch (err) {
      console.error("Error saving event:", err);
      const msg = err.response?.data?.msg || 'Failed to save event.';
      alert(`Error: ${msg}`);
      setIsLoading(false); 
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

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/events/${eventId}`);
      
      if (response.status === 200) {
        alert("Event deleted successfully");
        fetchEvents();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    }
  };

  // --- Render Helpers ---

  const renderContent = () => {
    if (view === 'form') {
      return (
        <EventForm
          key={typesUpdateTrigger}
          onSave={handleSaveEvent}
          onCancel={() => setView('list')}
          onOpenAddTypeModal={() => setIsModalOpen(true)}
        />
      );
    }
    
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading events...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={fetchEvents}>Retry</button>
        </div>
      );
    }

    return (
      <EventList
        events={allEvents}
        onViewDetails={handleViewDetails}
        onDelete={handleDeleteEvent}
      />
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Events Management</h1>
        </div>
        
        {view === 'list' && (
          <button
            className={styles.primaryButton}
            onClick={() => setView('form')}
          >
            + Add New Event
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