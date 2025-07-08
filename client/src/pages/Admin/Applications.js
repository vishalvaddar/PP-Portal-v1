import React from "react";
import { Link } from "react-router-dom";
import { FilePlus, Upload, Search } from "lucide-react";
import styles from "./Applications.module.css";

const features = [
  {
    title: "Upload Single Application",
    icon: <FilePlus size={36} />,
    description: "Create an application for one student manually.",
    link: "/admin/admissions/new-application",
  },
  {
    title: "Upload Bulk Applications",
    icon: <Upload size={36} />,
    description: "Upload multiple applications using Excel or CSV template.",
    link: "/admin/admissions/bulk-upload-applications",
  },
  {
    title: "Search & View Applications",
    icon: <Search size={36} />,
    description: "Easily find and view submitted applications.",
    link: "/admin/admissions/search-applications",
  },
];

const Applications = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Applications</h1>
        <p className={styles.subheading}>
          Manage your student admissions with ease and efficiency.
        </p>
      </header>

      <section className={styles.grid}>
        {features.map(({ title, icon, description, link }) => (
          <Link to={link} className={styles.card} key={title}>
            <div className={styles.icon}>{icon}</div>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardDescription}>{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
};

export default Applications;
