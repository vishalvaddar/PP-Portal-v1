import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  BookOpen,
  Clock,
} from "lucide-react";

import StatsCard from "../../components/Dashboard/StatsCard";
import RecentActivity from "../../components/Dashboard/RecentActivity";
import AttendanceChart from "../../components/Dashboard/AttendanceChart";
import UpcomingClasses from "../../components/Dashboard/UpcomingClasses";

import { useAuth } from "../../contexts/AuthContext";
import "./CoordinatorDashboard.css";

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const token = user?.token;

  const API = process.env.REACT_APP_BACKEND_API_URL;

  // REAL DATA STATES
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [timetable, setTimetable] = useState([]);

  const axiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  /* ===========================================================
     FETCH REAL DATA
  ============================================================ */
  useEffect(() => {
    if (!token) return;

    Promise.all([
      axios.get(`${API}/api/coordinator/students`, axiosConfig()),
      axios.get(`${API}/api/coordinator/batches`, axiosConfig()),
    ])
      .then(([studentsRes, batchesRes]) => {
        setStudents(studentsRes.data || []);
        setBatches(batchesRes.data || []);
      })
      .catch((err) => console.error("Dashboard Fetch Error:", err));
  }, [token]);

  /* ===========================================================
     FETCH TIMETABLE (for first active batch)
  ============================================================ */
  useEffect(() => {
    if (!token) return;
    if (!batches.length) return;

    const activeBatch =
      batches.find((b) => b.is_active || b.active) || batches[0];

    axios
      .get(`${API}/api/coordinator/timetable`, {
        ...axiosConfig(),
        params: { batchId: activeBatch.batch_id },
      })
      .then(({ data }) => setTimetable(data || []))
      .catch((err) => console.error("Timetable Fetch Error:", err));
  }, [token, batches]);

  /* ===========================================================
     COMPUTED VALUES
  ============================================================ */

  const totalStudents = students.length;
  const activeBatches = batches.filter((b) => b.is_active || b.active).length;

  const avgAttendance = "—"; // If needed, can compute from attendance API
  const pendingFollowups = "—"; // future feature

  // Today's timetable
  const todayClasses = useMemo(() => {
    const weekday = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();
    return timetable.filter(
      (t) => (t.day_of_week || "").toUpperCase() === weekday
    );
  }, [timetable]);

  /* ===========================================================
     STATS DATA FOR CARDS
  ============================================================ */

  const stats = [
    {
      name: "Total Students",
      value: totalStudents,
      change: "",
      changeType: "increase",
      icon: Users,
    },
    {
      name: "Active Batches",
      value: activeBatches,
      change: "",
      changeType: "increase",
      icon: BookOpen,
    },
    {
      name: "Today's Classes",
      value: todayClasses.length,
      change: "",
      changeType: "increase",
      icon: Calendar,
    },
    {
      name: "Pending Follow-ups",
      value: pendingFollowups,
      change: "",
      changeType: "decrease",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1>Welcome back, {user?.username || "Coordinator"}!</h1>
        <p>Here's what's happening with your batches today.</p>
      </div>

      {/* SUMMARY STATS */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* CHART + UPCOMING CLASSES */}
      <div className="main-grid">
        <div className="chart-section">
          <AttendanceChart />
        </div>

        <div className="classes-section">
          <UpcomingClasses classes={todayClasses} />
        </div>
      </div>

      {/* RECENT ACTIVITY + QUICK ACTIONS */}
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
