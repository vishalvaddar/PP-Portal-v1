import React from 'react';
import './AttendanceChart.css';

export default function AttendanceChart() {
  const attendanceData = [
    { day: 'Mon', present: 92, absent: 8 },
    { day: 'Tue', present: 88, absent: 12 },
    { day: 'Wed', present: 95, absent: 5 },
    { day: 'Thu', present: 85, absent: 15 },
    { day: 'Fri', present: 90, absent: 10 },
  ];

  return (
    <div className="attendance-card">
      <div className="attendance-header">
        <h3 className="attendance-title">Weekly Attendance Overview</h3>
        <div className="attendance-legend">
          <div className="legend-item">
            <span className="legend-circle present"></span>
            <span className="legend-text">Present</span>
          </div>
          <div className="legend-item">
            <span className="legend-circle absent"></span>
            <span className="legend-text">Absent</span>
          </div>
        </div>
      </div>

      <div className="attendance-bars">
        {attendanceData.map((data) => (
          <div key={data.day} className="attendance-row">
            <div className="day-label">{data.day}</div>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{ width: `${data.present}%` }}
              ></div>
            </div>
            <div className="percent-label">{data.present}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
