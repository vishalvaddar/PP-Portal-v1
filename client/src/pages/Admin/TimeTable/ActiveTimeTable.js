import React, { useState } from 'react';
import './ActiveTimeTable.module.css';

const ActiveTimeTable = () => {
  // Defaulting to 'combined' as requested
  const [view, setView] = useState('combined');

  return (
    <div className="tt-container">
      <div className="tt-header">
        <h2 className="tt-title">Schedule Management</h2>
        
        <div className="tt-segment-control">
          <button 
            className={`tt-tab ${view === 'combined' ? 'active' : ''}`}
            onClick={() => setView('combined')}
          >
            Combined Time Table
          </button>
          <button 
            className={`tt-tab ${view === 'teacher' ? 'active' : ''}`}
            onClick={() => setView('teacher')}
          >
            Teacher-wise
          </button>
          <button 
            className={`tt-tab ${view === 'batch' ? 'active' : ''}`}
            onClick={() => setView('batch')}
          >
            Batch-wise
          </button>
        </div>
      </div>

      <div className="tt-content-area">
        {view === 'combined' && <div className="view-card">Showing Combined Schedule...</div>}
        {view === 'teacher' && <div className="view-card">Showing Teacher Schedules...</div>}
        {view === 'batch' && <div className="view-card">Showing Batch Schedules...</div>}
      </div>
    </div>
  );
};

export default ActiveTimeTable;