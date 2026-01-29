import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import imas_pp from "../assets/pp_imas1.jpeg";
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
          src={imas_pp}
          alt="RCF Pratibha Poshak Logo"
          className={styles.headerLogo}
        />
        {/* <div className={styles.headerText}>
          <h3 className={styles.headerTitle}>Pratibha Poshak</h3>
          <span className={styles.headerSubtitle}>
            I.M.A.S
          </span>
        </div> */}
      </div>

      <div className={styles.systemStatus}>
        {loading && <span className={styles.statusText}>Loading Config...</span>}
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
