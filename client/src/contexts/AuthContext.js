import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode"; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Check if token is valid and not expired
  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (e) {
      return false;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // 1. Load User on Mount
  useEffect(() => {
    const storedData = localStorage.getItem("user");
    if (storedData) {
      try {
        const parsedUser = JSON.parse(storedData);
        if (parsedUser.token && validateToken(parsedUser.token)) {
          setUser(parsedUser);
        } else {
          logout(); // Token expired or invalid
        }
      } catch (e) {
        logout(); // Data corrupted
      }
    }
    setLoading(false);
  }, [logout]);

  // 2. Auto-Logout Timer
  useEffect(() => {
    if (!user?.token) return;

    try {
      const decoded = jwtDecode(user.token);
      const expiryTime = decoded.exp * 1000;
      const timeoutDuration = expiryTime - Date.now();

      if (timeoutDuration <= 0) {
        logout();
      } else {
        const timer = setTimeout(() => {
          console.log("Session expired. Logging out.");
          logout();
        }, timeoutDuration);
        return () => clearTimeout(timer);
      }
    } catch {
      logout();
    }
  }, [user, logout]);

  const login = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const getToken = useCallback(() => {
    if (user?.token && validateToken(user.token)) {
      return user.token;
    }
    if (user?.token) logout(); // Logout if we try to use an expired token
    return null;
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};