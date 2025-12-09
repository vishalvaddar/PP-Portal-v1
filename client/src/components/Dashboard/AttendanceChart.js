// import React from 'react';
// import './AttendanceChart.css';

// export default function AttendanceChart() {
//   const attendanceData = [
//     { day: 'Mon', present: 92, absent: 8 },
//     { day: 'Tue', present: 88, absent: 12 },
//     { day: 'Wed', present: 95, absent: 5 },
//     { day: 'Thu', present: 85, absent: 15 },
//     { day: 'Fri', present: 90, absent: 10 },
//   ];

//   return (
//     <div className="attendance-card">
//       <div className="attendance-header">
//         <h3 className="attendance-title">Weekly Attendance Overview</h3>
//         <div className="attendance-legend">
//           <div className="legend-item">
//             <span className="legend-circle present"></span>
//             <span className="legend-text">Present</span>
//           </div>
//           <div className="legend-item">
//             <span className="legend-circle absent"></span>
//             <span className="legend-text">Absent</span>
//           </div>
//         </div>
//       </div>

//       <div className="attendance-bars">
//         {attendanceData.map((data) => (
//           <div key={data.day} className="attendance-row">
//             <div className="day-label">{data.day}</div>
//             <div className="bar-container">
//               <div
//                 className="bar-fill"
//                 style={{ width: `${data.present}%` }}
//               ></div>
//             </div>
//             <div className="percent-label">{data.present}%</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AttendanceBatchComparison() {
  const { user } = useAuth();
  const token = user?.token;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = process.env.REACT_APP_BACKEND_API_URL;

  const axiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    if (!token) return;

    async function loadWeekAvg() {
      try {
        const res = await axios.get(
          `${API}/api/coordinator/attendance/batch-weekly-avg`,
          axiosConfig()
        );
        setRows(res.data || []);
      } catch (err) {
        console.error("Failed weekly avg:", err);
      } finally {
        setLoading(false);
      }
    }

    loadWeekAvg();
  }, [token]);

  const badgeColor = (v) => {
    if (v >= 90) return "bg-green-500 text-white";
    if (v >= 75) return "bg-yellow-400 text-black";
    return "bg-red-500 text-white";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Previous Week – Batch Average Attendance
      </h3>

      {/* Loading */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No attendance data available.</p>
      ) : (
        <>
          {/* ---------- BAR GRAPH ---------- */}
          <div className="w-full h-72 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="batch_name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="avg_attendance"
                  name="Avg Attendance (%)"
                  fill="#4F46E5" // Indigo
                  radius={[6, 6, 0, 0]}
                  barSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ---------- EXISTING TABLE ---------- */}
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-2 text-left">Cohort</th>
                  <th className="p-2 text-left">Batch</th>
                  <th className="p-2 text-center">Previous Week Avg</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 break-words">{r.cohort_name}</td>
                    <td className="p-2 break-words">{r.batch_name}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-3 py-1 rounded text-xs font-semibold ${badgeColor(
                          r.avg_attendance
                        )}`}
                      >
                        {r.avg_attendance.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
