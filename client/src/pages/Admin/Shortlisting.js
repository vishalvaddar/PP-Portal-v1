import React from "react";
import { Link } from "react-router-dom";
import { 
  ScrollText,
  Info,
  ListChecks,
  AlertCircle
} from "lucide-react";
import styles from "./Shortlisting.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

const features = [
  {
    title: "Generate Shortlist",
    icon: <ListChecks size={32} className={styles.featureIcon} />,
    description: "Generate a shortlist of students based on the selected criteria.",
    link: "/admin/admissions/generate-shortlist",
    badge: "New"
  },
  {
    title: "View Shortlisted Info",
    icon: <Info size={32} className={styles.featureIcon} />,
    description: "View detailed information about shortlisted students.",
    link: "/admin/admissions/shortlist-info",
    badge: "Updated"
  }
];

const guidelines = [
  "Generate multiple shortlists but maintain only one active version per block",
  "Use the freeze option to prevent further modifications",
  "Download options include PDF, Excel, and CSV formats",
  "Changes to frozen lists require administrator approval",
  "No 2 shortlist batch can have same name"
];

const tips = [
  "Only one active shortlist per block is allowed",
  "Changes made to frozen shortlists require admin approval",
  "Use filters to refine your shortlisting criteria"
];

const FeatureCard = ({feature}) => (
  <Link to={feature.link} className={styles.featureCard}>
    {feature.badge && <span className={styles.featureBadge}>{feature.badge}</span>}
    <div className={styles.featureIconContainer}>{feature.icon}</div>
    <h3 className={styles.featureTitle}>{feature.title}</h3>
    <p className={styles.featureDescription}>{feature.description}</p>
    <div className={styles.featureArrow}>→</div>
  </Link>
);

const InfoSection = ({ title, icon, items, isList = true }) => (
  <div className={styles.instructionsCard}>
    <h2 className={styles.sectionTitle}>
      {icon}
      {title}
    </h2>
    {isList ? (
      <ul className={styles.instructionsList}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ) : (
      <div className={styles.tipsContainer}>
        {items.map((tip, index) => (
          <div key={index} className={styles.tipItem}>
            <span className={styles.tipBullet}>•</span>
            {tip}
          </div>
        ))}
      </div>
    )}
  </div>
);

const Shortlisting = () => {
  const currentPath = ['Admin', 'Admissions', 'Shortlisting'];
  return (
    <div className={styles.dashboardContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleContainer}>
            <ScrollText size={28} className={styles.titleIcon} />
            <h1 className={styles.title}>Shortlisting Dashboard</h1>
          </div>
        </div>
      </header>

      <main className={styles.contentWrapper}>
        <section className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </section>

        <section className={styles.infoSection}>
          <InfoSection
            title="Shortlisting Guidelines"
            icon={<Info size={20} className={styles.sectionIcon} />}
            items={guidelines}
          />
          <InfoSection
            title="Quick Tips"
            icon={<AlertCircle size={20} className={styles.sectionIcon} />}
            items={tips}
            isList={false}
          />
        </section>
      </main>
    </div>
  );
};

export default Shortlisting;