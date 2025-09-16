// App.js
import React from "react";
import { RouterProvider } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import { SystemConfigProvider } from "./contexts/SystemConfigContext"; 
import { appRouter } from "../src/Router";

function ProtectedApp() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please login first</div>;
  }

  return (
    <RoleProvider>
      <SystemConfigProvider>
        <RouterProvider router={appRouter} />
      </SystemConfigProvider>
    </RoleProvider>
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
