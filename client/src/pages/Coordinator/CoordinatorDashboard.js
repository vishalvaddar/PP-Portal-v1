// // import React, { useEffect, useState, useMemo } from "react";
// // import axios from "axios";
// // import {
// //   Users,
// //   Calendar,
// //   TrendingUp,
// //   AlertCircle,
// //   BookOpen,
// //   Clock,
// // } from "lucide-react";

// // import StatsCard from "../../components/Dashboard/StatsCard";
// // import RecentActivity from "../../components/Dashboard/RecentActivity";
// // import AttendanceChart from "../../components/Dashboard/AttendanceChart";
// // import UpcomingClasses from "../../components/Dashboard/UpcomingClasses";

// // import { useAuth } from "../../contexts/AuthContext";
// // import "./CoordinatorDashboard.css";

// // export default function CoordinatorDashboard() {
// //   const { user } = useAuth();
// //   const token = user?.token;

// //   const API = process.env.REACT_APP_BACKEND_API_URL;

// //   // REAL DATA STATES
// //   const [students, setStudents] = useState([]);
// //   const [batches, setBatches] = useState([]);
// //   const [timetable, setTimetable] = useState([]);

// //   const axiosConfig = () => ({
// //     headers: { Authorization: `Bearer ${token}` },
// //   });

// //   /* ===========================================================
// //      FETCH REAL DATA
// //   ============================================================ */
// //   useEffect(() => {
// //     if (!token) return;

// //     Promise.all([
// //       axios.get(`${API}/api/coordinator/students`, axiosConfig()),
// //       axios.get(`${API}/api/coordinator/batches`, axiosConfig()),
// //     ])
// //       .then(([studentsRes, batchesRes]) => {
// //         setStudents(studentsRes.data || []);
// //         setBatches(batchesRes.data || []);
// //       })
// //       .catch((err) => console.error("Dashboard Fetch Error:", err));
// //   }, [token]);

// //   /* ===========================================================
// //      FETCH TIMETABLE (for first active batch)
// //   ============================================================ */
// //   useEffect(() => {
// //     if (!token) return;
// //     if (!batches.length) return;

// //     const activeBatch =
// //       batches.find((b) => b.is_active || b.active) || batches[0];

// //     axios
// //       .get(`${API}/api/coordinator/timetable`, {
// //         ...axiosConfig(),
// //         params: { batchId: activeBatch.batch_id },
// //       })
// //       .then(({ data }) => setTimetable(data || []))
// //       .catch((err) => console.error("Timetable Fetch Error:", err));
// //   }, [token, batches]);

// //   /* ===========================================================
// //      COMPUTED VALUES
// //   ============================================================ */

// //   const totalStudents = students.length;
// //   const activeBatches = batches.filter((b) => b.is_active || b.active).length;

// //   const avgAttendance = "—"; // If needed, can compute from attendance API
// //   const pendingFollowups = "—"; // future feature

// //   // Today's timetable
// //   const todayClasses = useMemo(() => {
// //     const weekday = new Date()
// //       .toLocaleDateString("en-US", { weekday: "long" })
// //       .toUpperCase();
// //     return timetable.filter(
// //       (t) => (t.day_of_week || "").toUpperCase() === weekday
// //     );
// //   }, [timetable]);

// //   /* ===========================================================
// //      STATS DATA FOR CARDS
// //   ============================================================ */

// //   const stats = [
// //     {
// //       name: "Total Students",
// //       value: totalStudents,
// //       change: "",
// //       changeType: "increase",
// //       icon: Users,
// //     },
// //     {
// //       name: "Active Batches",
// //       value: activeBatches,
// //       change: "",
// //       changeType: "increase",
// //       icon: BookOpen,
// //     },
// //     {
// //       name: "Today's Classes",
// //       value: todayClasses.length,
// //       change: "",
// //       changeType: "increase",
// //       icon: Calendar,
// //     },
// //     {
// //       name: "Pending Follow-ups",
// //       value: pendingFollowups,
// //       change: "",
// //       changeType: "decrease",
// //       icon: AlertCircle,
// //     },
// //   ];

