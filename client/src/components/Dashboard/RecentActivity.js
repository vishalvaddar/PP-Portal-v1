import React from 'react';
import { User, Calendar, FileText, Phone } from 'lucide-react';
import './RecentActivity.css';

export default function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'attendance',
      message: 'Attendance marked for Batch A - Mathematics',
      time: '2 hours ago',
      icon: Calendar,
      iconClass: 'icon-green'
    },
    {
      id: 2,
      type: 'student',
      message: 'New student Priya Sharma added to Batch B',
      time: '4 hours ago',
      icon: User,
      iconClass: 'icon-blue'
    },
    {
      id: 3,
      type: 'resource',
      message: 'Physics notes uploaded for Batch C',
      time: '1 day ago',
      icon: FileText,
      iconClass: 'icon-purple'
    },
    {
      id: 4,
      type: 'contact',
      message: 'Parent meeting scheduled for Rahul Kumar',
      time: '2 days ago',
      icon: Phone,
      iconClass: 'icon-orange'
    },
  ];

  return (
    <div className="recent-activity-card">
      <h3 className="recent-activity-title">Recent Activity</h3>
      <div className="recent-activity-list">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div className={`activity-icon ${activity.iconClass}`}>
              <activity.icon size={16} />
            </div>
            <div className="activity-content">
              <p className="activity-message">{activity.message}</p>
              <p className="activity-time">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
