import React from "react";
import { Link } from "react-router-dom";
import { ScrollText, Info, ListChecks, Download, AlertCircle } from "lucide-react";
import styles from "./Shortlisting.module.css";

const Shortlisting = () => {
  const features = [
    {
      title: "Generate Shortlist",
      icon: <ListChecks size={32} className={styles.featureIcon} />,
      description: "Create customized shortlists by selecting state, district, and blocks",
      link: "/admin/admissions/generate-shortlist",
      badge: "New"
    },
    {
      title: "View Shortlisted Info",
      icon: <Info size={32} className={styles.featureIcon} />,
      description: "Manage, freeze or delete existing shortlists",
      link: "/admin/admissions/shortlist-info",
      badge: "Updated"
    }
  ];

  const tips = [
    "Only one active shortlist per block is allowed",
    "Changes made to frozen shortlists require admin approval",
    "Use filters to refine your shortlisting criteria"
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <ScrollText size={28} className={styles.titleIcon} />
          <h1 className={styles.title}>Shortlisting Dashboard</h1>
        </div>
        <p className={styles.subtitle}>Manage student selection process efficiently</p>
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
          <div className={styles.instructionsCard}>
            <h2 className={styles.sectionTitle}>
              <Info size={20} className={styles.sectionIcon} />
              Shortlisting Guidelines
            </h2>
            <ul className={styles.instructionsList}>
              <li>Generate multiple shortlists but maintain only one active version per block</li>
              <li>Use the freeze option to prevent further modifications</li>
              <li>Download options include PDF, Excel, and CSV formats</li>
              <li>Changes to frozen lists require administrator approval</li>
            </ul>
          </div>

          <div className={styles.tipsCard}>
            <h2 className={styles.sectionTitle}>
              <AlertCircle size={20} className={styles.sectionIcon} />
              Quick Tips
            </h2>
            <div className={styles.tipsContainer}>
              {tips.map((tip, index) => (
                <div key={index} className={styles.tipItem}>
                  <span className={styles.tipBullet}>•</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shortlisting;