// //   return (
// //     <div className="dashboard-container">
// //       {/* HEADER */}
// //       <div className="dashboard-header">
// //         <h1>Welcome back, {user?.username || "Coordinator"}!</h1>
// //         <p>Here's what's happening with your batches today.</p>
// //       </div>

// //       {/* SUMMARY STATS */}
// //       <div className="stats-grid">
// //         {stats.map((stat) => (
// //           <StatsCard key={stat.name} {...stat} />
// //         ))}
// //       </div>

// //       {/* CHART + UPCOMING CLASSES */}
// //       <div className="main-grid">
// //         <div className="chart-section">
// //           <AttendanceChart />
// //         </div>

// //         <div className="classes-section">
// //           <UpcomingClasses classes={todayClasses} />
// //         </div>
// //       </div>

// //       {/* RECENT ACTIVITY + QUICK ACTIONS */}
// //       <div className="bottom-grid">
// //         <RecentActivity />

// //         <div className="quick-actions">
// //           <h3>Quick Actions</h3>

// //           <div className="actions-grid">
// //             <button className="action-btn blue">
// //               <Calendar className="icon" />
// //               <p>Mark Attendance</p>
// //             </button>

// //             <button className="action-btn green">
// //               <Users className="icon" />
// //               <p>View Students</p>
// //             </button>

// //             <button className="action-btn purple">
// //               <BookOpen className="icon" />
// //               <p>Upload Notes</p>
// //             </button>

// //             <button className="action-btn orange">
// //               <Clock className="icon" />
// //               <p>View Timetable</p>
// //             </button>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


// import React, { useEffect, useState, useMemo } from "react";
// import axios from "axios";
// import {
//   Users,
//   Calendar,
//   TrendingUp,
//   AlertCircle,
//   BookOpen,
//   Clock,
//   GraduationCap,
//   LayoutGrid,
//   Target,
//   Filter,
//   Activity,
//   User,
//   Info
// } from "lucide-react";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   ResponsiveContainer,
//   Tooltip,
// } from "recharts";

// import StatsCard from "../../components/Dashboard/StatsCard";
// import RecentActivity from "../../components/Dashboard/RecentActivity";
// import AttendanceChart from "../../components/Dashboard/AttendanceChart";
// import UpcomingClasses from "../../components/Dashboard/UpcomingClasses";

// import { useAuth } from "../../contexts/AuthContext";
// import "./CoordinatorDashboard.css";

// /* ===========================================================
//     SUB-COMPONENT: SIMPLE RAINBOW GAUGE (Cohort Matrix)
//    =========================================================== */
// const AttendanceGauge = ({ value, batchName, classesHeld }) => {
//   const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
//   const percentage = Math.min(Math.max(parseFloat(value) || 0, 0), 100);

//   return (
//     <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center relative overflow-hidden group hover:shadow-md transition-all">
//       <div className="absolute top-0 right-0 bg-slate-50 px-3 py-1 rounded-bl-xl border-b border-l border-slate-100">
//         <p className="text-[8px] font-black text-slate-400 uppercase">{classesHeld} Sessions</p>
//       </div>
//       <h4 className="text-[10px] font-black text-slate-400 mb-4 truncate w-full text-center uppercase tracking-widest mt-2">
//         {batchName}
//       </h4>
//       <div style={{ width: "100%", height: "90px", position: "relative" }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <PieChart>
//             <Pie
//               data={[{v:1},{v:1},{v:1},{v:1},{v:1}]} cx="50%" cy="100%" startAngle={180} endAngle={0}
//               innerRadius="70%" outerRadius="90%" paddingAngle={3} dataKey="v" stroke="none"
//             >
//               {COLORS.map((c, i) => <Cell key={i} fill={c} opacity={0.1} />)}
//             </Pie>
//             <Pie
//               data={[{ v: percentage }, { v: 100 - percentage }]}
//               cx="50%" cy="100%" startAngle={180} endAngle={180 - (percentage * 1.8)}
//               innerRadius="70%" outerRadius="100%" stroke="none" dataKey="v"
//             >
//               <Cell fill={percentage > 85 ? "#22c55e" : percentage > 70 ? "#84cc16" : "#ef4444"} />
//               <Cell fill="transparent" />
//             </Pie>
//           </PieChart>
//         </ResponsiveContainer>
//         <div className="absolute bottom-0 left-0 right-0 flex justify-center">
//           <span className="text-2xl font-black text-slate-800 leading-none">{Math.round(percentage)}%</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ===========================================================
//     MAIN COORDINATOR DASHBOARD
//    =========================================================== */
// export default function CoordinatorDashboard() {
//   const { user } = useAuth();
//   const token = user?.token;
//   const API = process.env.REACT_APP_BACKEND_API_URL;

