import {React, useState } from 'react';
import styles from './Reports.module.css';

// Mock data for filter dropdowns
const availableYears = [2022, 2023, 2024, 2025];
const availableBatches = ['Batch A', 'Batch B', 'Batch C', 'Batch Alpha', 'Batch Beta'];
const availableStatuses = ['All', 'Selected', 'Not Selected', 'Attended'];

// Data for the report cards
const reportTypes = [
    {
        title: 'Test Reports',
        description: 'Generate detailed reports on test performance and scores.'
    },
    {
        title: 'Selection Summary',
        description: 'Summary of selected students by block, gender (male/female), and total.'
    },
    {
        title: 'School Attendance Summary',
        description: 'Total number of distinct schools from which students attended and were selected.'
    },
    {
        title: 'Attendance Report',
        description: 'Generate monthly and house-wise attendance records for students.'
    },
    {
        title: 'Individual Student Report',
        description: 'Get a comprehensive report for a single student, including all activities.'
    }
];


const ReportCard = ({ title, description }) => (
    <div className={styles.reportCard}>
        <h3 className={styles.reportCardTitle}>{title}</h3>
        <p className={styles.reportCardDescription}>{description}</p>
        <button className={styles.generateButton}>Generate</button>
    </div>
);


const ReportsPage = () => {
    const [filters, setFilters] = useState({
        year: '',
        batch: '',
        status: ''
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    const handleExport = (format) => {
        // Placeholder for export logic
        alert(`Exporting data as ${format} with filters:\nYear: ${filters.year || 'All'}\nBatch: ${filters.batch || 'All'}\nStatus: ${filters.status || 'All'}`);
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContent}>
                {/* Page Header */}
                <div className={styles.headerCard}>
                    <h1 className={styles.mainTitle}>Reports Page</h1>
                    <p className={styles.subtitle}>Generate and export various student and selection reports.</p>
                </div>

                {/* Filters Card */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📆 Filter Data</h2>
                    <div className={styles.filterContainer}>
                        <div className={styles.filterGroup}>
                            <label htmlFor="year">Year</label>
                            <select id="year" name="year" value={filters.year} onChange={handleFilterChange} className={styles.selectInput}>
                                <option value="">All Years</option>
                                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="batch">Batch</label>
                            <select id="batch" name="batch" value={filters.batch} onChange={handleFilterChange} className={styles.selectInput}>
                                <option value="">All Batches</option>
                                {availableBatches.map(batch => <option key={batch} value={batch}>{batch}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label htmlFor="status">Status</label>
                            <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className={styles.selectInput}>
                                {availableStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reports Section */}
                <div className={styles.card}>
                    <div className={styles.reportsHeader}>
                        <h2 className={styles.cardTitle}>📑 Generate Reports</h2>
                        <div className={styles.exportButtons}>
                            <button onClick={() => handleExport('CSV')} className={styles.exportButtonCsv}>⬇️ Export as CSV</button>
                            <button onClick={() => handleExport('PDF')} className={styles.exportButtonPdf}>⬇️ Export as PDF</button>
                        </div>
                    </div>
                    <div className={styles.reportsGrid}>
                       {reportTypes.map(report => (
                           <ReportCard key={report.title} title={report.title} description={report.description} />
                       ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
