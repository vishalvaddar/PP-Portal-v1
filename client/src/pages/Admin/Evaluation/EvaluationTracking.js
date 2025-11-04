/**
 * @fileoverview Single-file React component for Interview and Home Verification Tracking.
 */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './EvaluationTracking.css'; 

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:5000/api/tracking';
const CURRENT_COHORT_FOLDER = 'cohort-2025'; 

// --- FILTER CONSTANTS (FIXED) ---
const STATUS_OPTIONS = ['Scheduled', 'Rescheduled', 'Completed'];
// FIX: Added 'Home Verification Submitted' back for filter functionality
const RESULT_OPTIONS = ['Accepted', 'Rejected', 'Home Verification Required'];


// --- MAIN COMPONENT ---
const EvaluationTracking = () => {
    // --- State Management ---
    const [view, setView] = useState('list');
    const [students, setStudents] = useState([]);
    const [interviewers, setInterviewers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);

    // Filter State
    const [selectedInterviewerId, setSelectedInterviewerId] = useState(null);
    const [selectedStatuses, setSelectedStatuses] = useState([]);  
    const [selectedResults, setSelectedResults] = useState([]);    

    const isFilteredList = !!selectedInterviewerId || selectedStatuses.length > 0 || selectedResults.length > 0;


    // --- Data Fetching ---

    const fetchInterviewers = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/interviewers`);
            setInterviewers(response.data);
        } catch (err) {
            setError('Could not load interviewer list. Ensure the backend server is running and reachable.');
            console.error(err);
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        let url = `${API_BASE_URL}/students?page=${currentPage}`;

        if (selectedInterviewerId) {
            url = `${API_BASE_URL}/students/interviewer/${selectedInterviewerId}?page=${currentPage}`;
        } else if (selectedStatuses.length > 0 || selectedResults.length > 0) {
            
            if (selectedStatuses.length > 0) {
                const statusParams = selectedStatuses.map(s => encodeURIComponent(s)).join(',');
                url += `&statuses=${statusParams}`;
            }
            if (selectedResults.length > 0) {
                const resultParams = selectedResults.map(r => encodeURIComponent(r)).join(',');
                url += `&results=${resultParams}`;
            }
        }
        
        try {
            const response = await axios.get(url);
            setStudents(response.data.students);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.currentPage);
        } catch (err) {
            setError('Failed to fetch student list. Check API server/database.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, selectedInterviewerId, selectedStatuses, selectedResults]);

    /**
     * FIX: Always fetches ALL interviews and verifications for the detail view 
     * to ensure documents and history are always visible.
     */
    const fetchStudentDetails = useCallback(async (applicantId) => {
        setLoading(true);
        setError(null);
        
        try {
            let studentName = 'N/A';
            
            const [interviewResponse, homeResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/students/${applicantId}/interviews/all`),
                axios.get(`${API_BASE_URL}/students/${applicantId}/home/all`)
            ]);

            let roundsData = [
                ...interviewResponse.data, 
                ...homeResponse.data.map(hv => ({ 
                    ...hv, 
                    is_home_verification: true, 
                    interview_round: 999 
                })) 
            ];
            
            roundsData.sort((a, b) => (a.interview_round || 0) - (b.interview_round || 0));
            
            studentName = roundsData.length > 0 ? (roundsData[0].student_name || 'N/A') : 'N/A';
            
            const details = {
                applicantId,
                studentName,
                rounds: roundsData 
            };
            
            setStudentDetails(details);
            setSelectedStudentId(applicantId);
            setView('details');
        } catch (err) {
            console.error('Fetch student details error:', err);
            setError('Failed to load student details.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInterviewers();
    }, [fetchInterviewers]);

    useEffect(() => {
        if (currentPage !== 1 && !isFilteredList) {
            setCurrentPage(1);
        } else {
            fetchStudents();
        }
    }, [selectedInterviewerId, selectedStatuses, selectedResults, currentPage, fetchStudents]);

    // --- Filter Handlers (Unchanged) ---
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
        // FIX: Now always call fetchStudentDetails without the filtered flag, 
        // ensuring ALL rounds are loaded for the detail view.
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

    // --- Helper Components & Rendering (Unchanged) ---

    const StatusBadge = ({ status, result }) => {
        let color = 'bg-gray-200 text-gray-800';
        let resultDisplay = '';

        if (result) {
            resultDisplay = result;
            if (result === 'Accepted' || result === 'Completed') {
                color = 'bg-green-100 text-green-700';
            } else if (result === 'Rejected') {
                color = 'bg-red-100 text-red-700';
            }
        } else {
            resultDisplay = 'Not Submitted';
            if (status === 'Scheduled' || status === 'Rescheduled') {
                color = 'bg-yellow-100 text-yellow-700';
            } else if (status === 'Home Verification Required' || status === 'Home Verification Submitted') {
                color = 'bg-blue-100 text-blue-700';
            } else if (status === 'Completed') {
                color = 'bg-gray-100 text-gray-700';
            }
        }

        const statusLabel = status || 'N/A';
        const finalLabel = `Status: ${statusLabel} | Result: ${resultDisplay}`;

        return (
            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${color} whitespace-nowrap`}>
                {finalLabel}
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

        const title = isInterview ? `Interview Round ${round.interview_round}` : `Home Verification `;
        
        const status = isInterview ? round.status : (round.home_verification_status || 'Pending');
        const result = isInterview ? round.interview_result : (round.home_verification_status || 'Pending');
        
        const isSubmitted = isInterview ? !!round.interview_result : !!round.verification_id; 
        
        let statusClass = 'status-default';

        if (!isSubmitted) {
            statusClass = 'status-failure'; 
        } else {
            if (result === 'Accepted' || result === 'Completed' || result === 'Verified') {
                statusClass = 'status-success'; 
            } else if (result === 'Rejected' || result === 'Failed') {
                statusClass = 'status-failure'; 
            } else if (status === 'Scheduled' || status === 'Rescheduled' || result === 'Pending') {
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

const RoundDetailPanel = ({ round, applicantId, handleDocumentDownload }) => {
    const isInterview = !round.is_home_verification;
    const isHomeVerification = !!round.is_home_verification;

    const docName = isInterview ? round.doc_name : round.home_verification_doc_name;
    const docType = isInterview ? round.doc_type : round.home_verification_doc_type;
    
    // NOTE: The result variable is correctly determined here from interview_result or home_verification_status
    const finalResult = isInterview ? round.interview_result : (round.home_verification_status || 'N/A');
    const currentStatus = round.status || round.home_verification_status || 'N/A';
    
    const roundType = isInterview ? 'interview' : 'home';
    const cohortId = CURRENT_COHORT_FOLDER; 
    
    // Document exists check
    const documentExists = !!docName && !!docType; 
    
    // Determine the assignment/verifier details
    const assignedPerson = isInterview ? (round.interviewer || 'N/A') : (round.verified_by || 'N/A');
    const assignmentLabel = isInterview ? 'Interviewer' : 'Verified By';


    return (
        <div className="bg-white p-6 rounded-xl shadow-inner border border-gray-200 mt-4">
            <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">
                {isHomeVerification ? `Home Verification Details` : `Interview Evaluation (Round ${round.interview_round || 'N/A'})`}
            </h3>
            
            {/* --- PRIMARY DETAILS SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                {/* Col 1: Date, Time, Mode */}
                <div>
                    <p className="font-semibold text-gray-800 mb-2">Round Details</p>
                    <p className="mb-1">Date: {round.interview_date || round.date_of_verification || 'N/A'}</p>
                </div>
                
                {/* Col 2: Assignment, Status, Result */}
                <div>
                    <p className="mb-1"> Status: {currentStatus}</p>
                    <p className="mb-1 font-bold">
                        Final Result: <span className="text-blue-700">{finalResult || 'Not Submitted'}</span>
                    </p>
                    <p className="mb-1">
                        {assignmentLabel}: {assignedPerson}
                    </p>
                </div>
            </div>

            {/* --- HOME VERIFICATION SPECIFIC DETAILS --- */}
            {isHomeVerification && (
                <div className="mt-4 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                        <p className="mb-1">Verification Type: {round.home_verification_type || 'N/A'}</p>
                        <p className="mb-1">Remarks: {round.remarks || 'N/A'}</p>
                    </div>
                </div>
            )}


            {/* --- INTERVIEW SCORES --- */}
            {isInterview && (
                <div className="mt-6 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                        <p>Life Goals & Zeal: {round.life_goals_and_zeal || 'N/A'}</p>
                        <p>Commitment to Learning: {round.commitment_to_learning || 'N/A'}</p>
                        <p>Integrity: {round.integrity || 'N/A'}</p>
                        <p>Communication Skills: {round.communication_skills || 'N/A'}</p>
                    </div>
                </div>
            )}
            
            {/* --- DOCUMENT DOWNLOAD SECTION --- */}
            {documentExists && (
                <div className="mt-6 pt-3 border-t flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 truncate mr-4">
                        Uploaded File: {docName} ({docType})
                    </p>
                    <button
                        onClick={() => handleDocumentDownload(applicantId, roundType, cohortId)}
                        className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-md"
                    >
                        View
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
        
        // --- HOME VERIFICATION ALERT LOGIC ---
        const requiresHomeVerification = rounds.some(
            r => r.home_verification_req_yn === 'Y'
        );

        const hasSubmittedVerification = rounds.some(
             r => r.is_home_verification
        );

        const showAlert = requiresHomeVerification && !hasSubmittedVerification;
        
        let roundToShowOnAlert = null;
        if (showAlert) {
             const requestIndex = rounds.findIndex(r => r.home_verification_req_yn === 'Y');
             if (requestIndex !== -1) {
                 roundToShowOnAlert = rounds[requestIndex];
             }
        }
        // -------------------------------------

        return (
            <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
                <button
                    onClick={handleBackToList}
                    className="mb-6 text-blue-600 hover:text-blue-800 font-medium transition"
                >
                    ← Back to Student List
                </button>
                <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border-t-4 border-blue-500">
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        {studentDetails.studentName}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Applicant ID: {studentDetails.applicantId}</p>
                </div>
                
                {/* Home Verification Alert */}
                {showAlert && roundToShowOnAlert && (
                    <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-400 rounded-lg font-semibold">
                        ⚠️ ACTION REQUIRED: Home Verification was requested during **Round {roundToShowOnAlert.interview_round}** by {roundToShowOnAlert.interviewer || 'N/A'}, but no verification record has been submitted yet. Please submit the data.
                    </div>
                )}

                {isLatestRoundView ? (
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Latest Evaluation Round (Filtered)</h2>
                ) : (
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Evaluation Rounds</h2>
                )}
                
                {rounds.length === 0 && (
                    <div className="p-6 bg-yellow-100 text-yellow-700 border border-yellow-400 rounded-lg">
                        No interview or home verification rounds have been recorded for this student yet.
                    </div>
                )}
                
                {rounds.length > 0 && (
                    <div className={`grid gap-4 mb-6 ${isLatestRoundView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {rounds.map((round, index) => (
                            <RoundSelectorBox
                                key={index}
                                round={round}
                                index={index}
                                isActive={index === activeRoundIndex}
                                setActiveRoundIndex={setActiveRoundIndex}
                            />
                        ))}
                    </div>
                )}
                
                {selectedRound && (
                    <RoundDetailPanel
                        round={selectedRound}
                        applicantId={studentDetails.applicantId}
                        handleDocumentDownload={handleDocumentDownload}
                    />
                )}
                {error && <div className="p-4 mt-8 bg-red-100 text-red-700 border border-red-400 rounded-lg">{error}</div>}
            </div>
        );
    };

    const renderListView = () => (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">Interview & Home Verification Tracking</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. Interviewer Filter */}
                    <div>
                        <label htmlFor="interviewer-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Interviewer:
                        </label>
                        <select
                            id="interviewer-select"
                            value={selectedInterviewerId || ''}
                            onChange={handleInterviewerChange}
                            disabled={selectedStatuses.length > 0 || selectedResults.length > 0}
                            className={`w-full p-2.5 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition ${selectedInterviewerId ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">-- Select Interviewer --</option>
                            {interviewers.map(i => (
                                <option key={i.interviewer_id} value={i.interviewer_id}>
                                    {i.interviewer_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* 2. Status Filter (Interview Status) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Status :
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusToggle(status)}
                                    disabled={!!selectedInterviewerId}
                                    className={`
                                        px-3 py-1.5 text-sm font-medium rounded-full transition duration-150 ease-in-out
                                        ${selectedStatuses.includes(status)
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }
                                        ${selectedInterviewerId ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Result Filter (Final Outcome) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Result/Requirement:
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {RESULT_OPTIONS.map(result => (
                                <button
                                    key={result}
                                    onClick={() => handleResultToggle(result)}
                                    disabled={!!selectedInterviewerId}
                                    className={`
                                        px-3 py-1.5 text-sm font-medium rounded-full transition duration-150 ease-in-out
                                        ${selectedResults.includes(result)
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }
                                        ${selectedInterviewerId ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {result}
                                </button>
                            ))}
                        </div>
                        {!selectedInterviewerId && (
                            <p className="text-xs text-gray-500 mt-2">Filters apply to the student's latest completed status OR required verification.</p>
                        )}
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
                <div className="text-center py-10 bg-white rounded-xl shadow-lg">
                    <p className="text-gray-500 text-lg">No students found matching the criteria.</p>
                </div>
            )}
            {!loading && students.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map(student => (
                            <StudentCard key={student.applicant_id} student={student} />
                        ))}
                    </div>
                    <div className="mt-8 flex justify-center items-center space-x-4">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            ← Previous
                        </button>
                        <span className="text-gray-700 font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            Next →
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="font-sans">
            {view === 'list' ? renderListView() : (
                <DetailsView
                    studentDetails={studentDetails}
                    handleBackToList={handleBackToList}
                    error={error}
                />
            )}
        </div>
    ); 
};

export default EvaluationTracking;