//   // DATA STATES
//   const [students, setStudents] = useState([]);
//   const [batches, setBatches] = useState([]);
//   const [timetable, setTimetable] = useState([]);
//   const [globalAttendance, setGlobalAttendance] = useState([]);
//   const [subjectStats, setSubjectStats] = useState([]);
//   const [selectedBatchForSubjects, setSelectedBatchForSubjects] = useState("");
//   const [hoveredSubject, setHoveredSubject] = useState(null); // Interactive State

//   const axiosConfig = () => ({
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   const SUBJECT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

//   /* --- FETCH INITIAL DATA --- */
//   useEffect(() => {
//     if (!token) return;

//     Promise.all([
//       axios.get(`${API}/api/coordinator/students`, axiosConfig()),
//       axios.get(`${API}/api/coordinator/batches`, axiosConfig()),
//       axios.get(`${API}/api/coordinator/reports/global-attendance`, axiosConfig()),
//     ])
//       .then(([studentsRes, batchesRes, attendanceRes]) => {
//         setStudents(studentsRes.data || []);
//         const batchList = batchesRes.data || [];
//         setBatches(batchList);
//         setGlobalAttendance(attendanceRes.data || []);
        
//         if (batchList.length > 0) setSelectedBatchForSubjects(batchList[0].batch_id);
//       })
//       .catch((err) => console.error("Dashboard Fetch Error:", err));
//   }, [token]);

//   /* --- FETCH SUBJECT-WISE NESTED RAINBOW DATA --- */
//   useEffect(() => {
//     if (!token || !selectedBatchForSubjects) return;
//     axios.get(`${API}/api/coordinator/reports/teacher-subject-stats`, {
//       ...axiosConfig(),
//       params: { batchId: selectedBatchForSubjects }
//     }).then(res => setSubjectStats(Array.isArray(res.data) ? res.data : []))
//       .catch(err => console.error("Subject Stats Error:", err));
//   }, [selectedBatchForSubjects, token]);

//   /* --- FETCH TIMETABLE --- */
//   useEffect(() => {
//     if (!token || !batches.length) return;
//     const activeBatch = batches.find((b) => b.is_active || b.active) || batches[0];

//     axios.get(`${API}/api/coordinator/timetable`, {
//       ...axiosConfig(),
//       params: { batchId: activeBatch.batch_id },
//     })
//       .then(({ data }) => setTimetable(data || []))
//       .catch((err) => console.error("Timetable Fetch Error:", err));
//   }, [token, batches]);

//   // COMPUTED VALUES
//   const totalStudents = students.length;
//   const activeBatchesCount = batches.filter((b) => b.is_active || b.active).length;
  
//   const systemAvg = useMemo(() => {
//     if (globalAttendance.length === 0) return "0.00";
//     const total = globalAttendance.reduce((acc, c) => acc + parseFloat(c.cohort_avg), 0);
//     return (total / globalAttendance.length).toFixed(2);
//   }, [globalAttendance]);

//   const todayClasses = useMemo(() => {
//     const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
//     return timetable.filter((t) => (t.day_of_week || "").toUpperCase() === weekday);
//   }, [timetable]);

//   const stats = [
//     { name: "Total Students", value: totalStudents, icon: Users },
//     { name: "Active Batches", value: activeBatchesCount, icon: BookOpen },
//     { name: "Today's Classes", value: todayClasses.length, icon: Calendar },
//     { name: "System Month Avg", value: `${systemAvg}%`, icon: TrendingUp },
//   ];

