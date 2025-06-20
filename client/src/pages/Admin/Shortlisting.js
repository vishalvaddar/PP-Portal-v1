import React from "react";
import { Link } from "react-router-dom";
import { ScrollText } from "lucide-react";
import styles from "./Shortlisting.module.css"; // This import is correct

const Shortlisting = () => {
  return (
    <div className={styles.shortlistingContainer}>
      <div className={styles.mainContentWrapper}> {/* This class is correct */}
        <h2 className={styles.pageTitle}>
          <span className={styles.pageTitleIcon}><ScrollText size={25} /></span> Shortlisting
        </h2>

        <div className={styles.actionsGrid}> {/* This class is correct */}
          <Link to="/admin/admissions/generate-shortlist" className={styles.actionCard}> {/* This class is correct */}
            <div className={styles.actionCardIcon}> {/* This class is correct */}
              <i className="fas fa-list-check"></i>
            </div>
            <div className={styles.actionCardLabel}>Generate Shortlist</div> {/* This class is correct */}
          </Link>

          <Link to="/admin/admissions/shortlist-info" className={styles.actionCard}> {/* This class is correct */}
            <div className={styles.actionCardIcon}> {/* This class is correct */}
              <i className="fas fa-info-circle"></i>
            </div>
            <div className={styles.actionCardLabel}>View Shortlisted Info</div> {/* This class is correct */}
          </Link>
        </div>

        <div className={styles.instructionsBox}> {/* This class is correct */}
          <h3 className={styles.instructionsHeader}> {/* This class is correct */}
            <span className={styles.instructionsHeaderIcon}>📌</span> Shortlisting Process Instructions
          </h3>
          <ul className={styles.instructionsList}> {/* This class is correct */}
            <li>
              <strong>Generate a shortlist</strong> by selecting state, district, and blocks using the given filters.
            </li>
            <li>
              You may generate multiple shortlists, but <strong>only one active shortlist per block</strong> is allowed.
            </li>
            <li>
              Use the <em>“Shortlisted Information”</em> section to <strong>freeze or delete</strong> a shortlist.
            </li>
            <li>
              Download finalized student lists directly from the <em>“Shortlisted Information”</em> page.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Shortlisting;