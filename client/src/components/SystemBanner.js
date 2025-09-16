import React from "react";
import { useSystemConfig } from "../contexts/SystemConfigContext";

const SystemBanner = () => {
  const { config, loading } = useSystemConfig();

  if (loading || !config) return null;

  return (
    <div className="w-full bg-blue-100 border-b border-blue-300 p-3 text-center text-blue-900 font-semibold">
      AY {config.academic_year} – {config.phase}
    </div>
  );
};

export default SystemBanner;