//   return (
//     <div className="dashboard-container p-6 bg-[#f8fafc] min-h-screen">
//       {/* HEADER */}
//       <div className="dashboard-header mb-8">
//         <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, {user?.username || "Coordinator"}!</h1>
//         <p className="text-slate-500 font-medium flex items-center gap-2">
//           <Activity size={16} className="text-indigo-600" /> Current Performance Overview
//         </p>
//       </div>

//       {/* SUMMARY STATS */}
//       <div className="stats-grid mb-10">
//         {stats.map((stat) => (
//           <StatsCard key={stat.name} {...stat} />
//         ))}
//       </div>

//       {/* NESTED SUBJECT RAINBOW (Detailed Batch Analysis) */}
//       <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm mb-12 relative overflow-hidden">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 relative z-10">
//           <div className="flex items-center gap-4">
//             <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
//               <LayoutGrid size={24} />
//             </div>
//             <div>
//               <h2 className="text-xl font-black text-slate-800 tracking-tight">Subject Performance</h2>
//               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Concentric Hover Analysis</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-3 bg-slate-100/50 p-2 rounded-2xl border border-slate-200">
//             <Filter size={16} className="text-slate-400 ml-2" />
//             <select 
//               className="bg-transparent border-none text-xs font-black text-slate-700 focus:ring-0 cursor-pointer uppercase pr-8"
//               value={selectedBatchForSubjects}
//               onChange={(e) => setSelectedBatchForSubjects(e.target.value)}
//             >
//               {batches?.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_name}</option>)}
//             </select>
//           </div>
//         </div>

//         <div className="flex flex-col xl:flex-row justify-center items-center relative min-h-[350px] z-10">
          
//           {/* CENTER DISPLAY: REVEAL ON HOVER */}
//           <div className="absolute top-[60%] left-1/2 -translate-x-1/2 text-center pointer-events-none transition-all duration-300">
//             {hoveredSubject ? (
//               <div className="animate-in fade-in zoom-in duration-300">
//                 <p className="text-5xl font-black text-slate-900 leading-none">{hoveredSubject.percentage}%</p>
//                 <div className="mt-4 bg-indigo-600 text-white px-4 py-1.5 rounded-full inline-block shadow-lg">
//                   <span className="text-[11px] font-black uppercase tracking-widest">{hoveredSubject.subject_code}</span>
//                 </div>
//                 <p className="text-sm font-bold text-slate-500 mt-4 flex items-center justify-center gap-2 uppercase tracking-tight">
//                   <User size={16} className="text-indigo-500" /> {hoveredSubject.teacher_name}
//                 </p>
//               </div>
//             ) : (
//               <div className="text-slate-200 flex flex-col items-center gap-3 opacity-60">
//                 <Info size={44} />
//                 <p className="text-[11px] font-black uppercase tracking-[0.25em]">Move cursor on rainbow</p>
//               </div>
//             )}
//           </div>

//           <div style={{ width: "500px", height: "300px" }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 {subjectStats?.map((entry, index) => {
//                   const percentage = parseFloat(entry.percentage);
//                   const inner = 100 - (index * 13);
//                   const outer = inner + 9;
//                   return (
//                     <Pie
//                       key={entry.subject_code}
//                       data={[{ value: percentage }, { value: 100 - percentage }]}
//                       cx="50%" cy="100%"
//                       startAngle={180} endAngle={180 - (percentage * 1.8)}
//                       innerRadius={`${inner}%`} outerRadius={`${outer}%`}
//                       stroke="none" dataKey="value"
//                       onMouseEnter={() => setHoveredSubject(entry)}
//                       onMouseLeave={() => setHoveredSubject(null)}
//                       style={{ cursor: 'pointer', outline: 'none' }}
//                     >
//                       <Cell 
//                         fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]} 
//                         className="transition-opacity hover:opacity-100 opacity-80"
//                       />
//                       <Cell fill="#f1f5f9" />
//                     </Pie>
//                   );
//                 })}
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* PERSISTENT LEGEND (Functionality maintained as per your data list) */}
//         <div className="flex justify-center flex-wrap gap-8 mt-4 border-t border-slate-50 pt-8">
//            {subjectStats?.map((item, index) => (
//              <div key={item.subject_code} className="flex items-center gap-2">
//                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }}></div>
//                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.subject_code}</span>
//              </div>
//            ))}
//         </div>
//       </div>

