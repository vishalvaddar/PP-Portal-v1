import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define logout BEFORE useEffect to prevent “Cannot access before initialization”
  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Load user from storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.token && isTokenValid(parsed.token)) {
          setUser(parsed);
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  // Auto logout when token expires
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
  }, [user, logout]);

  const login = useCallback(({ token, ...userData }) => {
    const userWithToken = { ...userData, token };
    localStorage.setItem("user", JSON.stringify(userWithToken));
    setUser(userWithToken);
  }, []);

  const updateUserProfile = useCallback(
    (updates) => {
      if (!user) return;
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    [user]
  );

  const getToken = useCallback(
    () => (user?.token && isTokenValid(user.token) ? user.token : null),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, login, logout, getToken, updateUserProfile, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
