/** * @fileoverview Single-file React component for Interview and Home Verification Tracking.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Breadcrumbs from '../../../components/Breadcrumbs/Breadcrumbs';
import styles from './EvaluationTracking.module.css';
import { useSystemConfig } from '../../../contexts/SystemConfigContext';

// --- CONFIGURATION ---
    const API_BASE_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/tracking`;


// --- FILTER CONSTANTS (FIXED) ---
const STATUS_OPTIONS = ['SCHEDULED', 'RESCHEDULED', 'COMPLETED'];
const RESULT_OPTIONS = ['SELECTED', 'REJECTED', 'HOME VERIFICATION REQUIRED'];

// --- MAIN COMPONENT ---
const EvaluationTracking = () => {
    // --- State Management ---
    const [view, setView] = useState('list');
    const [students, setStudents] = useState([]);
    const [interviewers, setInterviewers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);

    // Filter State
    const [selectedInterviewerId, setSelectedInterviewerId] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState([]);  
    const [selectedResults, setSelectedResults] = useState([]);    
   
   const { appliedConfig, loading: configLoading } = useSystemConfig();
    
   const isAdmissionsOpen = !configLoading && appliedConfig?.phase === "Admissions are started";
    const isClassesStarted = !configLoading && appliedConfig?.phase === "Classes are started";

        const isFilteredList = !!selectedInterviewerId || selectedStatuses.length > 0 || selectedResults.length > 0;

   const cohortId = useMemo(() => {
        return appliedConfig?.academic_year 
            ? `cohort-${appliedConfig.academic_year.split('-')[0]}` 
            : `cohort-${new Date().getFullYear()}`;
    }, [appliedConfig]);
    // 🚀 Added Path Logic
    const currentPath = useMemo(() => {
        return ['Admin', 'Admissions', 'Evaluation', 'Tracking'];
    }, []);

    // --- Data Fetching ---

// 1. Extract the year from the context (e.g., "2025-26" -> "2025")
const nmmsYear = useMemo(() => {
    return appliedConfig?.academic_year 
        ? appliedConfig.academic_year.split('-')[0] 
        : null;
}, [appliedConfig]);

// 2. Fetch Interviewers (Static list, usually doesn't need year)
const fetchInterviewers = useCallback(async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/interviewers`);
        setInterviewers(response.data);
    } catch (err) {
        setError('Could not load interviewer list.');
        console.error(err);
    }
}, []);

// 3. Fetch Students (Dynamic list based on Year and Filters)
const fetchStudents = useCallback(async () => {
    // 🔥 Guard: Don't fetch if year isn't ready yet
     if (!nmmsYear || !isAdmissionsOpen) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('nmms_year', nmmsYear); // 🔥 Pass the dynamic year

    let url = `${API_BASE_URL}/students`;

    if (selectedInterviewerId) {
        // For interviewer specific route
        url = `${API_BASE_URL}/students/interviewer/${selectedInterviewerId}`;
    } else {
        if (selectedStatuses.length > 0) {
            params.append('statuses', selectedStatuses.join(','));
        }
        if (selectedResults.length > 0) {
            params.append('results', selectedResults.join(','));
        }
    }

    try {
        const response = await axios.get(`${url}?${params.toString()}`);
        setStudents(response.data.students);
        setTotalPages(response.data.totalPages);
        // Note: We don't setCurrentPage(response.data.currentPage) here 
        // because it causes an infinite loop with the useEffect dependency
    } catch (err) {
        setError('Failed to fetch student list.');
        console.error(err);
    } finally {
        setLoading(false);
    }
}, [currentPage, selectedInterviewerId, selectedStatuses, selectedResults, nmmsYear, isAdmissionsOpen]);

// 4. Fetch Details (All rounds for a specific student in that year)
const fetchStudentDetails = useCallback(async (applicantId) => {
    if (!nmmsYear || !isAdmissionsOpen) return;

    setLoading(true);
    setError(null);
    
    try {
        const [interviewResponse, homeResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/students/${applicantId}/interviews/all?nmms_year=${nmmsYear}`),
            axios.get(`${API_BASE_URL}/students/${applicantId}/home/all?nmms_year=${nmmsYear}`)
        ]);

        let roundsData = [
            ...interviewResponse.data, 
            ...homeResponse.data.map(hv => ({ 
                ...hv, 
                is_home_verification: true, 
                interview_round: 999, 
                status: hv.home_verification_status || 'Submitted',
                interview_result: hv.home_verification_status || 'Verified',
            })) 
        ];
        
        roundsData.sort((a, b) => (a.interview_round || 0) - (b.interview_round || 0));
        
        const studentName = roundsData.length > 0 ? (roundsData[0].student_name || 'N/A') : 'N/A';
        
        setStudentDetails({
            applicantId,
            studentName,
            rounds: roundsData 
        });
        setSelectedStudentId(applicantId);
        setView('details');
    } catch (err) {
        console.error('Fetch student details error:', err);
        setError('Failed to load student details.');
    } finally {
        setLoading(false);
    }
}, [nmmsYear, isAdmissionsOpen]);

useEffect(() => {
        if (isAdmissionsOpen) {
            fetchInterviewers();
        }
    }, [fetchInterviewers, isAdmissionsOpen]);

useEffect(() => {
        if (nmmsYear && isAdmissionsOpen) {
            fetchStudents();
        }
    }, [fetchStudents, nmmsYear, isAdmissionsOpen]);

    // --- Filter Handlers ---
    const handleInterviewerChange = (e) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setSelectedInterviewerId(id);
        if (id) {
            setSelectedStatuses([]);
            setSelectedResults([]);
        }
    };

    const handleStatusToggle = (status) => {
        setSelectedInterviewerId(null);
        setSelectedStatuses(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const handleResultToggle = (result) => {
        setSelectedInterviewerId(null);
        setSelectedResults(prev =>
            prev.includes(result) ? prev.filter(r => r !== result) : [...prev, result]
        );
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    const handleCardClick = (applicantId) => {
        fetchStudentDetails(applicantId); 
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedStudentId(null);
        setStudentDetails(null);
    };

    const handleDocumentDownload = (applicantId, roundType, cohortId) => {
        if (!applicantId || !cohortId || !roundType) {
             console.error('Missing parameters for document download.');
             return;
        }
        const url = `${API_BASE_URL}/document/${applicantId}/${cohortId}?type=${roundType}`;
        window.open(url, '_blank');
    };

    // --- Helper Components & Rendering ---

 const StatusBadge = ({ status, result }) => {
    let statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
    let resultColor = styles.notSubmitted; // Default to red
    let resultDisplay = result || 'Not Submitted';

    // 🔥 Check if result exists and color accordingly
    if (result && result !== 'Not Submitted') {
        resultColor = styles.submitted; // Green
        resultDisplay = result;
    }

    const statusLabel = status || 'N/A';
    
    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold">
            <span className={`px-2 py-1 rounded border ${statusColor}`}>
                Status: {statusLabel}
            </span>
            <span className={styles.statusDivider}>|</span>
            <span className={resultColor}>
                Result: {resultDisplay}
            </span>
        </span>
    );
};

    const StudentCard = ({ student }) => {
        const latestRound = student.interview_round || 'N/A';
        return (
            <div
                className="p-4 border border-gray-200 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 cursor-pointer flex justify-between items-center"
                onClick={() => handleCardClick(student.applicant_id)}
            >
                <div>
                    <div className="font-bold text-lg text-blue-700">
                        {student.student_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        Latest Round: {latestRound}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-semibold text-gray-600 mb-1">
                        Latest Evaluation
                    </div>
                    <StatusBadge status={student.status} result={student.result} />
                </div>
            </div>
        );
    };

    const RoundSelectorBox = ({ round, index, isActive, setActiveRoundIndex }) => {
        const isInterview = !round.is_home_verification;
        const title = isInterview ? `Interview Round ${round.interview_round}` : `🏠 Home Verification`;
        const result = round.interview_result || round.home_verification_status || 'Pending';
        const isSubmitted = isInterview ? !!round.interview_result : !!round.verification_id; 
        
        let statusClass = 'status-default';
        if (!isSubmitted) {
            statusClass = 'status-failure'; 
        } else {
            if (result === 'Accepted' || result === 'Completed' || result === 'Verified') {
                statusClass = 'status-success'; 
            } else if (result === 'Rejected' || result === 'Failed') {
                statusClass = 'status-failure'; 
            } else if (round.status === 'Scheduled' || round.status === 'Rescheduled' || result === 'Pending' || result === 'Submitted') {
                statusClass = 'status-pending'; 
            }
        }
        
        const activeClass = isActive ? 'round-box-active' : statusClass;
        return (
            <button
                onClick={() => setActiveRoundIndex(index)}
                className={`round-box-base transition duration-150 text-left flex items-center justify-between ${activeClass}`} 
            >
                <span className="font-semibold flex items-center">
                    <span className="ml-2">{title}</span>
                </span>
            </button>
        );
    };

const RoundDetailPanel = ({ round, applicantId, handleDocumentDownload, cohortId }) => {
    const isInterview = !round.is_home_verification;
    const isHomeVerification = !!round.is_home_verification;

    const getCleanFileName = (fullPath) => {
        if (!fullPath) return null;
        const parts = fullPath.split(/[/\\]/);
        return parts.pop();
    };

    let docNameRaw = isHomeVerification ? round.home_verification_doc_name : round.doc_name;
    let docType = isHomeVerification ? round.home_verification_doc_type : round.doc_type;
    const docName = getCleanFileName(docNameRaw);
    
    const finalResult = isInterview ? round.interview_result : round.home_verification_status;
    const isSubmitted = !!finalResult && finalResult !== 'Pending';
    
    const roundType = isInterview ? 'interview' : 'home';
    const assignedPerson = isInterview ? (round.interviewer || 'N/A') : (round.verified_by || 'N/A');
    const documentExists = !!docNameRaw && !!docType;

    const getStatusColor = (res) => {
        if (!res) return '';
        const r = res.toUpperCase();
        if (['SELECTED', 'VERIFIED', 'ACCEPTED', 'COMPLETED'].includes(r)) return 'text-green-700';
        if (['REJECTED', 'FAILED'].includes(r)) return 'text-red-700';
        return 'text-blue-700';
    };

    return (
        <div className={styles.detailPanel}>
            <h3 className={styles.panelTitle}>
                {isHomeVerification ? `🏠 Home Verification Details` : `Interview Evaluation (Round ${round.interview_round || 'N/A'})`}
            </h3>

            {!isSubmitted ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 font-bold text-lg animate-pulse">⚠️ Not yet submitted</p>
                    <p className="text-sm text-gray-600 mt-1">Assigned to: <strong>{assignedPerson}</strong></p>
                </div>
            ) : (
                <div className="space-y-6"> {/* Main gap between sections */}
                    
                    {/* Top Details Section */}
                    <div className="space-y-1">
                        <p className="text-sm"><strong>Date:</strong> {round.interview_date || round.date_of_verification || 'N/A'}</p>
                        <p className="text-sm"><strong>Status:</strong> {round.status || round.home_verification_status || 'N/A'}</p>
                        <p className="text-sm"><strong>Final Result:</strong> <span className={`font-bold ${getStatusColor(finalResult)}`}>{finalResult}</span></p>
                        <p className="text-sm"><strong>{isInterview ? 'Interviewer' : 'Verified By'}:</strong> {assignedPerson}</p>
                    </div>

                    {isHomeVerification && (
                        <div className="pt-4 border-t space-y-1">
                            <p className="text-sm"><strong>Verification Type:</strong> {round.home_verification_type || 'N/A'}</p>
                            <p className="text-sm"><strong>Remarks:</strong> {round.remarks || 'N/A'}</p>
                        </div>
                    )}

                    {isInterview && (
                        <div className="pt-4 border-t space-y-1">
                            <p className="text-sm"><strong>Goals & Zeal:</strong> {round.life_goals_and_zeal || 'N/A'}</p>
                            <p className="text-sm"><strong>Learning:</strong> {round.commitment_to_learning || 'N/A'}</p>
                            <p className="text-sm"><strong>Integrity:</strong> {round.integrity || 'N/A'}</p>
                            <p className="text-sm"><strong>Communication:</strong> {round.communication_skills || 'N/A'}</p>
                        </div>
                    )}
                </div>
            )}

            {documentExists && isSubmitted && (
                <div className="mt-8 pt-4 border-t flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Uploaded File</p>
                        <p className="text-sm font-semibold text-blue-900">{docName} ({docType})</p>
                    </div>
                    <button
                        onClick={() => handleDocumentDownload(applicantId, roundType, cohortId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        View Document
                    </button>
                </div>
            )}
        </div>
    );
};
    const DetailsView = ({ studentDetails, handleBackToList, error }) => {
    const [activeRoundIndex, setActiveRoundIndex] = useState(0);
    const rounds = studentDetails?.rounds || [];
    const isLatestRoundView = rounds.length === 1 && isFilteredList;

    useEffect(() => {
        if (rounds.length > 0) setActiveRoundIndex(0);
    }, [rounds.length]);

    if (!studentDetails) return null;
    const selectedRound = rounds[activeRoundIndex];
    const requiresHomeVerification = rounds.some(r => r.home_verification_req_yn === 'Y');
    const hasSubmittedVerification = rounds.some(r => r.is_home_verification);
    const showAlert = requiresHomeVerification && !hasSubmittedVerification;
    
    let roundToShowOnAlert = null;
    if (showAlert) {
         const requestIndex = rounds.findIndex(r => r.home_verification_req_yn === 'Y');
         if (requestIndex !== -1) roundToShowOnAlert = rounds[requestIndex];
    }

    return ( 
        <div className={styles.container}>
            <Breadcrumbs 
                path={currentPath} 
                nonLinkSegments={['Admin', 'Admissions']} 
                onSegmentClick={(segment) => {
                    if (segment === 'tracking') handleBackToList();
                }}
            />
            <button
                onClick={handleBackToList}
                className="mb-6 mt-4 text-blue-600 hover:text-blue-800 font-medium transition"
            >
                ← Back to Student List
            </button>

            {/* Student Header Box */}
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border-t-4 border-blue-500">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    {studentDetails.studentName}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Applicant ID: {studentDetails.applicantId}</p>
            </div>
            
            {showAlert && roundToShowOnAlert && (
                <div className="action-required-alert mb-6">
                    <span className="action-icon">⚠️</span>
                    <div className="action-body">
                        <strong className="action-title">ACTION REQUIRED</strong>
                        <p>
                            Home Verification was requested during 
                            <span className="action-highlight"> Round {roundToShowOnAlert.interview_round}</span> 
                            by {roundToShowOnAlert.interviewer || 'N/A'}. 
                            No verification record has been submitted yet.
                        </p>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {isLatestRoundView ? 'Latest Evaluation Round (Filtered)' : 'Evaluation Rounds'}
            </h2>
            
            {rounds.length === 0 ? (
                <div className="p-6 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded-lg">
                    No interview or home verification rounds have been recorded for this student yet.
                </div>
            ) : (
                /* Round Selection Grid */
                <div className={styles.roundGrid}>
                    {rounds.map((round, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveRoundIndex(index)}
                            className={`${styles.roundBox} ${index === activeRoundIndex ? styles.activeRound : ''}`}
                        >
                            <span className="font-bold">
                                {!round.is_home_verification 
                                    ? `Interview Round ${round.interview_round}` 
                                    : `🏠 Home Verification`}
                            </span>
                            {/* Subtext for the box showing status */}
                            <span className="text-xs mt-1 block opacity-75">
                                {round.interview_result || round.home_verification_status || 'Pending'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            
            {/* Detailed Info Panel for Selected Round */}
            {selectedRound && (
                <RoundDetailPanel
                    round={selectedRound}
                    applicantId={studentDetails.applicantId}
                    handleDocumentDownload={handleDocumentDownload}
                    cohortId={cohortId}
                />
            )}

            {error && (
                <div className="p-4 mt-8 bg-red-100 text-red-700 border border-red-400 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
};


 const renderListView = () => (
    <div className={styles.container}>
        <Breadcrumbs 
            path={currentPath} 
            nonLinkSegments={['Admin', 'Admissions', 'Tracking']} 
        />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 mt-4 border-b pb-2">
            Interview & Home Verification Tracking
        </h1>

        <div className={styles.filterSection}>
            {/* Line 1: Interviewer Dropdown */}
            <div className={styles.filterGroup}>
                <label htmlFor="interviewer-select" className={styles.filterLabel}>
                    Filter by Interviewer:
                </label>
                <select
                    id="interviewer-select"
                    value={selectedInterviewerId || ''}
                    onChange={handleInterviewerChange}
                    disabled={selectedStatuses.length > 0 || selectedResults.length > 0}
                    className={styles.selectInput}
                >
                    <option value="">-- Select Interviewer --</option>
                    {interviewers.map(i => (
                        <option key={i.interviewer_id} value={i.interviewer_id}>
                            {i.interviewer_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Line 2: Status Buttons side-by-side */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Filter by Status:</label>
                <div className={styles.filterActionsRow}>
                    {STATUS_OPTIONS.map(status => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusToggle(status)}
                            disabled={!!selectedInterviewerId}
                            className={`${styles.filterButton} ${
                                selectedStatuses.includes(status) ? styles.activeFilter : ''
                            } ${selectedInterviewerId ? styles.optionBoxDisabled : ''}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Line 3: Result Buttons side-by-side */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Filter by Result/Requirement:</label>
                <div className={styles.filterActionsRow}>
                    {RESULT_OPTIONS.map(result => (
                        <button
                            key={result}
                            type="button"
                            onClick={() => handleResultToggle(result)}
                            disabled={!!selectedInterviewerId}
                            className={`${styles.filterButton} ${
                                selectedResults.includes(result) ? styles.activeFilter : ''
                            } ${selectedInterviewerId ? styles.optionBoxDisabled : ''}`}
                        >
                            {result}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {loading && (
            <div className="text-center py-10">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-t-4 border-blue-600 border-opacity-25 rounded-full"></div>
                <p className="mt-2 text-blue-600">Loading student data...</p>
            </div>
        )}

        {error && <div className="p-4 bg-red-100 text-red-700 border border-red-400 rounded-lg">{error}</div>}

        {!loading && students.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl shadow-lg border border-gray-200">
                <p className="text-gray-500 text-lg">No students found matching the criteria.</p>
            </div>
        )}

        {!loading && students.length > 0 && (
            <>
                {/* Clean Floating Rectangle Grid */}
                <div className={styles.studentGrid}>
                    {students.map(student => (
                        <div key={student.applicant_id} className={styles.studentCard} onClick={() => handleCardClick(student.applicant_id)}>
                            <div>
                                <div className="font-bold text-lg text-blue-700">
                                    {student.student_name}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    Latest Round: {student.interview_round || 'N/A'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-semibold text-gray-600 mb-1">
                                    Latest Evaluation
                                </div>
                                <StatusBadge status={student.status} result={student.result} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* 🔥 NEW MODERN PAGINATION FORMAT 🔥 */}
                <div className={styles.paginationContainer}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.paginationBtn}
                    >
                        ← Previous
                    </button>
                    
                    <span className={styles.pageInfo}>
                        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={styles.paginationBtn}
                    >
                        Next →
                    </button>
                </div>
            </>
        )}
    </div>
);

/* --- ALL YOUR OTHER CODE ABOVE --- */

    // 1. Define the Blocked View helper
    const renderPhaseBlocked = () => (
    <div className={styles.container}>
        <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Admissions']} />
        
        <div className={styles.blockedCard}>
            <span className={styles.blockedIcon}>🚫</span>
            <h2 className={styles.blockedTitle}>Evaluation Tracking Unavailable</h2>
            <p className={styles.blockedText}>
                This module is currently disabled because the 
                <span className="font-bold text-red-600"> {appliedConfig?.phase} </span> 
                phase has commenced.
            </p>
            <div className={styles.phaseLabel}>
                Current Status: {appliedConfig?.phase || 'N/A'}
            </div>
        </div>
    </div>
);

    /* --- THE GATEKEEPERS (This is what stops the "No students found" message) --- */
    
    // Check loading first
    if (configLoading) {
        return <div className="p-10 text-center font-bold">Checking system status...</div>;
    }

    // Check blocking phase second
    if (isClassesStarted) {
        return renderPhaseBlocked();
    }

    /* --- THE FINAL RETURN (Only runs if phase is NOT Classes Started) --- */
    return (
        <div className="font-sans">
            {view === 'list' ? renderListView() : (
                <DetailsView
                    studentDetails={studentDetails}
                    handleBackToList={handleBackToList}
                    error={error}
                    cohortId={cohortId}
                />
            )}
        </div>
    );
}; // Component End

export default EvaluationTracking;