//       {/* COHORT MATRIX */}
//       <div className="space-y-10 mb-12">
//         <div className="flex items-center gap-2 px-1">
//           <GraduationCap className="text-indigo-600" size={24} />
//           <h2 className="text-xl font-black text-slate-800 tracking-tight">Cohort Attendance Rainbows</h2>
//         </div>
        
//         {globalAttendance?.map((cohort) => (
//           <div key={cohort.cohort_number} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
//             <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600/10"></div>
//             <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
//               <div>
//                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">{cohort.cohort_name}</h2>
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly Batch Performance</p>
//               </div>
//               <div className="bg-indigo-50 px-6 py-2 rounded-2xl text-right">
//                  <p className="text-2xl font-black text-indigo-600">{cohort.cohort_avg}%</p>
//                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Cohort Avg</p>
//               </div>
//             </div>
            
//             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
//               {cohort.batches?.map((batch, idx) => (
//                 <AttendanceGauge 
//                   key={idx} 
//                   batchName={batch.batch_name} 
//                   value={batch.avg} 
//                   classesHeld={batch.classes_held} 
//                 />
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* CHART + UPCOMING CLASSES (Functionality Maintained) */}
//       <div className="main-grid">
//         <div className="chart-section bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
//           <div className="flex items-center gap-2 mb-4">
//              <TrendingUp size={18} className="text-indigo-600" />
//              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Attendance Trends</h3>
//           </div>
//           <AttendanceChart />
//         </div>

//         <div className="classes-section bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
//           <UpcomingClasses classes={todayClasses} />
//         </div>
//       </div>

//       {/* RECENT ACTIVITY + QUICK ACTIONS (Functionality Maintained) */}
//       <div className="bottom-grid mt-8">
//         <RecentActivity />

//         <div className="quick-actions">
//           <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">Quick Actions</h3>

//           <div className="actions-grid">
//             <button className="action-btn blue"><Calendar className="icon" /><p>Mark Attendance</p></button>
//             <button className="action-btn green"><Users className="icon" /><p>View Students</p></button>
//             <button className="action-btn purple"><BookOpen className="icon" /><p>Upload Notes</p></button>
//             <button className="action-btn orange"><Clock className="icon" /><p>View Timetable</p></button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Users,
  Calendar,
  TrendingUp,
  BookOpen,
  Clock,
  Activity,
  Info,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

import StatsCard from "../../components/Dashboard/StatsCard";
import RecentActivity from "../../components/Dashboard/RecentActivity";
import AttendanceChart from "../../components/Dashboard/AttendanceChart";
import UpcomingClasses from "../../components/Dashboard/UpcomingClasses";

import { useAuth } from "../../contexts/AuthContext";
import "./CoordinatorDashboard.css";

/* ===========================================================
    SUB-COMPONENT: SIMPLE RAINBOW GAUGE (Cohort Matrix)
   =========================================================== */
