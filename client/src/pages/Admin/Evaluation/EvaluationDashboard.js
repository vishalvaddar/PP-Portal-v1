import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import './EvaluationDashboard.css'; 

const EvaluationDashboard = () => {
    const [overallData, setOverallData] = useState({});
    const [jurisdictions, setJurisdictions] = useState([]);
    const [overallProgress, setOverallProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/evaluation-dashboard`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [
                    overallResponse,
                    jurisResponse,
                    overallProgressResponse
                ] = await Promise.all([
                    fetch(`${API_BASE_URL}/overall`),
                    fetch(`${API_BASE_URL}/jurisdictions`),
                    fetch(`${API_BASE_URL}/overall-progress`)
                ]);

                if (!overallResponse.ok || !jurisResponse.ok || !overallProgressResponse.ok) {
                    throw new Error("Failed to fetch dashboard data.");
                }

                const overallData = await overallResponse.json();
                const jurisData = await jurisResponse.json();
                const overallProgressData = await overallProgressResponse.json();

                // Step 1: Initialize counts to zero to start the animation
                const zeroedOverallData = Object.keys(overallData).reduce((acc, key) => {
                    acc[key] = 0;
                    return acc;
                }, {});
                setOverallData(zeroedOverallData);

                // Initialize jurisdictional progress to zero
                setJurisdictions(jurisData.map(j => ({ ...j, progress: 0 })));
                
                // Initialize overall progress to zero
                setOverallProgress(0);

                // Step 2: Set a timeout to update to the actual values after a brief delay
                setTimeout(() => {
                    setOverallData(overallData);
                    setJurisdictions(jurisData);
                    setOverallProgress(overallProgressData.overallProgress);
                }, 50);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const renderOverallProgress = () => {
        if (loading) return <div className="spinner-lg"></div>;
        if (error) return <p className="error-message">{error}</p>;
        const progressColor = overallProgress === 100 ? "bg-green-500" : "bg-blue-500";
        const progressTextColor = overallProgress === 100 ? "text-green-600" : "text-blue-600";
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
        const progressText = progress === 100 ? "text-green-600" : "text-blue-600";
        const progressBarColor = progress === 100 ? "bg-green-500" : "bg-blue-500";
        return (
            <div className="progress-container">
                <div className="progress-text-container">
                    <span className="progress-label">Progress</span>
                    <span className={`progress-percentage ${progressText}`}>{progress}%</span>
                </div>
                <div className="progress-bar-background">
                    <div
                        className={`progress-bar-fill ${progressBarColor}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const renderJurisdictionList = () => {
        if (loading) return <div className="spinner"></div>;
        if (error) return <p className="error-message">{error}</p>;
        if (jurisdictions.length === 0) return <p className="no-data-message">No jurisdictions found for the selected year.</p>;
        return (
            <div className="jurisdiction-list">
                {jurisdictions.map((jurisdiction) => (
                    <div key={jurisdiction.juris_code} className="jurisdiction-item">
                        <div className="item-details">
                            <div className="checkbox-container">
                                {jurisdiction.isComplete ? (
                                    <svg
                                        className="checkmark-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M20 6L9 17L4 12"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
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
                                    <span className="font-bold">Pending Evaluation:</span>{" "}
                                    {jurisdiction.counts.pendingEvaluation} |{" "}
                                    <span className="font-bold">Pending Interview:</span>{" "}
                                    {jurisdiction.counts.totalInterviewRequired - jurisdiction.counts.completedInterview} |{" "}
                                    <span className="font-bold">Pending Home Verification:</span>{" "}
                                    {jurisdiction.counts.totalHomeVerificationRequired - jurisdiction.counts.completedHomeVerification}
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
            <div className="navigation-links">
                <Link to="" className="nav-link active">
                    Evaluation Dashboard
                </Link>
                <Link to="marks-entry" className="nav-link">
                    📝 Marks Entry
                </Link>
                <Link to="interview" className="nav-link">
                    🧑‍💼 Interview
                </Link>
                <Link to="tracking" className="nav-link">
                    📊 Evaluation Tracking
                </Link>
            </div>

            <div className="dashboard-content">
                <div className="overall-progress-section">
                    <h2 className="section-title">Overall Progress</h2>
                    {renderOverallProgress()}
                </div>

                <div className="overall-status-section">
                    <h2 className="section-title">Overall Status</h2>
                    {renderOverallCounts()}
                </div>

                <div className="jurisdictional-progress-section">
                    <h2 className="section-title">Jurisdictional Progress</h2>
                    {renderJurisdictionList()}
                </div>
            </div>
        </div>
    );
};

export default EvaluationDashboard;