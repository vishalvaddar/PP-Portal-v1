import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import rcf_pp from "../assets/RCF-PP2.jpg";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { appliedConfig, loading, error } = useSystemConfig();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <img
          src={rcf_pp}
          alt="RCF Pratibha Poshak Academy Logo"
          className={styles.headerLogo}
        />
        <div className={styles.headerText}>
          <h3 className={styles.headerTitle}>Pratibha Poshak Portal</h3>
          <span className={styles.headerSubtitle}>
            Integrated Management & Administration System
          </span>
        </div>
      </div>

      <div className={styles.systemStatus}>
        {loading && <span className={styles.statusText}>Loading Config...</span>}
        {/* {error && <span className={styles.errorText}>Config Unavailable</span>} */}
        {!loading && !error && appliedConfig && (
          <span className={styles.statusText}>
            <strong>Phase:</strong> {appliedConfig.phase} (AY: {appliedConfig.academic_year})
          </span>
        )}
        {!loading && !error && !appliedConfig && (
          <span className={styles.statusText}>No Applied Academic Year</span>
        )}
      </div>

      <button className={styles.logoutButton} onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
};

export default Header;
