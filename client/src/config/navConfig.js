// navConfig.js
import {
  Dashboard,
  School,
  Description,
  FactCheck,
  Event,
  Grading,
  EmojiEvents,
  MenuBook,
  Group,
  SupervisorAccount,
  Badge,
  Settings,
  AccountCircle,
  ManageAccounts,
  Tune,
  Logout,
  Plagiarism,
  GroupWork,
  Assessment,
  CoPresent,
  BugReport,
  NoteAlt,
  Quiz,
  AssignmentInd,
  Schedule,
} from '@mui/icons-material';

export const navConfig = {
  admin: [
    { path: '/admin/admin-dashboard', label: 'Dashboard', icon: <Dashboard /> },
    {
      label: 'Admissions',
      icon: <School />,
      children: [
        { path: "/admin/admissions/applications", icon: <Description />, label: "Applications" },
        { path: "/admin/admissions/shortlisting", icon: <FactCheck />, label: "Shortlisting" },
        { path: "/admin/admissions/exam-management", icon: <Event />, label: "Exam Centers & Scheduling" },
        { path: "/admin/admissions/evaluation", icon: <Grading />, label: "Applications Evaluation" },
        { path: "/admin/admissions/results", icon: <EmojiEvents />, label: "Final Results & Rankings" },
      ],
    },
    {
      label: 'Academics',
      icon: <MenuBook />,
      children: [
        { path: "/admin/academics/students", icon: <Group />, label: "Students" },
        // Uncomment below if teachers page is needed later
        // { path: "/admin/academics/teachers", icon: <SupervisorAccount />, label: "Teachers" },
        { path: "/admin/academics/batches", icon: <Badge />, label: "Batches" },
        { path: "/admin/academics/reports", icon: <Assessment />, label: "Reports"},
      ],
    },
    {
      label: 'System-Settings',
      icon: <Settings />,
      children: [
        { path: "/admin/settings/my-profile", icon: <AccountCircle />, label: "My Profile" },
        { path: "/admin/settings/user-roles", icon: <ManageAccounts />, label: "Users & Roles" },
        { path: "/admin/settings/system", icon: <Tune />, label: "System" },
      ],
    },
    { path: "/", icon: <Logout />, label: "Logout" },
  ],

  coordinator: [
    { path: '/coordinator/coordinator-dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: "/coordinator/batch-management", icon: <GroupWork />, label: "Batch Management" },
    { path: "/coordinator/batch-reports", icon: <Assessment />, label: "Batch Reports" },
    { path: "/", icon: <Logout />, label: "Logout" },
  ],

  student: [
    { path: '/student/student-dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: "/student/student-profile", icon: <AccountCircle />, label: "Profile" },
    { path: "/student/student-corner", icon: <NoteAlt />, label: "Student Corner" },
    { path: "/", icon: <Logout />, label: "Logout" },
  ],

  teacher: [
    { path: '/teacher/teacher-dashboard', label: 'Dashboard', icon: <Dashboard /> },
    { path: "/teacher/students-list", icon: <Group />, label: "Students List" },
    { path: "/teacher/assigned-batches", icon: <AssignmentInd />, label: "Assigned Batches" },
    { path: "/teacher/time-table", icon: <Schedule />, label: "Time Table" },
    { path: "/", icon: <Logout />, label: "Logout" },
  ],
};