const AttendanceGauge = ({ value, batchName, classesHeld }) => {
  const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
  const percentage = Math.min(Math.max(parseFloat(value) || 0, 0), 100);

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center relative overflow-hidden hover:shadow-md transition-all">
      <div className="absolute top-0 right-0 bg-slate-50 px-3 py-1 rounded-bl-xl border-b border-l border-slate-100">
        <p className="text-[8px] font-black text-slate-400 uppercase">
          {classesHeld} Sessions
        </p>
      </div>

      <h4 className="text-[10px] font-black text-slate-400 mb-4 truncate w-full text-center uppercase tracking-widest mt-2">
        {batchName}
      </h4>

      <div style={{ width: "100%", height: "90px", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[{ v: 1 }, { v: 1 }, { v: 1 }, { v: 1 }, { v: 1 }]}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="90%"
              paddingAngle={3}
              dataKey="v"
              stroke="none"
            >
              {COLORS.map((c, i) => (
                <Cell key={i} fill={c} opacity={0.1} />
              ))}
            </Pie>

            <Pie
              data={[{ v: percentage }, { v: 100 - percentage }]}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={180 - percentage * 1.8}
              innerRadius="70%"
              outerRadius="100%"
              stroke="none"
              dataKey="v"
            >
              <Cell
                fill={
                  percentage > 85
                    ? "#22c55e"
                    : percentage > 70
                    ? "#84cc16"
                    : "#ef4444"
                }
              />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <span className="text-2xl font-black text-slate-800">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};

/* ===========================================================
    MAIN COORDINATOR DASHBOARD
   =========================================================== */
export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const token = user?.token;
  const API = process.env.REACT_APP_BACKEND_API_URL;

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [globalAttendance, setGlobalAttendance] = useState([]);

  const axiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  /* --- FETCH INITIAL DATA --- */
  useEffect(() => {
    if (!token) return;

    Promise.all([
      axios.get(`${API}/api/coordinator/students`, axiosConfig()),
      axios.get(`${API}/api/coordinator/batches`, axiosConfig()),
      axios.get(`${API}/api/coordinator/reports/global-attendance`, axiosConfig()),
    ])
      .then(([studentsRes, batchesRes, attendanceRes]) => {
        setStudents(studentsRes.data || []);
        setBatches(batchesRes.data || []);
        setGlobalAttendance(attendanceRes.data || []);
      })
      .catch((err) => console.error("Dashboard Fetch Error:", err));
  }, [token]);

  /* --- FETCH TIMETABLE --- */
  useEffect(() => {
    if (!token || !batches.length) return;
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

  /* --- COMPUTED VALUES --- */
  const totalStudents = students.length;
  const activeBatchesCount = batches.filter(
    (b) => b.is_active || b.active
  ).length;

  const systemAvg = useMemo(() => {
    if (!globalAttendance.length) return "0.00";
    const total = globalAttendance.reduce(
      (acc, c) => acc + parseFloat(c.cohort_avg),
      0
    );
    return (total / globalAttendance.length).toFixed(2);
  }, [globalAttendance]);

  const todayClasses = useMemo(() => {
    const weekday = new Date()
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();
    return timetable.filter(
      (t) => (t.day_of_week || "").toUpperCase() === weekday
    );
  }, [timetable]);

  const stats = [
    { name: "Total Students", value: totalStudents, icon: Users },
    { name: "Active Batches", value: activeBatchesCount, icon: BookOpen },
    { name: "Today's Classes", value: todayClasses.length, icon: Calendar },
    { name: "System Month Avg", value: `${systemAvg}%`, icon: TrendingUp },
  ];

  return (
    <div className="dashboard-container p-6 bg-[#f8fafc] min-h-screen">
      {/* HEADER */}
      <div className="dashboard-header mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome back, {user?.username || "Coordinator"}!
        </h1>
        <p className="text-slate-500 font-medium flex items-center gap-2">
          <Activity size={16} className="text-indigo-600" />
          Current Performance Overview
        </p>
      </div>

      {/* VERSION NOTICE */}
      <div className="mb-8 flex items-start gap-3 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-xl">
        <Info size={18} className="mt-0.5 text-indigo-600" />
        <p className="text-sm font-medium">
          This file will be visible soon in <strong>Version 02</strong>.
          Currently, this feature has not been implemented.
        </p>
      </div>

      {/* SUMMARY STATS */}
      <div className="stats-grid mb-10">
        {stats.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* CHART + UPCOMING CLASSES */}
      <div className="main-grid">
        <div className="chart-section bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">
              Attendance Trends
            </h3>
          </div>
          <AttendanceChart />
        </div>

        <div className="classes-section bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <UpcomingClasses classes={todayClasses} />
        </div>
      </div>

      {/* RECENT ACTIVITY + QUICK ACTIONS */}
      <div className="bottom-grid mt-8">
        <RecentActivity />

        <div className="quick-actions">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-4">
            Quick Actions
          </h3>

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
