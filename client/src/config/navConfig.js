  import { Children } from "react";

  // navConfig.js
  export const navConfig = {
    admin: [
      { path: '/admin/admin-dashboard', label: 'Dashboard', icon: '📊' },
      {
        label: 'Admissions',
        icon: '📂',
        children: [
          // { path: '/admin/admissions/new-application', label: 'New Application', icon: '📝' },
          // { path: '/admin/admissions/bulk-upload-applications', icon: '📁', label: 'Bulk Upload Applications' },
          // { path: '/admin/admissions/search-applications', icon: '🔍', label: 'Search Applications' },
          { path: "/admin/admissions/applications", icon: "📄", label: "Applications" },
          { path: "/admin/admissions/shortlisting", icon: "📜", label: "Shortlisting" },
          { path: "/admin/admissions/exam-management", icon: "🏫", label: "Exam Centers & Scheduling" },
          { path: "/admin/admissions/evaluation", icon: " 📈", label: "Applications Evaluation" },
          { path: "/admin/admissions/results", icon: " 📉", label: "Final Results & Rankings" },
        ],
      },
      { 
        label: 'Academics', 
        icon: '📚', 
        children: [
          { path: "/admin/academics/students", icon: "👥", label: "Students" },
          { path: "/admin/academics/teachers", icon: "👨‍🏫", label: "Teachers" },
          { path: "/admin/academics/batch-coordinators", icon: "👨", label: "Batch Coordinators" },
        ],
      },
      {
        label: 'Settings',
        icon: '⚙️',
        children: [
          { path: "/admin/settings/profile", icon: "👤", label: "Profile" },
          { path: "/admin/settings/user-management", icon: "🔔", label: "User Management" },
          { path: "/admin/settings/preferences", icon: "⚙️", label: "Preferences" },
        ],
      },
      { path: "/", icon: "🚪", label: "Logout" },
    ],
    coordinator: [
      { path: '/coordinator/coordinator-dashboard', label: 'Dashboard', icon: '📊' },
      { path: "/coordinator/view-applications", icon: "🔍", label: "View Applications" },
      { path: "/coordinator/batch-management", icon: "📘", label: "Batch Management" },
      { path: "/coordinator/batch-reports", icon: "📈", label: "Batch Reports" },
      { path: "/", icon: "🚪", label: "Logout" },
    ],
    student: [
      { path: '/student/student-dashboard', label: 'Dashboard', icon: '📊' },
      { path: "/student/student-profile", icon: "👤", label: "Profile" },
      { path: "/student/attendance", icon: "📅", label: "Attendance" },
      { path: "/student/issues", icon: "🛠️", label: "Report Issue" },
      { path: "/student/notes-leave", icon: "📚", label: "Notes & Leave" },
      { path: "/student/exams", icon: "📝", label: "Exam Updates" },
      { path: "/", icon: "🚪", label: "Logout" },
    ],
    teacher: [
      { path: '/teacher/teacher-dashboard', label: 'Dashboard', icon: '📊' },
      { path: "/teacher/students-list", icon: "👥", label: "Students List" },
      { path: "/teacher/assigned-batches", icon: "📋", label: "Assigned Batches" },
      { path: "/teacher/time-table", icon: "🗓️", label: "Time Table" },
      { path: "/", icon: "🚪", label: "Logout" },
    ],
  };
