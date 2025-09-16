import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute';
import Layout from "./Layout";
import LoginForm from "./components/login/LoginForm";

// Admin pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import Applications from "./pages/Admin/Applications";
import NewApplication from "./pages/Admin/NewApplication";
import BulkUploadApplications from "./pages/Admin/BulkUploadApplications";
import SearchApplications from "./pages/Admin/SearchApplications";
import Shortlisting from "./pages/Admin/Shortlisting";
import ViewApplications from "./pages/Admin/ViewApplications";
import ViewStudentInfo from "./pages/Admin/ViewStudentInfo";
import EditForm from "./pages/Admin/EditForm";
import GenerateShortlist from "./pages/Admin/GenerateShortlist";
import ShortlistInfo from "./pages/Admin/ShortlistInfo";
import Students from "./pages/Admin/Students";
import Batches from "./pages/Admin/Batches";
import ViewBatchStudents from "./pages/Admin/ViewBatchStudents";
import Reports from "./pages/Admin/Reports";
import UserRoles from "./pages/Admin/UserRoles";
import SystemConfig from "./pages/Admin/SystemConfig";
import MyProfile from "./pages/Admin/MyProfile";
import CreateExam from "./pages/Admin/Exam/CreateExam";
import TimeTableDashboard from "./pages/Admin/TimeTableDashboard";

// Admin-Evaluation pages
import EvaluationDashboard from "./pages/Admin/Evaluation/EvaluationDashboard";
import EvaluationMarksEntry from "./pages/Admin/Evaluation/EvaluationMarksEntry";
import EvaluationInterview from "./pages/Admin/Evaluation/EvaluationInterview";
import EvaluationTracking from "./pages/Admin/Evaluation/EvaluationTracking";
import Resultandrank from "./pages/Admin/Result/Resultandranking";

// Coordinator pages
import CoordinatorDashboard from "./pages/Coordinator/CoordinatorDashboard";
import ViewApplication from "./pages/Coordinator/ViewApplication";
import BatchManagement from "./pages/Coordinator/BatchManagement";
import BatchReports from "./pages/Coordinator/BatchReports";

// Teacher pages
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import StudentsList from "./pages/Teacher/StudentsList";
import AssignedBatches from "./pages/Teacher/AssignedBatches";
import TimeTable from "./pages/Teacher/TimeTable";

// Student pages
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentCorner from "./pages/Student/StudentCorner";

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: <LoginForm />,
  },

  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        index: true, 
        element: <Navigate to="/admin/admin-dashboard" replace />,
      },
      // --- Admin Layout and Routes ---
      {
        path: "admin",
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
              { path: "exam-management", element: <CreateExam /> },
              { path: "view-student-info/:nmms_reg_number", element: <ViewStudentInfo /> },
              { path: "view-applications", element: <ViewApplications /> },
              { path: "results", element: <Resultandrank /> },
              { path: "edit-form/:nmms_reg_number", element: <EditForm /> },
              { 
                path: "evaluation", 
                children:[
                  { path: "", element: <EvaluationDashboard />},
                  { path: "marks-entry", element: <EvaluationMarksEntry /> },
                  { path: "interview", element: <EvaluationInterview /> },
                  { path: "tracking", element: <EvaluationTracking /> },
                ],
              },
            ],
          },
          { 
            path: "academics", 
            children: [
              { path: "students", element: <Students /> },
              { path: "batches", element: <Batches /> },
              { path: "batches/:batchId/students", element: <ViewBatchStudents /> },
              { path: "batches/view-student-info/:nmms_reg_number", element: <ViewStudentInfo /> },
              { path: "time-table-dashboard", element: <TimeTableDashboard /> },
              { path: "reports", element: <Reports /> },
            ]
          },
          { 
            path: "settings", 
            children: [
              { path: "my-profile", element: <MyProfile /> },
              { path: "user-roles", element: <UserRoles /> },
              { path: "system", element: <SystemConfig /> },
            ]
          },
        ],
      },
      // --- Coordinator Layout and Routes ---
      {
        path: "coordinator",
        element: <Layout />,
        children: [
          { path: "coordinator-dashboard", element: <CoordinatorDashboard /> },
          { path: "view-application", element: <ViewApplication /> },
          { path: "batch-management", element: <BatchManagement /> },
          { path: "batch-reports", element: <BatchReports /> },
        ],
      },
      // --- Student Layout and Routes ---
      {
        path: "student",
        element: <Layout />,
        children: [
          { path: "student-dashboard", element: <StudentDashboard /> },
          { path: "student-profile", element: <StudentProfile /> },
          { path: "student-corner", element: <StudentCorner /> },
        ],
      },
      // --- Teacher Layout and Routes ---
      {
        path: "teacher",
        element: <Layout />,
        children: [
          { path: "teacher-dashboard", element: <TeacherDashboard /> },
          { path: "students-list", element: <StudentsList /> },
          { path: "assigned-batches", element: <AssignedBatches /> },
          { path: "time-table", element: <TimeTable /> },
        ],
      },
    ],
  },
  
  // --- CATCH-ALL 404 ROUTE ---
  // This should be the last route in the list.
  {
    path: "*",
    element: <div>404 - Page Not Found</div>,
  },
]);

export const sidebarLinks = [
  {
    title: "Dashboard",
    icon: "🏠",
    path: "/admin/admin-dashboard"
  },
  {
    title: "Admissions",
    icon: "📝",
    submenu: true,
    submenuItems: [
      {
        title: "New Application",
        path: "/admin/admissions/new-application" 
      },
      {
        title: "Bulk Upload",
        path: "/admin/admissions/bulk-upload-applications" 
      },
      {
        title: "View Applications",
        path: "/admin/admissions/applications" 
      }
    ]
  }
];