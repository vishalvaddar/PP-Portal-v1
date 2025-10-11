// App.js
import React from "react";
import { RouterProvider } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SystemConfigProvider } from "./contexts/SystemConfigContext";
import { appRouter } from "../src/Router";

function ProtectedApp() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please login first</div>;
  }

  return (
      <SystemConfigProvider>
        <RouterProvider router={appRouter} />
      </SystemConfigProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App;
