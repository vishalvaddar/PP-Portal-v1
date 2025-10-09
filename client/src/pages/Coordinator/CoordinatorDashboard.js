import React from 'react';
import { Users, Calendar, TrendingUp, AlertCircle, BookOpen, Clock } from 'lucide-react';
import StatsCard from '../../components/Dashboard/StatsCard';
import RecentActivity from '../../components/Dashboard/RecentActivity';
import AttendanceChart from '../../components/Dashboard/AttendanceChart';
import UpcomingClasses from '../../components/Dashboard/UpcomingClasses';
import './CoordinatorDashboard.css';

export default function Dashboard() {
  const stats = [
    { name: 'Total Students', value: '248', change: '+12', changeType: 'increase', icon: Users },
    { name: 'Active Batches', value: '8', change: '+2', changeType: 'increase', icon: BookOpen },
    { name: 'Avg Attendance', value: '87%', change: '+5%', changeType: 'increase', icon: TrendingUp },
    { name: 'Pending Follow-ups', value: '23', change: '-3', changeType: 'decrease', icon: AlertCircle },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, Pradeep!</h1>
        <p>Here's what's happening with your batches today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      <div className="main-grid">
        <div className="chart-section">
          <AttendanceChart />
        </div>
        <div className="classes-section">
          <UpcomingClasses />
        </div>
      </div>

      <div className="bottom-grid">
        <RecentActivity />
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn blue">
              <Calendar className="icon" />
              <p>Mark Attendance</p>
            </button>
            <button className="action-btn green">
              <Users className="icon" />
              <p>View Students</p>
            </button>
            <button className="action-btn purple">
              <BookOpen className="icon" />
              <p>Upload Notes</p>
            </button>
            <button className="action-btn orange">
              <Clock className="icon" />
              <p>View Timetable</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
