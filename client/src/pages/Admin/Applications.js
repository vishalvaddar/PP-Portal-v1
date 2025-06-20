import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Link } from "react-router-dom";
import styles from './Applications.module.css';
import { FilePlus, Upload, Search } from 'lucide-react'; // Importing icons

const Applications = () => (
  <div className={styles.pageContainer}>
    <Card className={styles.mainCard}>
      <CardHeader className={styles.mainCardHeader}>
        <CardTitle className={styles.mainCardTitle}>
          Applications Management
        </CardTitle>
        <CardDescription className={styles.mainCardDescription}>
          Streamline your student application process with these powerful tools.
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.mainCardContent}>
        <div className={styles.gridContainer}>
          {/* New Application Card */}
          <Link to="/admin/admissions/new-application" className={styles.cardLink}>
            <Card className={styles.featureCard}>
              <CardHeader className={styles.featureCardHeader}>
                <FilePlus className={styles.featureIcon} size={32} />
                <CardTitle className={styles.featureCardTitle}>
                  Upload Single <br /> Application
                </CardTitle>
              </CardHeader>
              <CardContent className={styles.featureCardContent}>
                <p className={styles.featureDescription}>
                  Create a new application for a single student. 
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Bulk Upload Applications Card */}
          <Link to="/admin/admissions/bulk-upload-applications" className={styles.cardLink}>
            <Card className={styles.featureCard}>
              <CardHeader className={styles.featureCardHeader}>
                <Upload className={styles.featureIcon} size={32} />
                <CardTitle className={styles.featureCardTitle}>
                  Upload Bulk <br /> Applications
                </CardTitle>
              </CardHeader>
              <CardContent className={styles.featureCardContent}>
                <p className={styles.featureDescription}>
                  Import multiple student applications in bulk using a CSV or Excel template
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Search Applications Card */}
          <Link to="/admin/admissions/search-applications" className={styles.cardLink}>
            <Card className={styles.featureCard}>
              <CardHeader className={styles.featureCardHeader}>
                <Search className={styles.featureIcon} size={32} />
                <CardTitle className={styles.featureCardTitle}>
                  Search & View <br />Applications
                </CardTitle>
              </CardHeader>
              <CardContent className={styles.featureCardContent}>
                <p className={styles.featureDescription}>
                  Search and manage applications by name, registration number, etc.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Applications;