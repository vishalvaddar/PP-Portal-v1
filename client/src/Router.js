import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";

// Admin pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import NewApplication from "./pages/Admin/NewApplication";
import BulkUploadApplications from "./pages/Admin/BulkUploadApplications";
import SearchApplications from "./pages/Admin/SearchApplications";
import Shortlisting from "./pages/Admin/Shortlisting";
import ViewApplications from "./pages/Admin/ViewApplications";
import Evaluation from "./pages/Admin/Evaluation";
import LoginForm from "./components/login/LoginForm";
import ViewStudentInfo from "./pages/Admin/ViewStudentInfo";
import EditForm from "./pages/Admin/EditForm";
import GenerateShortlist from "./pages/Admin/GenerateShortlist";
import ShortlistInfo from "./pages/Admin/ShortlistInfo";
import Students from "./pages/Admin/Students";
import Batches from "./pages/Admin/Batches";
import UserRoles from "./pages/Admin/UserRoles";
import System from "./pages/Admin/System";
import MyProfile from "./pages/Admin/MyProfile";
// import ExamManagement from "./pages/Admin/ExamManagement";
// import Results from "./pages/Admin/Results";

// Coordinator pages
import CoordinatorDashboard from "./pages/Coordinator/CoordinatorDashboard";
import ViewApplication from "./pages/Coordinator/ViewApplication";
import BatchManagement from "./pages/Coordinator/BatchManagement";
import BatchReports from "./pages/Coordinator/BatchReports";

//Teacher pages
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import StudentsList from "./pages/Teacher/StudentsList";
import AssignedBatches from "./pages/Teacher/AssignedBatches";
import TimeTable from "./pages/Teacher/TimeTable";

// Student pages
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentProfile from "./pages/Student/StudentProfile";
import Applications from "./pages/Admin/Applications";
// import Attendance from "./pages/Student/Attendance";
// import Issues from "./pages/Student/Issues";
// import NotesLeave from "./pages/Student/NotesLeave";
// import Exams from "./pages/Student/Exams";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <LoginForm />,
  },
  {
    path: "/admin",
    element: <Layout />,
    children: [
      { path: "admin-dashboard", element: <AdminDashboard /> },
      {
        path: "admissions",
        children: [
          { path: "new-application", element: <NewApplication /> },
          { path: "bulk-upload-applications", element: <BulkUploadApplications /> },
          { path: "search-applications", element: <SearchApplications /> },
          { path: "applications", element: <Applications /> },
          { path: "shortlisting", element: <Shortlisting /> },
          { path: "generate-shortlist", element: <GenerateShortlist /> },
          { path: "shortlist-info", element: <ShortlistInfo /> },
          { path: "shortlisting", element: <Shortlisting /> },
          { path: "view-student-info/:nmms_reg_number", element: <ViewStudentInfo /> },
          { path: "evaluation", element: <Evaluation /> },
          { path: "view-applications", element: <ViewApplications /> },
          { path: "edit-form/:nmms_reg_number", element: <EditForm /> },
        ],
      },
      { path: "academics", children: [
          { path: "students", element: <Students /> },
          // { path: "teachers", element: <Teachers /> },
          { path: "batches", element: <Batches /> },
        ]
      },
      { path: "settings", children: [
        { path: "my-profile", element: <MyProfile /> },
        { path: "user-roles", element: <UserRoles /> },
        { path: "system", element: <System /> },
      ]},
      // { path: "exam-management", element: <ExamManagement /> },
      // { path: "results", element: <Results /> },
    ],
  },
  {
    path: "/coordinator",
    element: <Layout />,
    children: [
      { path: "coordinator-dashboard", element: <CoordinatorDashboard /> },
      { path: "view-applications", element: <ViewApplications /> },
      { path: "batch-management", element: <BatchManagement /> },
      { path: "batch-reports", element: <BatchReports /> },
    ],
  },
  {
    path: "/student",
    element: <Layout />,
    children: [
      { path: "student-dashboard", element: <StudentDashboard /> },
      { path: "student-profile", element: <StudentProfile /> },
      // { path: "attendance", element: <Attendance /> },
      // { path: "issues", element: <Issues /> },
      // { path: "notes-leave", element: <NotesLeave /> },
      // { path: "exams", element: <Exams /> },
    ],
  },
  {
    path: "/teacher",
    element: <Layout />,
    children: [
      { path: "teacher-dashboard", element: <TeacherDashboard /> },
      { path: "students-list", element: <StudentsList /> },
      { path: "assigned-batches", element: <AssignedBatches /> },
      { path: "time-table", element: <TimeTable /> },
    ],
  },
  {
    path: "*",
    element: <div>404 - Page Not Found</div>,
  },
]);

export const sidebarLinks = [
  {
    title: "Applications",
    icon: "📝",
    submenu: true,
    submenuItems: [
      {
        title: "Dashboard",
        path: "/applications/admin-dashboard"
      },
      {
        title: "New Application",
        path: "/applications/new-application"
      },
      {
        title: "Bulk Upload",
        path: "/applications/bulk-upload-applications"
      }
    ]
  }
];
