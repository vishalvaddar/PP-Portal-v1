import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import ViewApplications from "./pages/ViewApplications";
import UploadApplications from "./pages/UploadApplications";
import BulkUploadApplications from "./pages/BulkUploadApplications";
import NewApplication from "./pages/NewApplication";
import Shortlisting from "./pages/Shortlisting";
import ScreeningTests from "./pages/ScreeningTests";
// import UpdateNewApplication from "./pages/NewApplication";
import CreateExam from './pages/CreateExam';
import CreateCriteria from "./pages/CreateCriteria";
import GenerateShortlist from "./pages/GenerateShortlist";
import SearchApplications from "./pages/SearchApplications";
import EditForm from "./pages/EditForm";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Layout with Navbar, Header, Footer
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/upload-applications", element: <UploadApplications /> },
      { path: "/new-application", element: <NewApplication /> },
      { path: "/bulk-upload-applications", element: <BulkUploadApplications /> },
      { path: "/search-applications", element: <SearchApplications /> },
      { path: "/view-applications", element: <ViewApplications /> },
      { path: "/shortlisting", element: <Shortlisting /> },
      { path: "/create-shortlisting-criteria", element:<CreateCriteria/>},
      {path: "/generate-shortlist", element:<GenerateShortlist/>},
      { path: "/screening-tests", element: <ScreeningTests /> },
      { path: "/Create-Exams", element: <CreateExam />},
      {path: "/edit-form/:nmms_reg_number", element: <EditForm /> }
    ],
  },
]);
