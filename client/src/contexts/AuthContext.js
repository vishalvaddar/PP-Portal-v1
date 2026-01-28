import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // 🔹 Load user ONCE on app start
  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token && validateToken(parsed.token)) {
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

  // 🔹 Auto logout on token expiry
  useEffect(() => {
    if (!user?.token) return;

    try {
      const decoded = jwtDecode(user.token);
      const timeout = decoded.exp * 1000 - Date.now();

      if (timeout <= 0) {
        logout();
        return;
      }

      const timer = setTimeout(logout, timeout);
      return () => clearTimeout(timer);
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
    return null;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
