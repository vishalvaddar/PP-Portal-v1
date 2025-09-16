import React from "react";
import { Link } from "react-router-dom";
import { FilePlus, Upload, Search, FileText, AlertTriangle } from "lucide-react";
import styles from "./Applications.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

const Applications = () => {
  const currentPath = ['Admin', 'Admissions', 'Applications'];
  const features = [
    {
      title: "New Application",
      icon: <FilePlus size={32} className={styles.featureIcon} />,
      description: "Create individual student applications manually",
      link: "/admin/admissions/new-application",
      badge: "Common"
    },
    {
      title: "Upload Bulk Applications",
      icon: <Upload size={32} className={styles.featureIcon} />,
      description: "Upload multiple applications using our template",
      link: "/admin/admissions/bulk-upload-applications",
      badge: "Recommended"
    },
    {
      title: "Application Search",
      icon: <Search size={32} className={styles.featureIcon} />,
      description: "Manage existing applications",
      link: "/admin/admissions/search-applications"
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <FileText size={28} className={styles.titleIcon} />
          <h1 className={styles.title}>Applications Management</h1>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Link to={feature.link} key={index} className={styles.featureCard}>
              {feature.badge && <span className={styles.featureBadge}>{feature.badge}</span>}
              <div className={styles.featureIconContainer}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              <div className={styles.featureArrow}>→</div>
            </Link>
          ))}
        </div>

        <div className={styles.infoSection}>
          <div className={styles.alertCard}>
            <h2 className={styles.sectionTitle}>
              <AlertTriangle size={20} className={styles.sectionIcon} />
              Important Notes
            </h2>
            <ul className={styles.alertList}>
              <li>Bulk uploads require our standardized template format</li>
              <li>Applications remain pending until manually verified</li>
              <li>Duplicate applications are automatically flagged</li>
              <li>System automatically archives applications after 6 months</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applications;