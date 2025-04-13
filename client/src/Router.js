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
import WithApplication from "./pages/withApplicationForm";
import CreateExam from './pages/CreateExam';
export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Layout with Navbar, Header, Footer
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/upload-applications", element: <UploadApplications /> },
      { path: "/new-application", element: <NewApplication /> },
      { path: "/bulk-upload-applications", element: <BulkUploadApplications /> },
      { path: "/view-applications", element: <ViewApplications /> },
      { path: "/shortlisting", element: <Shortlisting /> },
      { path: "/screening-tests", element: <ScreeningTests /> },
      { path: "/Create-Exams", element: <CreateExam/>},
      {path:"/view-applications/:id",element:<WithApplication/>}
    ],
  },
]);
