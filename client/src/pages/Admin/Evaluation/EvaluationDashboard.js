import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSystemConfig } from "../../../contexts/SystemConfigContext"; 
import './EvaluationDashboard.css';  
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs";

const EvaluationDashboard = () => {
    // Get the applied configuration from Context
    const { appliedConfig } = useSystemConfig();

       const currentPath = ['Admin', 'Admissions', 'Evaluation'];

    const [overallData, setOverallData] = useState({});
    const [jurisdictions, setJurisdictions] = useState([]);
    const [overallProgress, setOverallProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/evaluation-dashboard`;

    // Extract the 4-digit starting year (e.g., "2025" from "2025-26")
    const displayYear = useMemo(() => {
        if (appliedConfig && appliedConfig.academic_year) {
            return appliedConfig.academic_year.split('-')[0];
        }
        return new Date().getFullYear().toString();
    }, [appliedConfig]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch data using the specific displayYear parameter
                const [
                    overallResponse,
                    jurisResponse,
                    overallProgressResponse
                ] = await Promise.all([
                    fetch(`${API_BASE_URL}/overall/${displayYear}`),
                    fetch(`${API_BASE_URL}/jurisdictions/${displayYear}`),
                    fetch(`${API_BASE_URL}/overall-progress/${displayYear}`)
                ]);

                if (!overallResponse.ok || !jurisResponse.ok || !overallProgressResponse.ok) {
                    throw new Error(`Failed to fetch data for year ${displayYear}`);
                }

                const overallDataRaw = await overallResponse.json();
                const jurisDataRaw = await jurisResponse.json();
                const overallProgressRaw = await overallProgressResponse.json();

                // Initialize with zeros to trigger the entry animation
                const zeroedOverall = Object.keys(overallDataRaw).reduce((acc, key) => {
                    acc[key] = 0;
                    return acc;
                }, {});
                
                setOverallData(zeroedOverall);
                setJurisdictions(jurisDataRaw.map(j => ({ ...j, progress: 0 })));
                setOverallProgress(0);

                // Delay to allow zeroed state to render before actual data pops in
                setTimeout(() => {
                    setOverallData(overallDataRaw);
                    setJurisdictions(jurisDataRaw);
                    setOverallProgress(overallProgressRaw.overallProgress || 0);
                }, 50);

            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [displayYear, API_BASE_URL]);

    const renderOverallProgress = () => {
        if (loading) return <div className="spinner-lg"></div>;
        if (error) return <p className="error-message">{error}</p>;
        
        const isComplete = overallProgress === 100;
        const progressColor = isComplete ? "bg-green-500" : "bg-blue-500";
        const progressTextColor = isComplete ? "text-green-600" : "text-blue-600";
        
        return (
            <div className="overall-progress-container">
                <div className="overall-progress-bar-background">
                    <div
                        className={`overall-progress-bar-fill ${progressColor}`}
                        style={{ width: `${overallProgress}%` }}
                    ></div>
                </div>
                <span className={`overall-progress-percentage ${progressTextColor}`}>
                    {overallProgress}%
                </span>
            </div>
        );
    };

    const renderProgress = (progress) => {
        const isComplete = progress === 100;
        const progressTextClass = isComplete ? "text-green-600" : "text-blue-600";
        const progressBarColorClass = isComplete ? "bg-green-500" : "bg-blue-500";
        
        return (
            <div className="progress-container">
                <div className="progress-text-container">
                    <span className="progress-label">Progress</span>
                    <span className={`progress-percentage ${progressTextClass}`}>{progress}%</span>
                </div>
                <div className="progress-bar-background">
                    <div
                        className={`progress-bar-fill ${progressBarColorClass}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const renderJurisdictionList = () => {
        if (loading) return <div className="spinner"></div>;
        if (error) return <p className="error-message">{error}</p>;
        
        // This will only show jurisdictions if the backend filters them based on active shortlists
        if (jurisdictions.length === 0) {
            return <p className="no-data-message">No active evaluation batches found for {displayYear}.</p>;
        }

        return (
            <div className="jurisdiction-list">
                {jurisdictions.map((jurisdiction) => (
                    <div key={jurisdiction.juris_code} className="jurisdiction-item">
                        <div className="item-details">
                            <div className="checkbox-container">
                                {jurisdiction.isComplete ? (
                                    <svg className="checkmark-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <input type="checkbox" className="h-6 w-6" disabled />
                                )}
                            </div>
                            <div className="text-content">
                                <h3 className="item-title">
                                    {jurisdiction.juris_name} ({jurisdiction.juris_code})
                                </h3>
                                <p className="item-subtitle">
                                    <span className="font-bold">Pending Marks:</span> {jurisdiction.counts.pendingEvaluation} |{" "}
                                    <span className="font-bold">Pending Interview:</span> {jurisdiction.counts.totalInterviewRequired - jurisdiction.counts.completedInterview} |{" "}
                                    {/* 👈 UPDATED LABEL TO FULL FORM */}
                                    <span className="font-bold">Pending Home Verification:</span> {jurisdiction.counts.totalHomeVerificationRequired - jurisdiction.counts.completedHomeVerification}
                                </p>
                            </div>
                        </div>
                        {renderProgress(jurisdiction.progress)}
                    </div>
                ))}
            </div>
        );
    };

    const renderOverallCounts = () => {
        if (loading) return <div className="spinner-lg"></div>;
        if (error) return <p className="error-message">{error}</p>;
        
        return (
            <div className="counts-grid">
                {Object.entries(overallData).map(([label, count]) => (
                    <div key={label} className="count-box">
                        <p className="box-label">{label}</p>
                        <p className="box-count">{count}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="evaluation-dashboard">
            <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
            <div className="navigation-links">
                <Link to="" className="nav-link active">Evaluation Dashboard</Link>
                <Link to="marks-entry" className="nav-link">📝 Marks Entry</Link>
                <Link to="interview" className="nav-link">🧑‍💼 Interview</Link>
                <Link to="tracking" className="nav-link">📊 Evaluation Tracking</Link>
            </div>

            <div className="dashboard-content">
                <div className="overall-progress-section">
                    <h2 className="section-title">Overall Progress ({displayYear})</h2>
                    {renderOverallProgress()}
                </div>

                <div className="overall-status-section">
                    <h2 className="section-title">Overall Status</h2>
                    {renderOverallCounts()}
                </div>

                <div className="jurisdictional-progress-section">
                    <h2 className="section-title">Jurisdictional Progress ({displayYear})</h2>
                    {renderJurisdictionList()}
                </div>
            </div>
        </div>
    );
};

export default EvaluationDashboard;