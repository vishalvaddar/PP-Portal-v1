import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const SystemConfigContext = createContext({
  config: null,
  setConfig: () => {},
  loading: true,
  error: null,
  refetchConfig: async () => {},
});

export const useSystemConfig = () => useContext(SystemConfigContext);

export const SystemConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/active`
      );
      setConfig(res.data);
    } catch (err) {
      console.error("Failed to fetch system config", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const value = useMemo(() => ({
    config,
    setConfig, 
    loading,
    error,
    refetchConfig: fetchConfig,
  }), [config, loading, error, fetchConfig]);

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
};