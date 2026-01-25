import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from './components/ProtectedRoute';
import Layout from "./Layout";
import LoginForm from "./components/login/LoginForm";

// --- Admin pages ---
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
import ClassroomManager from "./pages/Admin/ClassroomManager";
import CustomList from "./pages/Admin/Reports/CustomList";

// Admin Evaluation
import EvaluationDashboard from "./pages/Admin/Evaluation/EvaluationDashboard";
import EvaluationMarksEntry from "./pages/Admin/Evaluation/EvaluationMarksEntry";
import EvaluationInterview from "./pages/Admin/Evaluation/EvaluationInterview";
import EvaluationTracking from "./pages/Admin/Evaluation/EvaluationTracking";
import Resultandrank from "./pages/Admin/Result/Resultandranking";

// Events
import Events from "./pages/Admin/Events/EventsDashboardPage";
import EventDetailsPage from "./pages/Admin/Events/EventDetailsPage";
import EventEditPage from "./pages/Admin/Events/EventEditPage";

// --- Coordinator pages ---
import CoordinatorDashboard from "./pages/Coordinator/CoordinatorDashboard";
import ViewApplication from "./pages/Coordinator/ViewApplication";
import BatchManagement from "./pages/Coordinator/BatchManagement";
import BatchReports from "./pages/Coordinator/BatchReports";
import AttendanceTracker from "./pages/Coordinator/AttendanceTracker";
import CoordinatorTimeTable from "./pages/Coordinator/TimeTableManagement";

// --- Teacher pages ---
import TeacherDashboard from "./pages/Teacher/TeacherDashboard";
import StudentsList from "./pages/Teacher/StudentsList";
import AssignedBatches from "./pages/Teacher/AssignedBatches";
import TeacherTimeTable from "./pages/Teacher/TimeTable";

// --- Student pages ---
import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentProfile from "./pages/Student/StudentProfile";
import StudentCorner from "./pages/Student/StudentCorner";

// --- Interviewer pages ---
import InterviewerDashboard from "./pages/Interviewer/InterviewerDashboard";
import InterviewSchedule from "./pages/Interviewer/InterviewSchedule";
import InterviewFeedback from "./pages/Interviewer/InterviewFeedback";

import LogoutHandler from "./components/LogoutHandler";


export const appRouter = createBrowserRouter([
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/admin/admin-dashboard" replace /> },

      // ---------------- Admin Routes ----------------
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
              { path: "edit-form/:nmms_reg_number", element: <EditForm /> },
              { path: "results", element: <Resultandrank /> },

              // Evaluation Sub-Routes
              {
                path: "evaluation",
                children: [
                  { path: "", element: <EvaluationDashboard /> },
                  { path: "marks-entry", element: <EvaluationMarksEntry /> },
                  { path: "interview", element: <EvaluationInterview /> },
                  { path: "tracking", element: <EvaluationTracking /> }
                ]
              }
            ]
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
              { path: "reports/custom-lists", element: <CustomList /> },
              { path: "classrooms", element: <ClassroomManager /> },

              // EVENTS
              { path: "events", element: <Events /> },
              { path: "events/:eventId", element: <EventDetailsPage /> },
              { path: "events/:eventId/edit", element: <EventEditPage /> },
            ],
          },

          {
            path: "settings",
            children: [
              { path: "my-profile", element: <MyProfile /> },
              { path: "user-roles", element: <UserRoles /> },
              { path: "system", element: <SystemConfig /> },
            ],
          },
        ],
      },

      // ---------------- Coordinator Routes ----------------
      {
        path: "coordinator",
        element: <Layout />,
        children: [
          { path: "coordinator-dashboard", element: <CoordinatorDashboard /> },
          { path: "view-application", element: <ViewApplication /> },
          { path: "batch-management", element: <BatchManagement /> },
          { path: "batch-reports", element: <BatchReports /> },
          { path: "attendance-tracker", element: <AttendanceTracker /> },
          { path: "time-table", element: <CoordinatorTimeTable /> },
        ]
      },

      // ---------------- Student Routes ----------------
      {
        path: "student",
        element: <Layout />,
        children: [
          { path: "student-dashboard", element: <StudentDashboard /> },
          { path: "student-profile", element: <StudentProfile /> },
          { path: "student-corner", element: <StudentCorner /> }
        ]
      },

      // ---------------- Teacher Routes ----------------
      {
        path: "teacher",
        element: <Layout />,
        children: [
          { path: "teacher-dashboard", element: <TeacherDashboard /> },
          { path: "students-list", element: <StudentsList /> },
          { path: "assigned-batches", element: <AssignedBatches /> },
          { path: "time-table", element: <TeacherTimeTable /> }
        ]
      },

      // ---------------- Interviewer Routes ----------------
      {
        path: "interviewer",
        element: <Layout />,
        children: [
          { path: "interviewer-dashboard", element: <InterviewerDashboard /> },
          { path: "interview-schedule", element: <InterviewSchedule /> },
          { path: "interview-feedback", element: <InterviewFeedback /> }
        ]
      },

      // Logout
      { path: "logout", element: <LogoutHandler /> },

      // 404
      { path: "*", element: <div>404 - Page Not Found</div> }
    ]
  }
]);
