import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

const SystemConfigContext = createContext({
  appliedConfig: null,
  setAppliedConfig: () => {},
  loading: true,
  error: null,
  refetchConfig: async () => {},
});

export const useSystemConfig = () => useContext(SystemConfigContext);

export const SystemConfigProvider = ({ children }) => {
  const [appliedConfig, setAppliedConfig] = useState(() => {
    const saved = localStorage.getItem("appliedConfig");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/active`
      );
      const activeConfigs = res.data || [];

      let applied = null;

      // Use localStorage value if valid
      const stored = localStorage.getItem("appliedConfig");
      if (stored) {
        const parsed = JSON.parse(stored);
        const stillActive = activeConfigs.find(
          (c) => c.academic_year === parsed.academic_year
        );
        if (stillActive) {
          applied = stillActive;
        }
      }

      // Fallback: pick latest active if nothing valid
      if (!applied && activeConfigs.length > 0) {
        applied = activeConfigs[0];
      }

      if (applied) {
        localStorage.setItem("appliedConfig", JSON.stringify(applied));
      }

      setAppliedConfig(applied);
    } catch (err) {
      console.error("❌ Failed to fetch active configs:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveConfigs();
  }, [fetchActiveConfigs]);

  //Keep localStorage in sync when user applies a new config
  useEffect(() => {
    if (appliedConfig)
      localStorage.setItem("appliedConfig", JSON.stringify(appliedConfig));
  }, [appliedConfig]);

  const value = useMemo(
    () => ({
      appliedConfig,
      setAppliedConfig: (config) => {
        setAppliedConfig(config);
        if (config)
          localStorage.setItem("appliedConfig", JSON.stringify(config));
      },
      loading,
      error,
      refetchConfig: fetchActiveConfigs,
    }),
    [appliedConfig, loading, error, fetchActiveConfigs]
  );

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
};
