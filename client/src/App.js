import React from "react";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./Router"; // Import the router from a separate file

function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
 