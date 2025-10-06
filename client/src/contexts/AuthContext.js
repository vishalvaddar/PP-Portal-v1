import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

// Hook for using Auth context
export const useAuth = () => useContext(AuthContext);

// Validate token expiry
const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
    return payload.exp * 1000 > Date.now(); // exp is in seconds, convert to ms
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return parsed.token && isTokenValid(parsed.token) ? parsed : null;
      }
    } catch (err) {
      console.error("Error parsing stored user:", err);
    }
    return null;
  });

  // ✅ Auto logout if token expires
  useEffect(() => {
    if (!user?.token) return;

    try {
      const payload = JSON.parse(atob(user.token.split(".")[1]));
      const expiryTime = payload.exp * 1000;
      const remainingTime = expiryTime - Date.now();

      if (remainingTime <= 0) {
        logout();
      } else {
        const timer = setTimeout(logout, remainingTime);
        return () => clearTimeout(timer);
      }
    } catch {
      logout();
    }
  }, [user]);

  // ✅ Login
  const login = useCallback(({ token, ...userData }) => {
    const userWithToken = { ...userData, token };
    localStorage.setItem("user", JSON.stringify(userWithToken));
    setUser(userWithToken);
  }, []);

  // ✅ Logout
  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // ✅ Update profile info
  const updateUserProfile = useCallback(
    (updates) => {
      if (!user) return;
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    [user]
  );

  // ✅ Get valid token
  const getToken = useCallback(
    () => (user?.token && isTokenValid(user.token) ? user.token : null),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
