import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);

// Utility to validate JWT token expiry
const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now(); // Convert to ms
  } catch (e) {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return isTokenValid(parsed.token) ? parsed : null;
      }
    } catch (err) {
      console.error("Error parsing stored user:", err);
    }
    return null;
  });

  // Login stores user and token
  const login = ({ token, ...userData }) => {
    const userWithToken = { ...userData, token };
    localStorage.setItem("user", JSON.stringify(userWithToken));
    setUser(userWithToken);
  };

  // Logout clears user and localStorage
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // Retrieve current token
  const getToken = () => (user?.token && isTokenValid(user.token) ? user.token : null);

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};
