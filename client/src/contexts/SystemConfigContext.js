// SystemConfigContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const SystemConfigContext = createContext({
  config: null,
  setConfig: () => {},
  loading: true,
});

export const useSystemConfig = () => useContext(SystemConfigContext);

export const SystemConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BACKEND_API_URL}/api/system/config`
        );
        setConfig(res.data);
      } catch (err) {
        console.error("Failed to fetch system config", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <SystemConfigContext.Provider value={{ config, setConfig, loading }}>
      {children}
    </SystemConfigContext.Provider>
  );
};
