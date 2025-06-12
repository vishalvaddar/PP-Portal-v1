// navConfig.js
export const navConfig = {
  admin: [
    { path: '/admin/admin-dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/new-application', label: 'New Application', icon: '📝' },
    { path: "/admin/bulk-upload-applications" , icon: "📁", label: "Bulk Upload Applications"},
    { path: "/admin/search-applications", icon: "🔍", label: "Search Applications" },
    { path: "/admin/shortlisting", icon: "🎯", label: "Shortlisting" },
    { path: "/admin/exam-management", icon: "🏫", label: "Exam Management" },
    { path: "/admin/screening-tests", icon: "🧪", label: "Screening Tests" },
    { path: "/admin/results", icon: "📈", label: "Results" },
    { path: "/admin/user-management", icon: "👥", label: "User Management" },
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
