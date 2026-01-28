import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FilePlus, Upload, Search, FileText, AlertTriangle } from "lucide-react";
import styles from "./Applications.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const FeatureCard = ({ title, icon, description, link, badge, isDisabled }) => {
  const content = (
    <>
      {badge && <span className={styles.featureBadge}>{badge}</span>}
      <div className={styles.featureIconContainer}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      {description && <p className={styles.featureDescription}>{description}</p>}
      <div className={styles.featureArrow}>→</div>
    </>
  );

  return isDisabled ? (
    <div
      className={`${styles.featureCard} ${styles.featureCardDisabled}`}
      aria-disabled="true"
      tabIndex="-1"
    >
      {content}
    </div>
  ) : (
    <Link to={link} className={styles.featureCard}>
      {content}
    </Link>
  );
};

const Applications = () => {
  const currentPath = ["Admin", "Admissions", "Applications"];
  const { appliedConfig, loading, error } = useSystemConfig();

  // Check if admissions are open based on the system phase
  const isAdmissionsOpen =
    !loading && appliedConfig?.phase === "Admissions are started";

  const features = useMemo(
    () => [
      {
        title: "New Application",
        icon: <FilePlus size={32} className={styles.featureIcon} />,
        link: "/admin/admissions/new-application",
        badge: "Standard",
        requiresAdmissionsPhase: true,
      },
      {
        title: "Bulk Upload",
        icon: <Upload size={32} className={styles.featureIcon} />,
        link: "/admin/admissions/bulk-upload-applications",
        badge: "Recommended",
        requiresAdmissionsPhase: true,
      },
      {
        title: "Search Applications",
        icon: <Search size={32} className={styles.featureIcon} />,
        link: "/admin/admissions/search-applications",
      },
    ],
    []
  );

  if (loading)
    return (
      <div className={styles.loader}>
        Retrieving system configuration, please wait...
      </div>
    );

  if (error)
    return (
      <div className={styles.error}>
        <AlertTriangle size={18} /> Failed to load system configuration.
      </div>
    );

  const disabledFeaturesExist = features.some(
    (f) => f.requiresAdmissionsPhase && !isAdmissionsOpen
  );

  return (
    <main className={styles.dashboardContainer}>
      <Breadcrumbs
        path={currentPath}
        nonLinkSegments={["Admin", "Admissions"]}
      />

      <header className={styles.header}>
        <div className={styles.titleContainer}>
          <FileText size={28} className={styles.titleIcon} />
          <h1 className={styles.title}>Application Management</h1>
        </div>
      </header>

      <section className={styles.contentWrapper}>
        <div className={styles.featuresGrid}>
          {features.map((feature, i) => (
            <FeatureCard
              key={i}
              {...feature}
              isDisabled={
                feature.requiresAdmissionsPhase && !isAdmissionsOpen
              }
            />
          ))}
        </div>

        {disabledFeaturesExist && (
          <aside className={styles.disabledNotice}>
            <AlertTriangle size={18} className={styles.disabledNoticeIcon} />
            <p>
              The <strong>New Application</strong> and{" "}
              <strong>Bulk Upload</strong> These options are currently unavailable as the Classes Started phase has commenced.
            </p>
          </aside>
        )}
      </section>
    </main>
  );
};

export default Applications;
