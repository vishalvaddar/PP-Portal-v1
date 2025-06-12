// App.js
import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { appRouter } from "../src/Router";

function ProtectedApp() {
  const { user } = useAuth();

  if (!user) {
    return <div>Please login first</div>; // Optional: or redirect manually
  }

  return (
    <RoleProvider>
      <RouterProvider router={appRouter} />
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
