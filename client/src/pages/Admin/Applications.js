import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Link } from "react-router-dom";
import styles from './Applications.module.css';

const Applications = () => (
  <div className={styles.container}>
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <CardTitle className={styles.cardTitle}>
          Applications Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav className={styles.nav}>
          <Link to="/admin/admissions/new-application" className={styles.navLink}>
            New Application
          </Link>
          <Link to="/admin/admissions/bulk-upload" className={styles.navLink}>
            Bulk Upload
          </Link>
          <Link to="/admin/admissions/search" className={styles.navLink}>
            Search Applications
          </Link>
        </nav>
      </CardContent>
    </Card>
  </div>
);

export default Applications;
