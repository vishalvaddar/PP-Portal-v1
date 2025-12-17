import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import styles from './Reports.module.css';
import { Replace } from 'lucide-react';

const ReportCard = ({ title, description, path }) => {
    const navigate = useNavigate();

    return (
        <div className={styles.reportCard}>
            <h3 className={styles.reportCardTitle}>{title}</h3>
            <p className={styles.reportCardDescription}>{description}</p>
            <button className={styles.generateButton} onClick={() => navigate(path, { replace: true })}>Generate</button>
        </div>
    );
};

const reportTypes = [
    {title:'Custom lists', description: 'Generate Custom lists', path:'/admin/academics/reports/custom-lists' }

];

const ReportsPage = () => {
    const BASE = process.env.REACT_APP_BACKEND_API_URL;

    const [filters, setFilters] = useState({
        year: "",
        batch: "",
        status: ""
    });

    const [availableYears, setAvailableYears] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStatuses, setAvailableStatuses] = useState([]);

    // Fetch dropdown data from backend
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await axios.get(`${BASE}/api/reports/filters`);
                setAvailableYears(res.data.years || []);
                setAvailableBatches(res.data.batches || []);
                setAvailableStatuses(res.data.statuses || []);
            } catch (err) {
                console.error("Error fetching filter data:", err);
            }
        };
        fetchFilters();
    }, [BASE]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContent}>

                <div className={styles.headerCard}>
                    <h1 className={styles.mainTitle}>Reports Page</h1>
                    <p className={styles.subtitle}>Generate and export various student and selection reports.</p>
                </div>

                {/* Reports Section */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📑 Generate Reports</h2>

                    <div className={styles.reportsGrid}>
                        {reportTypes.map(report => (
                            <ReportCard
                                key={report.title}
                                title={report.title}
                                path={report.path}
                                description={report.description}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportsPage;
