import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './EvaluationInterview.css'; 
 
const API_BASE_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/interview`;

const api = {
    getExamCenters: () => axios.get(`${API_BASE_URL}/exam-centers`),
    getUnassignedStudents: (centerName, nmmsYear) => axios.get(`${API_BASE_URL}/unassigned-students`, { params: { centerName, nmmsYear } }),
    getReassignableStudents: (centerName, nmmsYear) => axios.get(`${API_BASE_URL}/reassignable-students`, { params: { centerName, nmmsYear } }),
    getInterviewers: () => axios.get(`${API_BASE_URL}/interviewers`),
    assignStudents: (applicantIds, interviewerId, nmmsYear) => axios.post(`${API_BASE_URL}/assign-students`, { applicantIds, interviewerId, nmmsYear }),
    reassignStudents: (applicantIds, newInterviewerId, nmmsYear) => axios.post(`${API_BASE_URL}/reassign-students`, { applicantIds, newInterviewerId, nmmsYear }),
    downloadAssignmentReport: (applicantIds, nmmsYear, interviewerId) => {
        return axios.post(
            `${API_BASE_URL}/download-assignment-report`, 
            { applicantIds, nmmsYear, interviewerId }, 
            {
                responseType: 'blob', 
            }
        );
    },
    
    getStates: () => axios.get(`${API_BASE_URL}/states`),
    
    getDivisions: (stateName) => axios.get(`${API_BASE_URL}/divisions`, { params: { stateName } }),
    
    getDistricts: (divisionName) => axios.get(`${API_BASE_URL}/districts`, { params: { divisionName } }),
    
    getBlocks: (stateName, divisionName, districtName) => axios.get(`${API_BASE_URL}/blocks`, { params: { stateName, divisionName, districtName } }),

    getUnassignedBlockStudents: (stateName, districtName, blockName, nmmsYear) =>
      axios.get(`${API_BASE_URL}/unassigned-students-by-block`, { params: { stateName, districtName, blockName, nmmsYear } }),

    getReassignableBlockStudents: (stateName, districtName, blockName, nmmsYear) =>
      axios.get(`${API_BASE_URL}/reassignable-students-by-block`, { params: { stateName, districtName, blockName, nmmsYear } }),
};

function BlockAssignmentView() {
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]); 
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState(''); 
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    
    const [assignmentType, setAssignmentType] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedInterviewer, setSelectedInterviewer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    
    // Ensure NO_INTERVIEWER_ID is defined here for use in logic/JSX
    const NO_INTERVIEWER_ID = 'NO_ONE'; 
    const nmmsYear = new Date().getFullYear();


    useEffect(() => {
        api.getStates().then(res => setStates(res.data)).catch(() => setStates([]));
    }, []);


    // HOOK 1: Fetch Divisions when State changes
    useEffect(() => {
        setDivisions([]);
        setSelectedDivision('');
        setDistricts([]);
        setSelectedDistrict('');
        setBlocks([]);
        setSelectedBlock('');
        setStudents([]);

        if (selectedState) {
            api.getDivisions(selectedState)
               .then(res => setDivisions(res.data))
               .catch(() => setDivisions([]));
        }
    }, [selectedState]);


    // HOOK 2: Fetch Districts when Division changes
    useEffect(() => {
        setDistricts([]);
        setSelectedDistrict('');
        setBlocks([]);
        setSelectedBlock('');
        setStudents([]);

        if (selectedDivision) {
            api.getDistricts(selectedDivision)
               .then(res => setDistricts(res.data))
               .catch(() => setDistricts([]));
        }
    }, [selectedDivision]); 


    // HOOK 3: Fetch Blocks when District changes 
    useEffect(() => {
        setBlocks([]);
        setSelectedBlock('');
        setStudents([]);

        if (selectedDistrict && selectedDivision && selectedState) {
            api.getBlocks(selectedState, selectedDivision, selectedDistrict)
               .then(res => setBlocks(res.data))
               .catch(() => setBlocks([]));
        }
    }, [selectedDistrict, selectedDivision, selectedState]); 


    // HOOK 4: Fetch Students when Block selection changes 
    useEffect(() => {
        if (selectedState && selectedDivision && selectedDistrict && selectedBlock && assignmentType) {
            setLoading(true);
            setStudents([]);
            setSelectedStudents([]);
            setMessages([]);
            setSelectedInterviewer(null);

            const fetchFn = assignmentType === 'unassigned'
                ? api.getUnassignedBlockStudents
                : api.getReassignableBlockStudents;

            fetchFn(selectedState, selectedDistrict, selectedBlock, nmmsYear)
                .then(res => setStudents(res.data))
                .catch(() => setStudents([]))
                .finally(() => setLoading(false));
        } else {
            setStudents([]);
        }
    }, [selectedState, selectedDivision, selectedDistrict, selectedBlock, assignmentType, nmmsYear]);


    const handleStudentSelect = (applicantId, isChecked) => {
        if (isChecked) {
            setSelectedStudents(prev => [...prev, applicantId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== applicantId));
        }
    };

   const handleDownloadFile = useCallback(async ({ applicantIds, nmmsYear, interviewerId, interviewerName }) => {
    console.log(`[DOWNLOAD LOGIC] Initiated download for ${applicantIds.length} students assigned to ${interviewerName}.`);
    
    // 1. Prepare a clean filename
    // Replace spaces or special characters in the name with underscores for a valid filename
    const cleanInterviewerName = interviewerName.replace(/[^a-zA-Z0-9]+/g, '_');
    
    // 2. Construct the final filename using the name and current timestamp
    const filename = `Assignment_Report_${cleanInterviewerName}_${nmmsYear}.pdf`;

    try {
        const res = await api.downloadAssignmentReport(applicantIds, nmmsYear, interviewerId);
        
        const url = window.URL.createObjectURL(new Blob(
            [res.data], 
            { type: 'application/pdf' }
        ));
        
        const link = document.createElement('a');
        link.href = url;
        
        // 🔥 CORRECTION: Use the clean name variable here
        link.setAttribute('download', filename);
        
        document.body.appendChild(link);
        link.click();
        link.remove();
        
    } catch (error) {
        console.error("Download failed:", error);
        setMessages(prev => [...prev, "❌ Failed to automatically download assignment report."]);
    }
}, [setMessages]);


    const handleAssignOrReassign = () => {
        if (selectedStudents.length === 0) {
            setMessages(['Please select students.']);
            return;
        }
        if (!selectedInterviewer || !selectedInterviewer.id) {
            setMessages(['Please select an interviewer.']);
            return;
        }
        
        const actionText = selectedInterviewer.id === NO_INTERVIEWER_ID 
            ? `CANCEL the assignment for ${selectedStudents.length} student(s)`
            : `${assignmentType === 'unassigned' ? 'assign' : 'reassign'} ${selectedStudents.length} student(s) to ${selectedInterviewer.name}`;
            
        setModalMessage(`Are you sure you want to ${actionText}?`);
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setMessages([]);
        
        const isCancellation = selectedInterviewer.id === NO_INTERVIEWER_ID;
        
        try {
            let response;
            if (assignmentType === 'unassigned') {
                response = await api.assignStudents(selectedStudents, selectedInterviewer.id, nmmsYear);
            } else {
                response = await api.reassignStudents(selectedStudents, selectedInterviewer.id, nmmsYear);
            }
            
            const results = response.data?.results || [];
            const studentNameMap = new Map(students.map(s => [s.applicant_id, s.student_name]));
            
            const feedback = results.map(result => {
                const name = studentNameMap.get(result.applicantId) || `Applicant ID ${result.applicantId}`;
                switch (result.status) {
                    case 'Skipped': return `⚠️ Skipped: ${name} - Same interviewer assigned for previous interview`;
                    case 'Assigned': return `✅ Assigned: ${name} has been successfully assigned for Interview Round ${result.interviewRound}.`;
                    case 'Reassigned': return `✅ Reassigned: ${name} was successfully reassigned for Interview Round ${result.interviewRound}.`;
                    case 'Cancelled': return `🗑️ Unassigned: ${name} was successfully unassigned.`;
                    case 'Failed': return `❌ Failed: ${name} - ${result.reason || 'An unexpected error occurred.'}`;
                    default: return `ℹ️ Status: ${name} ${result.status}`;
                }
            });
            setMessages(feedback);

            const successfullyAssignedIds = results
                .filter(r => (r.status === 'Assigned' || r.status === 'Reassigned') && !isCancellation)
                .map(r => r.applicantId);

            if (successfullyAssignedIds.length > 0) {
                await handleDownloadFile({
                    applicantIds: successfullyAssignedIds,
                    nmmsYear: nmmsYear,
                    interviewerId: selectedInterviewer.id,
                    interviewerName: selectedInterviewer.name
                });
            }

            const fetchFn = assignmentType === 'unassigned'
                ? api.getUnassignedBlockStudents
                : api.getReassignableBlockStudents;
            const refreshed = await fetchFn(selectedState, selectedDistrict, selectedBlock, nmmsYear);
            setStudents(refreshed.data);
            setSelectedStudents([]);
            setSelectedInterviewer(null);
            
        } catch (err) {
            setMessages([`Error: ${err.response?.data?.error || err.message}`]);
        } finally {
            setLoading(false);
        }
    };


    // --- JSX RENDER ---
    return (
        <div className="p-6 bg-gray-50 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Assign/Reassign by Block</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                
                {/* State Dropdown */}
                <div>
                    <label>State</label>
                    <select value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                        <option value="">Select State</option>
                        {states.map(s => (
                            <option key={s.juris_code} value={s.juris_name}>{s.juris_name}</option>
                        ))}
                    </select>
                </div>

                {/* Division Dropdown */}
                <div>
                    <label>Division</label>
                    <select value={selectedDivision} onChange={e => setSelectedDivision(e.target.value)} disabled={!selectedState}>
                        <option value="">Select Division</option>
                        {divisions.map(d => (
                            <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>
                        ))}
                    </select>
                </div>
                
                {/* District Dropdown (Depends on Division) */}
                <div>
                    <label>District</label>
                    <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedDivision}>
                        <option value="">Select District</option>
                        {districts.map(d => (
                            <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Block Dropdown (Depends on District) */}
                <div>
                    <label>Block</label>
                    <select value={selectedBlock} onChange={e => setSelectedBlock(e.target.value)} disabled={!selectedDistrict}>
                        <option value="">Select Block</option>
                        {blocks.map(b => (
                            <option key={b.juris_code} value={b.juris_name}>{b.juris_name}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <AssignmentTypeSelector onSelectType={setAssignmentType} selectedType={assignmentType} />
            
            {selectedBlock && assignmentType && (
                <>
                    {loading ? (
                        <div>Loading students...</div>
                    ) : students.length === 0 ? (
                        <div>No students found for this block and type.</div>
                    ) : (
                        <>
                            {/* Select All Checkbox */}
                            <div className="mb-2 flex justify-end items-center">
                                <label htmlFor="select-all-block" className="mr-2 text-gray-700 font-medium cursor-pointer">
                                    Select All
                                </label>
                                <input
                                    type="checkbox"
                                    id="select-all-block"
                                    checked={selectedStudents.length === students.length && students.length > 0}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setSelectedStudents(students.map(s => s.applicant_id));
                                        } else {
                                            setSelectedStudents([]);
                                        }
                                    }}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition-colors"
                                />
                            </div>
                            <ul className="space-y-3 mt-4">
                                {students.map(student => (
                                    <li key={student.applicant_id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.applicant_id)}
                                            onChange={e => handleStudentSelect(student.applicant_id, e.target.checked)}
                                        />
                                        <span>{student.student_name} - Score: {student.pp_exam_score}</span>
                                        {student.current_interviewer && (
                                            <span className="text-sm text-gray-500 ml-auto">
                                                (R{student.interview_round} to {student.current_interviewer})
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                                {/* 🔥 CRITICAL FIX: Conditionally render the correct dropdown */}
                                {assignmentType === 'unassigned' ? (
                                    <InterviewerDropdown // Assumes this version D-O-E-S NOT have the 'No one' option
                                        onSelectInterviewer={setSelectedInterviewer}
                                        selectedInterviewerId={selectedInterviewer?.id}
                                    />
                                ) : (
                                    <InterviewerDropdown2 // Assumes this version D-O-E-S have the 'No one' option
                                        onSelectInterviewer={setSelectedInterviewer}
                                        selectedInterviewerId={selectedInterviewer?.id}
                                    />
                                )}
                                <button
                                    onClick={handleAssignOrReassign}
                                    disabled={loading || selectedStudents.length === 0 || !selectedInterviewer || !selectedInterviewer.id}
                                    className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
                                >
                                    {selectedInterviewer?.id === NO_INTERVIEWER_ID 
                                        ? `Cancel ${selectedStudents.length} Assignment(s)` 
                                        : (assignmentType === 'unassigned' ? 'Assign Selected Students' : 'Reassign Selected Students')
                                    }
                                </button>
                            </div>
                            {messages.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {messages.map((msg, idx) => (
                                        <p key={idx} className={`p-3 rounded-lg text-sm ${
                                            msg.includes('Error') ? 'bg-red-100 text-red-700' :
                                            (msg.includes('Skipped') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')
                                        }`}>{msg}</p>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
            {showConfirmModal && (
                <ConfirmationModal
                    message={modalMessage}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
}

function ExamCenterDropdown({ onSelectCenter }) {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCenters = async () => {
            try {
                const response = await api.getExamCenters();
                setCenters(response.data);
            } catch (err) {
                setError('Failed to load exam centers.');
                console.error('Error fetching exam centers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCenters();
    }, []);

    if (loading) return <div className="message-box loading-message">Loading exam centers...</div>;
    if (error) return <div className="message-box error-message">Error: {error}</div>;

    return (
        <div>
            <label htmlFor="exam-center-select">Select Exam Center:</label>
            <select id="exam-center-select" onChange={(e) => onSelectCenter(e.target.value)}>
                <option value="">--Please choose an option--</option>
                {centers.map((center) => (
                    <option key={center.pp_exam_centre_id} value={center.pp_exam_centre_name}>
                        {center.pp_exam_centre_name}
                    </option>
                ))}
            </select>
        </div>
    );
}
const sanitizeFilename = (filename) => {
    let sanitized = filename.replace(/[<>:"/\\|?*]/g, '_');
    return sanitized.replace(/[\s]+/g, '_').substring(0, 100); 
};
function AssignmentTypeSelector({ onSelectType, selectedType }) {
    return (
        <div className="radio-group">
            <label>Select Assignment Type:</label>
            <div>
                <input
                    type="radio"
                    id="unassigned"
                    name="assignmentType"
                    value="unassigned"
                    checked={selectedType === "unassigned"}
                    onChange={(e) => onSelectType(e.target.value)}
                />
                <label htmlFor="unassigned">Unassigned</label>
            </div>
            <div>
                <input
                    type="radio"
                    id="reassign"
                    name="assignmentType"
                    value="reassign"
                    checked={selectedType === "reassign"}
                    onChange={(e) => onSelectType(e.target.value)}
                />
                <label htmlFor="reassign">Reassign</label>
            </div>
        </div>
    );
}

// --- Component: ConfirmationModal ---
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform transition-all">
                <p className="text-xl mb-6 text-gray-800">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onConfirm}
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full shadow-md hover:bg-blue-700 transition duration-300 transform hover:scale-105"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={onCancel}
                        className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-full shadow-md hover:bg-gray-400 transition duration-300 transform hover:scale-105"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

function AssignmentReportDownloader({ interviewerId, interviewerName, nmmsYear, applicantIds, isDisabled, buttonLabel }) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDisabled || isDownloading) return;
        setIsDownloading(true);

        try {
            // 🔥 CORRECTION: Pass the required interviewerId as the third argument.
            // This ensures the backend receives all necessary data, fixing the 400 Bad Request if data was missing.
            const response = await api.downloadAssignmentReport(applicantIds, nmmsYear, interviewerId);
            
            // --- FIX: Use correct MIME type for PDF response ---
            const contentType = response.headers['content-type'] || 'application/pdf';
            const fileExtension = contentType.includes('json') ? 'txt' : (contentType.includes('pdf') ? 'pdf' : 'txt');
            
            // Use the actual content type from the response headers and PDF extension
            const fileName = sanitizeFilename(`Assignment_Report_${interviewerName || 'Students'}_${nmmsYear}.${fileExtension}`);
            const blob = new Blob([response.data], { type: contentType });
            
            // Standard file download logic
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error downloading report:', error);

            // Detailed error logging for 400/500 JSON responses embedded in a blob
            if (error.response && error.response.data instanceof Blob) {
                 const text = await error.response.data.text();
                 console.error('Backend Error Response:', text);
                 alert(`Failed to download report. Server responded with: ${text.substring(0, 100)}...`);
            } else {
                 alert('Failed to download the report. Check console for network or validation errors.');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDisabled || isDownloading}
            className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
            {isDownloading ? 'Preparing Report...' : buttonLabel}
        </button>
    );
}


const handleDownloadFile = async ({ applicantIds, nmmsYear, interviewerId, interviewerName }) => {
    if (!interviewerId || interviewerId === NO_INTERVIEWER_ID || applicantIds.length === 0) {
        console.warn("Download skipped: No valid interviewer or no students selected for report.");
        return;
    }
    
    
    try {
        const response = await api.downloadAssignmentReport(applicantIds, nmmsYear, interviewerId);
        
        const contentType = response.headers['content-type'] || 'application/pdf';
        const fileExtension = contentType.includes('json') ? 'txt' : (contentType.includes('pdf') ? 'pdf' : 'txt');
        
        const fileName = sanitizeFilename(`Assignment_Report_${interviewerName || interviewerId}_${nmmsYear}.${fileExtension}`);
        const blob = new Blob([response.data], { type: contentType });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        console.log(`Successfully triggered download for ${applicantIds.length} students.`);

    } catch (error) {
        console.error('Error during automated report download:', error);
        if (error.response && error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            console.error('Backend Error Response:', text);
        }
        alert('Assignment successful, but report download failed. Check console for details.');
    }
};


function InterviewerDropdown({ onSelectInterviewer, selectedInterviewerId }) {
    const [interviewers, setInterviewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInterviewers = async () => {
            try {
                const response = await api.getInterviewers();
                setInterviewers(response.data);
            } catch (err) {
                setError('Failed to load interviewers.');
                console.error('Error fetching interviewers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInterviewers();
    }, []);

    const handleInterviewerChange = (e) => {
        const selectedId = e.target.value;

        // 🔥 FIX: This dropdown is for ASSIGNMENT ONLY. We only check for a valid interviewer ID.
        if (selectedId) { 
            const selectedInterviewer = interviewers.find(
                (interviewer) => String(interviewer.interviewer_id) === String(selectedId)
            );
            
            onSelectInterviewer({ 
                // Convert to int
                id: parseInt(selectedId), 
                name: selectedInterviewer?.interviewer_name || '' 
            });
        } else {
            // Placeholder selected
            onSelectInterviewer(null);
        }
    };


    if (loading) return <div className="p-2 text-center text-gray-500 w-full md:w-1/2">Loading interviewers...</div>;
    if (error) return <div className="p-2 text-center text-red-500 w-full md:w-1/2">Error: {error}</div>;

    return (
        <div className="w-full md:w-1/2">
            <label htmlFor="interviewer-select-1" className="block text-sm font-medium text-gray-700 mb-1">
                Select Interviewer:
            </label>
            <select
                id="interviewer-select-1"
                onChange={handleInterviewerChange}
                value={selectedInterviewerId || ""} 
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
            >
                <option key="select-interviewer-placeholder" value="">
                    --Please select an interviewer
                </option>
                
                {/* NO 'NO ONE' OPTION HERE */}
                
                {interviewers.map((interviewer) => (
                    <option
                        key={interviewer.interviewer_id}
                        value={interviewer.interviewer_id}
                    >
                        {interviewer.interviewer_name}
                    </option>
                ))}
            </select>
        </div>
    );
}

function UnassignedStudentsList({ selectedCenter }) {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedInterviewer, setSelectedInterviewer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignmentMessages, setAssignmentMessages] = useState([]);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const nmmsYear = new Date().getFullYear();

    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedCenter) return;
            setLoading(true);
            setError(null);
            setStudents([]);
            setSelectedStudents([]);
            setAssignmentMessages([]);
            setSelectedInterviewer(null);
            try {
                const response = await api.getUnassignedStudents(selectedCenter, nmmsYear);
                setStudents(response.data);
            } catch (err) {
                setError('Failed to load unassigned students.');
                console.error('Error fetching unassigned students:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedCenter, nmmsYear]);

    const handleStudentSelect = (applicantId, isChecked) => {
        if (isChecked) {
            setSelectedStudents((prev) => [...prev, applicantId]);
        } else {
            setSelectedStudents((prev) => prev.filter((id) => id !== applicantId));
        }
    };

    const formatAssignmentMessages = (results, allStudents) => {
        const resultsArray = Array.isArray(results) ? results : Array.from(results ?? []);
        
        if (resultsArray.length === 0) {
            return ['No assignment results were returned by the server.'];
        }

        const messages = [];
        const studentNameMap = new Map();
        allStudents.forEach(student => {
            studentNameMap.set(student.applicant_id, student.student_name);
        });

        resultsArray.forEach(result => {
            const studentName = studentNameMap.get(result.applicantId) || `Applicant ID ${result.applicantId}`;
            let message = '';

            switch (result.status) {
                case 'Skipped':
                    message = `⚠️ Skipped: ${studentName} - Same interviewer assigend for previous interview`;
                    break;
                case 'Assigned':
                    message = `✅ Assigned: ${studentName} has been successfully assigned for Interview Round ${result.interviewRound}.`;
                    break;
                case 'Reassigned (from Rescheduled)':
                    message = `🔄 Reassigned: ${studentName} (previously rescheduled) has been assigned for Interview Round ${result.interviewRound}.`;
                    break;
                case 'Failed':
                    message = `❌ Failed: ${studentName} - ${result.reason || 'An unexpected error occurred during assignment.'}`;
                    break;
                default:
                    message = `ℹ️ Status: ${studentName} ${result.status}`;
                    break;
            }
            messages.push(message);
        });
        return messages;
    };

    const handleAssign = () => {
        if (selectedStudents.length === 0) {
            setAssignmentMessages(['Please select students to assign.']);
            return;
        }
        if (!selectedInterviewer || !selectedInterviewer.id) {
            setAssignmentMessages(['Please select an interviewer.']);
            return;
        }

        setModalMessage(`Are you sure you want to assign ${selectedStudents.length} student(s) to ${selectedInterviewer.name}?`);
        setShowConfirmModal(true);
    };

    const handleConfirmAssignment = async () => {
        setShowConfirmModal(false);

        setLoading(true);
        setError(null);
        setAssignmentMessages([]);
        try {
            const response = await api.assignStudents(selectedStudents, selectedInterviewer.id, nmmsYear);

            const assignmentResults = Array.isArray(response?.data?.results) 
                ? response.data.results 
                : (Array.isArray(response?.results) ? response.results : 
                (Array.isArray(response?.data) ? response.data : [])); 
            
            const feedbackMessages = formatAssignmentMessages(assignmentResults, students);
            setAssignmentMessages(feedbackMessages);

            // 🔥 NEW LOGIC: Filter for SUCCESSFULLY ASSIGNED students only
            const successfullyAssignedIds = assignmentResults
                .filter(r => r.status === 'Assigned' || r.status === 'Reassigned (from Rescheduled)')
                .map(r => r.applicantId);

            // 🔥 NEW LOGIC: AUTOMATIC DOWNLOAD FOR SUCCESSFUL ASSIGNMENTS
            if (successfullyAssignedIds.length > 0) {
                handleDownloadFile({
                    applicantIds: successfullyAssignedIds,
                    nmmsYear: nmmsYear,
                    interviewerId: selectedInterviewer.id,
                    interviewerName: selectedInterviewer.name
                });
            }

            const refreshedResponse = await api.getUnassignedStudents(selectedCenter, nmmsYear);
            setStudents(refreshedResponse.data);
            setSelectedStudents([]);
            setSelectedInterviewer(null);
        } catch (err) {
            const errorMessage = `Error assigning students: ${err.response?.data?.error || err.message}`;
            setAssignmentMessages([errorMessage]);
            setError('Error during assignment.');
            console.error('Assignment error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAssignment = () => {
        setShowConfirmModal(false);
    };

    // The old "shouldShowDownloadForAssignment" logic is now irrelevant as the button is gone.
    
    if (!selectedCenter) return <div className="p-6 text-center text-gray-600 bg-gray-100 rounded-lg">Please select an exam center first.</div>;
    if (loading && students.length === 0) return <div className="p-6 text-center text-gray-600 bg-gray-100 rounded-lg">Loading unassigned students...</div>;
    if (error) return <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 rounded-xl shadow-lg font-sans">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                Unassigned Students for {selectedCenter}
            </h2>

            {students.length === 0 ? (
                <p className="p-4 text-center text-gray-600 bg-gray-100 rounded-lg">
                    No unassigned students found for this center.
                </p>
            ) : (
                <>
                    {/* Select All Checkbox */}
                    <div className="mb-2 flex justify-end items-center">
                        <label htmlFor="select-all-unassigned" className="mr-2 text-gray-700 font-medium cursor-pointer">
                            Select All
                        </label>
                        <input
                            type="checkbox"
                            id="select-all-unassigned"
                            checked={selectedStudents.length === students.length && students.length > 0}
                            onChange={e => {
                                if (e.target.checked) {
                                    setSelectedStudents(students.map(s => s.applicant_id));
                                } else {
                                    setSelectedStudents([]);
                                }
                            }}
                            className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition-colors"
                        />
                    </div>
                    
                    {/* Student List */}
                    <div className="overflow-y-auto max-h-96 pr-2">
                        <ul className="space-y-3">
                            {students.map((student) => (
                                <li key={student.applicant_id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <input
                                        type="checkbox"
                                        id={`unassigned-student-${student.applicant_id}`}
                                        checked={selectedStudents.includes(student.applicant_id)}
                                        onChange={(e) => handleStudentSelect(student.applicant_id, e.target.checked)}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition-colors"
                                    />
                                    <label htmlFor={`unassigned-student-${student.applicant_id}`} className="flex-1 text-gray-700 cursor-pointer">
                                        <span className="font-semibold">{student.student_name}</span> - Score: {student.pp_exam_score} - School: {student.institute_name || 'N/A'}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                        <InterviewerDropdown
                            onSelectInterviewer={setSelectedInterviewer}
                            selectedInterviewerId={selectedInterviewer?.id}
                        />
                        <button
                            onClick={handleAssign}
                            disabled={loading || selectedStudents.length === 0 || !selectedInterviewer || !selectedInterviewer.id}
                            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
                        >
                            Assign Selected Students
                        </button>
                    </div>

                    {/* Download Button REMOVED HERE, now automatic */}
                    
                    {assignmentMessages.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {assignmentMessages.map((msg, index) => (
                                <p
                                    key={index}
                                    className={`p-3 rounded-lg text-sm ${
                                        msg.includes('Error') ? 'bg-red-100 text-red-700' :
                                        (msg.includes('Skipped') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')
                                    }`}
                                >
                                    {msg}
                                </p>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showConfirmModal && (
                <ConfirmationModal
                    message={modalMessage}
                    onConfirm={handleConfirmAssignment}
                    onCancel={handleCancelAssignment}
                />
            )}
        </div>
    );
};


// Assuming 'api', 'ConfirmationModal', 'handleDownloadFile', and 'NO_INTERVIEWER_ID' are defined/imported
// For a standalone file, you would define NO_INTERVIEWER_ID here:
const NO_INTERVIEWER_ID = 'NO_ONE'; 

function InterviewerDropdown2({ onSelectInterviewer, selectedInterviewerId }) {
    const [interviewers, setInterviewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInterviewers = async () => {
            try {
                // Fetch the list of interviewers from the API
                const response = await api.getInterviewers();
                setInterviewers(response.data);
            } catch (err) {
                setError('Failed to load interviewers.');
                console.error('Error fetching interviewers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInterviewers();
    }, []);

    const handleInterviewerChange = (e) => {
        const selectedId = e.target.value;

        if (selectedId === NO_INTERVIEWER_ID) {
            // Cancellation: Pass the special string ID and 'No one' name
            onSelectInterviewer({ id: selectedId, name: 'No one' });
        } else if (selectedId) {
            // Reassignment: Find the name of the selected interviewer
            const selectedInterviewer = interviewers.find(
                (interviewer) => String(interviewer.interviewer_id) === String(selectedId)
            );
            
            onSelectInterviewer({ 
                id: selectedId, 
                name: selectedInterviewer?.interviewer_name || '' 
            });
        } else {
            // Placeholder selected
            onSelectInterviewer(null);
        }
    };

    if (loading) return <div className="p-2 text-center text-gray-500 w-full md:w-1/2">Loading interviewers...</div>;
    if (error) return <div className="p-2 text-center text-red-500 w-full md:w-1/2">Error: {error}</div>;

    return (
        <div className="w-full md:w-1/2">
            <label htmlFor="interviewer-select-2" className="block text-sm font-medium text-gray-700 mb-1">
                Select Interviewer:
            </label>
            <select
                id="interviewer-select-2"
                onChange={handleInterviewerChange}
                value={selectedInterviewerId || ""} 
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
            >
                <option key="select-interviewer-placeholder" value="">
                    --Please select an interviewer
                </option>
                
                {/* RENDER CANCELLATION OPTION EXPLICITLY */}
                <option 
                    key={NO_INTERVIEWER_ID} 
                    value={NO_INTERVIEWER_ID}
                >
                    No one (Cancel Assignment)
                </option>
                
                {/* Render the actual interviewers from the fetched state */}
                {interviewers.map((interviewer) => (
                    <option
                        key={interviewer.interviewer_id}
                        value={interviewer.interviewer_id}
                    >
                        {interviewer.interviewer_name}
                    </option>
                ))}
            </select>
        </div>
    );
}

// --- ReassignStudentsList Component ---

function ReassignStudentsList({ selectedCenter }) { 
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    // State for the selected interviewer/action. Initialized to null to show placeholder.
    const [newInterviewer, setNewInterviewer] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reassignmentMessages, setReassignmentMessages] = useState([]);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const nmmsYear = new Date().getFullYear();

    const fetchStudents = useCallback(async () => {
        if (!selectedCenter) return;
        setLoading(true);
        setError(null);
        setStudents([]);
        setSelectedStudents([]);
        
        // 🔥 FIX APPLIED: REMOVE setNewInterviewer(null) from here!
        // The selection should be persistent across re-fetches unless an action
        // is explicitly confirmed or the selectedCenter changes.
        // setNewInterviewer(null); // <-- DELETED

        try {
            const response = await api.getReassignableStudents(selectedCenter, nmmsYear);
            setStudents(response.data);
        } catch (err) {
            setError('Failed to load reassignable students.');
            console.error('Error fetching reassignable students:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCenter, nmmsYear]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleStudentSelect = (applicantId, isChecked) => {
        if (isChecked) {
            setSelectedStudents((prev) => [...prev, applicantId]);
        } else {
            setSelectedStudents((prev) => prev.filter((id) => id !== applicantId));
        }
    };

    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            setSelectedStudents(students.map(s => s.applicant_id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleReassign = () => {
        if (selectedStudents.length === 0) {
            setReassignmentMessages(['Please select students to reassign or cancel.']);
            return;
        }
        if (!newInterviewer || !newInterviewer.id) {
            setReassignmentMessages(['Please select an action using the dropdown.']);
            return;
        }

        const actionText = newInterviewer.id === NO_INTERVIEWER_ID 
            ? `CANCEL the assignment for ${selectedStudents.length} student(s)` 
            : `reassign ${selectedStudents.length} student(s) to ${newInterviewer.name}`;
            
        setModalMessage(`Are you sure you want to ${actionText}?`);
        setShowConfirmModal(true);
    };

    const handleConfirmReassignment = async () => {
        setShowConfirmModal(false);

        setLoading(true);
        setError(null);
        setReassignmentMessages([]);
        try {
            const response = await api.reassignStudents(selectedStudents, newInterviewer.id, nmmsYear);
            
            const reassignmentResults = response?.data?.results || [];

            const feedbackMessages = formatReassignmentMessages(reassignmentResults, students);
            setReassignmentMessages(feedbackMessages);

            // Filter for SUCCESSFULLY REASSIGNED students only
            const successfullyReassignedIds = reassignmentResults
                .filter(r => r.status === 'Reassigned')
                .map(r => r.applicantId);
            
            // AUTOMATIC DOWNLOAD FOR SUCCESSFUL REASSIGNMENTS
            if (successfullyReassignedIds.length > 0 && newInterviewer.id !== NO_INTERVIEWER_ID) {
                 handleDownloadFile({
                     applicantIds: successfullyReassignedIds,
                     nmmsYear: nmmsYear,
                     interviewerId: newInterviewer.id,
                     interviewerName: newInterviewer.name
                 });
            }

            await fetchStudents(); 
            
            setSelectedStudents([]);
            // This reset is correct: it clears the action after completion, forcing
            // the user to select a new one for the next batch.
            setNewInterviewer(null);

            setTimeout(() => {
                setReassignmentMessages([]);
            }, 5000);
            
        } catch (err) {
            const errorMessage = `Error reassigning students: ${err.response?.data?.error || err.message}`;
            setReassignmentMessages([errorMessage]);
            setError('Error during reassignment.');
            console.error('Reassignment error:', err);
            setTimeout(() => {
                setReassignmentMessages([]);
            }, 5000);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReassignment = () => {
        setShowConfirmModal(false);
    };

    const formatReassignmentMessages = (results, allStudents) => {
        const resultsArray = Array.isArray(results) ? results : Array.from(results ?? []);

        if (resultsArray.length === 0) {
            return ['No reassignment results were returned by the server.'];
        }

        const messages = [];
        const studentNameMap = new Map();
        allStudents.forEach(student => {
            studentNameMap.set(student.applicant_id, student.student_name);
        });

        resultsArray.forEach(result => {
            const studentName = studentNameMap.get(result.applicantId) || `Applicant ID ${result.applicantId}`;
            let message = '';
            const status = result.status || 'Unknown';

            switch (status) {
                case 'Skipped':
                    message = `⚠️ Skipped: ${studentName} - ${result.reason || 'Reason unknown.'}`;
                    break;
                case 'Reassigned':
                    // Note: Front-end uses 'Reassigned', back-end uses 'RESCHEDULED' for reassign,
                    // but the name change indicates success. Using Reassigned for consistency here.
                    message = `✅ Reassigned: ${studentName} was successfully reassigned for Interview Round ${result.interviewRound}.`;
                    break;
                case 'CANCELLED': // Using the constant value for consistency is better
                case 'Cancelled': 
                    message = `🗑️ Unassigned: ${studentName} was successfully unassigned.`;
                    break;
                case 'Failed':
                    message = `❌ Failed: ${studentName} - ${result.reason || 'An unexpected error occurred during reassignment.'}`;
                    break;
                default:
                    message = `ℹ️ Status: ${studentName} - Unknown status: ${result.status}`;
                    break;
            }
            messages.push(message);
        });
        return messages;
    };
    
    if (!selectedCenter) return <div className="p-6 text-center text-gray-600 bg-gray-100 rounded-lg">Please select an exam center first.</div>;
    if (loading && students.length === 0) return <div className="p-6 text-center text-gray-600 bg-gray-100 rounded-lg">Loading reassignable students...</div>;
    if (error) return <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;

    return (
        <div className="p-6 bg-gray-50 rounded-xl shadow-lg font-sans">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Reassign Students for {selectedCenter}</h2>
            
            {loading && students.length > 0 && (
                <div className="p-2 text-center text-sm text-blue-600 bg-blue-50 rounded-lg mb-4">Processing action...</div>
            )}
            
            {students.length === 0 ? (
                <p className="p-4 text-center text-gray-600 bg-gray-100 rounded-lg">
                    No students found for reassigning in this center.
                </p>
            ) : (
                <>
                    {/* Select All Checkbox */}
                    <div className="mb-2 flex justify-end items-center">
                        <label htmlFor="select-all-reassign" className="mr-2 text-gray-700 font-medium cursor-pointer">
                            Select All ({selectedStudents.length}/{students.length})
                        </label>
                        <input
                            type="checkbox"
                            id="select-all-reassign"
                            checked={selectedStudents.length === students.length && students.length > 0}
                            onChange={e => handleSelectAll(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition-colors cursor-pointer"
                        />
                    </div>
                    
                    {/* Student List */}
                    <div className="overflow-y-auto max-h-96 pr-2">
                        <ul className="space-y-3">
                            {students.map((student) => (
                                <li key={student.applicant_id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <input
                                        type="checkbox"
                                        id={`reassign-student-${student.applicant_id}`}
                                        checked={selectedStudents.includes(student.applicant_id)}
                                        onChange={(e) => handleStudentSelect(student.applicant_id, e.target.checked)}
                                        className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition-colors cursor-pointer"
                                    />
                                    <label htmlFor={`reassign-student-${student.applicant_id}`} className="flex-1 text-gray-700 cursor-pointer text-sm">
                                        <span className="font-semibold">{student.student_name}</span> - 
                                        Score: {student.pp_exam_score} - 
                                        Current: <span className="font-bold text-indigo-600">{student.current_interviewer || 'N/A'}</span> 
                                        (Round: {student.interview_round})
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Action Bar */}
                    <div className="mt-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                        <InterviewerDropdown2
                            onSelectInterviewer={setNewInterviewer}
                            selectedInterviewerId={newInterviewer?.id}
                        />
                        <button
                            onClick={handleReassign}
                            disabled={loading || selectedStudents.length === 0 || !newInterviewer || !newInterviewer.id}
                            className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white rounded-full font-bold shadow-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:shadow-none transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            {/* Dynamic button text */}
                            {newInterviewer?.id === NO_INTERVIEWER_ID 
                                ? `Cancel ${selectedStudents.length} Assignment(s)` 
                                : `Reassign Selected Students`
                            }
                        </button>
                    </div>

                    {/* Reassignment Messages */}
                    {reassignmentMessages.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto p-2 bg-white rounded-lg shadow-inner">
                            {reassignmentMessages.map((msg, index) => (
                                <p
                                    key={index}
                                    className={`p-3 rounded-lg text-sm ${
                                        msg.includes('Error') ? 'bg-red-100 text-red-700 font-medium' :
                                        (msg.includes('Skipped') ? 'bg-yellow-100 text-yellow-700' : 
                                        (msg.includes('Cancelled') || msg.includes('Unassigned') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'))
                                    }`}
                                >
                                    {msg}
                                </p>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showConfirmModal && (
                <ConfirmationModal
                    message={modalMessage}
                    onConfirm={handleConfirmReassignment}
                    onCancel={handleCancelReassignment}
                />
            )}
        </div>
    );
}


function AssignInterviewView() {
    const [selectedCenter, setSelectedCenter] = useState('');
    const [assignmentType, setAssignmentType] = useState('');
    const [assignmentFilter, setAssignmentFilter] = useState('exam'); // 'exam' or 'block'

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            {/* Assignment Filter Dropdown */}
            <div className="section-container mb-6">
                <label htmlFor="assignment-filter" className="block text-sm font-medium text-gray-700 mb-1">Assignment Filter</label>
                <select
                    id="assignment-filter"
                    value={assignmentFilter}
                    onChange={e => setAssignmentFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="exam">Assign by Exam</option>
                    <option value="block">Assign by Block</option>
                </select>
            </div>
            {assignmentFilter === 'exam' && (
                <>
                    <div className="section-container mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Select Exam Center</h2>
                        <ExamCenterDropdown onSelectCenter={setSelectedCenter} />
                    </div>
                    {selectedCenter && (
                        <div className="section-container mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Select Assignment Type</h2>
                            <AssignmentTypeSelector
                                onSelectType={setAssignmentType}
                                selectedType={assignmentType}
                            />
                        </div>
                    )}
                    {selectedCenter && assignmentType === 'unassigned' && (
                        <UnassignedStudentsList selectedCenter={selectedCenter} />
                    )}
                    {selectedCenter && assignmentType === 'reassign' && (
                        <ReassignStudentsList selectedCenter={selectedCenter} />
                    )}
                </>
            )}
            {assignmentFilter === 'block' && (
                <BlockAssignmentView />
            )}
        </div>
    );
}
 
 
const FillInterviewView = () => {
    // State to hold data fetched from the backend
    const [interviewers, setInterviewers] = useState([]);
    const [students, setStudents] = useState([]);

    // State for UI feedback and loading indicators
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState({ interviewers: false, students: false, submit: false });

    // State for selected items from the dropdowns
    const [selectedInterviewerId, setSelectedInterviewerId] = useState('');
    // Stores the full student object, including interview_round from PostgreSQL backend
    const [selectedStudent, setSelectedStudent] = useState(null);

    // New state to manage file upload
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');

    // New state to manage post-submission view
    const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', or null

    // Dynamically get the current year
    const currentYear = new Date().getFullYear().toString();
    const nmmsYear = currentYear; // Used for backend queries

    // State for all form data inputs 
    const [formData, setFormData] = useState({
        interviewDate: '',
        interviewTimeHours: '',
        interviewTimeMinutes: '',
        interviewTimeAmPm: 'AM',
        interviewMode: '',
        interviewStatus: '',
        lifeGoalsAndZeal: '',
        commitmentToLearning: '',
        integrity: '',
        communicationSkills: '',
        homeVerificationRequired: '',
        interviewResult: '',
        remarks: '', 
    });

    // Get today's date in 'YYYY-MM-DD' format for the date input's max attribute
    const todayDate = new Date().toISOString().split('T')[0];

    // Custom function to show a message box
    const showMessageBox = (type, text) => {
        setMessage({ type, text });
    };

    // Resets the entire form to its initial state
    const resetFormAndSelections = () => {
        setSubmissionStatus(null);
        setSelectedStudent(null);
        setSelectedInterviewerId('');
        setSelectedFile(null); // Reset file state
        setFileError(''); // Clear file error
        setFormData({
            interviewDate: '',
            interviewTimeHours: '',
            interviewTimeMinutes: '',
            interviewTimeAmPm: 'AM',
            interviewMode: '',
            interviewStatus: '',
            lifeGoalsAndZeal: '',
            commitmentToLearning: '',
            integrity: '',
            communicationSkills: '',
            homeVerificationRequired: '',
            interviewResult: '',
            remarks: '', 
        });
        setMessage({ type: '', text: '' });
    };

    // useEffect hook to fetch the list of interviewers when the component mounts
    useEffect(() => {
        const fetchInterviewers = async () => {
            setLoading(prev => ({ ...prev, interviewers: true }));
            try {
                // Fetch from your local backend API
                const response = await fetch('http://localhost:5000/api/interview/interviewers');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setInterviewers(data);
            } catch (error) {
                console.error('Error fetching interviewers:', error);
                showMessageBox('error', 'Could not fetch interviewers. Please check if the backend server is running and the URL is correct.');
            } finally {
                setLoading(prev => ({ ...prev, interviewers: false }));
            }
        };
        fetchInterviewers();
    }, []);

    // useEffect hook to fetch students assigned to the selected interviewer
    useEffect(() => {
        if (selectedInterviewerId) {
            const fetchStudents = async () => {
                setLoading(prev => ({ ...prev, students: true }));
                try {
                    // Find the selected interviewer object to get their name
                    const selectedInterviewer = interviewers.find(i => String(i.interviewer_id) === String(selectedInterviewerId));
                    if (!selectedInterviewer) {
                        setStudents([]); // Clear students if interviewer not found
                        return;
                    }

                    const interviewerName = selectedInterviewer.interviewer_name;

                    // Fetch students from your local backend API using interviewerName and nmmsYear
                    const response = await fetch(`http://localhost:5000/api/interview/students/${encodeURIComponent(interviewerName)}?nmmsYear=${nmmsYear}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    setStudents(data);
                    // Reset student selection and form data when interviewer changes
                    setSelectedStudent(null); 
                    setFormData(prev => ({ ...prev, interviewStatus: '', interviewResult: '', homeVerificationRequired: '' }));
                } catch (error) {
                    console.error('Error fetching students:', error);
                    showMessageBox('error', 'Could not fetch students for the selected interviewer.');
                } finally {
                    setLoading(prev => ({ ...prev, students: false }));
                }
            };
            fetchStudents();
        } else {
            setStudents([]); // Clear students if no interviewer is selected
            setSelectedStudent(null);
        }
    }, [selectedInterviewerId, interviewers, nmmsYear]);

    // Handler for file input changes
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'application/pdf', 'image/jpg']; 
            if (!allowedTypes.includes(file.type)) {
                setFileError('Invalid file type. Only JPEG and PDF are allowed.');
                setSelectedFile(null);
                return;
            }

            const maxSizeBytes = 1 * 1024 * 1024; 
            if (file.size > maxSizeBytes) {
                setFileError('File size exceeds 10MB.'); 
                setSelectedFile(null);
                return;
            }

            // File is valid
            setSelectedFile(file);
            setFileError('');
        } else {
            setSelectedFile(null);
            setFileError('File upload is mandatory.');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        showMessageBox({ type: '', text: '' }); // Clear previous messages

        if (!selectedStudent) { // Check if a student object is selected
            showMessageBox('error', 'Please select a student before submitting.');
            return;
        }

        if (!selectedFile) {
            setFileError('File upload is mandatory.');
            return;
        }

        if (!formData.remarks.trim()) {
            showMessageBox('error', 'Remarks field is mandatory.');
            return;
        }

        const isRescheduled = formData.interviewStatus === 'Rescheduled';
        const isCompleted = formData.interviewStatus === 'Completed';

        if (!isRescheduled && !formData.interviewResult) {
            showMessageBox('error', 'Interview Result is mandatory for Completed status.');
            return;
        }
        

        setLoading(prev => ({ ...prev, submit: true }));

        // Create a FormData object to send both text data and the file
        const requestFormData = new FormData();
        
        // *** CRITICAL DATA APPENDS (Backend requirements) ***
        requestFormData.append('applicantId', selectedStudent.applicant_id);
        requestFormData.append('remarks', formData.remarks); 
        requestFormData.append('file', selectedFile); 
        requestFormData.append('nmmsYear', nmmsYear); // Pass year for backend folder structure

        // Append all other form data fields
        requestFormData.append('interviewDate', formData.interviewDate);
        requestFormData.append('interviewTime', `${formData.interviewTimeHours.padStart(2, '0')}:${formData.interviewTimeMinutes.padStart(2, '0')} ${formData.interviewTimeAmPm}`);
        requestFormData.append('interviewMode', formData.interviewMode);
        requestFormData.append('interviewStatus', formData.interviewStatus);
        requestFormData.append('lifeGoalsAndZeal', formData.lifeGoalsAndZeal);
        requestFormData.append('commitmentToLearning', formData.commitmentToLearning);
        requestFormData.append('integrity', formData.integrity);
        requestFormData.append('communicationSkills', formData.communicationSkills);
        requestFormData.append('homeVerificationRequired', formData.homeVerificationRequired); 
        requestFormData.append('interviewResult', formData.interviewResult);


        try {
            // Send the request with FormData. No manual Content-Type header needed.
            const response = await fetch(`http://localhost:5000/api/interview/submit-interview`, {
                method: 'POST',
                body: requestFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error('Something went wrong on the server.');
            }

            const result = await response.json();
            console.log('Submission successful:', result);
            setSubmissionStatus('success');
            showMessageBox('success', 'Interview details submitted successfully!');
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmissionStatus('error');
            showMessageBox('error', `Submission failed: ${error.message || 'An unknown error occurred.'}`);
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const getMessageClasses = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-100 text-green-700 border-green-400';
            case 'error':
                return 'bg-red-100 text-red-700 border-red-400';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-400';
        }
    };

    // Conditional variables for JSX
    const isRound3 = selectedStudent?.interview_round === 3;
    const isRescheduled = formData.interviewStatus === 'Rescheduled';
    const isCompleted = formData.interviewStatus === 'Completed';
    const isResultRequired = isCompleted || isRescheduled;

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-inter">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-2xl space-y-6">

                {/* Show submission status and "Back" button */}
                {submissionStatus && (
                    <div className="flex flex-col items-center justify-center space-y-6 text-center">
                        <div className={`p-6 rounded-lg border-l-4 ${getMessageClasses(message.type)}`}>
                            <h2 className={`font-semibold text-lg sm:text-xl mb-2 ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {message.type === 'success' ? 'Submission Successful!' : 'Submission Failed'}
                            </h2>
                            <p className="text-sm sm:text-base">{message.text}</p>
                        </div>
                    </div>
                )}

                {/* Main Form - Only render if no submission has been made */}
                {!submissionStatus && (
                    <>
                        {/* Interviewer Dropdown */}
                        <div>
                            <label htmlFor="interviewer-select" className="block text-sm font-medium text-gray-700 mb-1">Select Interviewer</label>
                            <div className="relative">
                                <select
                                    id="interviewer-select"
                                    value={selectedInterviewerId}
                                    onChange={(e) => setSelectedInterviewerId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    disabled={loading.interviewers}
                                >
                                    <option value="">
                                        {loading.interviewers ? 'Loading...' : '--- Select an Interviewer ---'}
                                    </option>
                                    {interviewers.map(interviewer => (
                                        <option key={interviewer.interviewer_id} value={interviewer.interviewer_id}>
                                            {interviewer.interviewer_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Student Dropdown (conditional) */}
                        {selectedInterviewerId && (
                            <div>
                                <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                                <div className="relative">
                                    <select
                                        id="student-select"
                                        value={selectedStudent ? selectedStudent.applicant_id : ''} // Use selectedStudent object
                                        onChange={(e) => {
                                            const studentId = e.target.value;
                                            const studentObj = students.find(s => String(s.applicant_id) === String(studentId));
                                            setSelectedStudent(studentObj || null); // Store the full student object
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        disabled={loading.students}
                                    >
                                        <option value="">
                                            {loading.students ? 'Loading students...' : (students.length ? '--- Select a Student ---' : 'No students assigned')}
                                        </option>
                                        {students.map(student => (
                                            <option key={student.applicant_id} value={student.applicant_id}>
                                                {student.student_name} (Round: {student.interview_round})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Interview Form (conditional) */}
                        {selectedStudent && ( // Render form if a student is selected
                            <form onSubmit={handleSubmit} className="space-y-6">
                                
                                {/* MODIFICATION 1: RED ALERT for Round 3 */}
                                {isRound3 && (
                                    <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
                                        🚨 **ALERT:** This is the **LAST ROUND** for this student. You **CANNOT** assign another interview round.
                                    </div>
                                )}

                                <h2 className="text-xl font-semibold text-gray-800 pt-4">Interview Details</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Date Input with max attribute */}
                                    <div>
                                        <label htmlFor="interviewDate" className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
                                        <input
                                            type="date"
                                            id="interviewDate"
                                            name="interviewDate"
                                            value={formData.interviewDate}
                                            onChange={handleInputChange}
                                            max={todayDate}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    {/* Custom 12-hour Time Input */}
                                    <div className="flex flex-col">
                                        <label htmlFor="interviewTime" className="block text-sm font-medium text-gray-700 mb-1">Interview Time</label>
                                        <div className="flex space-x-2">
                                            <select
                                                id="interviewTimeHours"
                                                name="interviewTimeHours"
                                                value={formData.interviewTimeHours}
                                                onChange={handleInputChange}
                                                className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">HH</option>
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                                                    <option key={hour} value={String(hour).padStart(2, '0')}>
                                                        {String(hour).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                id="interviewTimeMinutes"
                                                name="interviewTimeMinutes"
                                                value={formData.interviewTimeMinutes}
                                                onChange={handleInputChange}
                                                className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">MM</option>
                                                {Array.from({ length: 60 }, (_, i) => i).map(minute => (
                                                    <option key={minute} value={String(minute).padStart(2, '0')}>
                                                        {String(minute).padStart(2, '0')}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                id="interviewTimeAmPm"
                                                name="interviewTimeAmPm"
                                                value={formData.interviewTimeAmPm}
                                                onChange={handleInputChange}
                                                className="w-1/3 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="AM">AM</option>
                                                <option value="PM">PM</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Mode and Status */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="interviewMode" className="block text-sm font-medium text-gray-700 mb-1">Interview Mode</label>
                                        <select
                                            id="interviewMode"
                                            name="interviewMode"
                                            value={formData.interviewMode}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Mode</option>
                                            <option value="Online">Online</option>
                                            <option value="Offline">Offline</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="interviewStatus" className="block text-sm font-medium text-gray-700 mb-1">Interview Status</label>
                                        <select
                                            id="interviewStatus"
                                            name="interviewStatus"
                                            value={formData.interviewStatus}
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                let newHomeVerification = '';

                                                if (newStatus === 'Completed') {
                                                    // Fix value to 'Not Required' and hide dropdown
                                                    newHomeVerification = 'Not Required';
                                                } 

                                                setFormData(prev => ({
                                                    ...prev,
                                                    interviewStatus: newStatus,
                                                    // Reset interview result
                                                    interviewResult: '',
                                                    homeVerificationRequired: newHomeVerification,
                                                }));
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Status</option>
                                            <option value="Completed">Completed</option>
                                            
                                            {/* MODIFICATION 2: Show Rescheduled status for ALL rounds (removed conditional) */}
                                            <option value="Rescheduled">Rescheduled</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Rating Section */}
                                <h2 className="text-xl font-semibold text-gray-800 pt-4">Ratings (0-10)</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['lifeGoalsAndZeal', 'commitmentToLearning', 'integrity', 'communicationSkills'].map(field => (
                                        <div key={field}>
                                            <label htmlFor={field} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                                {field.replace(/([A-Z])/g, ' $1').trim()}
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                id={field}
                                                name={field}
                                                value={formData[field]}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Final Decisions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Home Verification Required. HIDDEN if status is Completed (value is auto-set to 'Not Required'). */}
                                    {!isCompleted && (
                                        <div className={!isRescheduled ? 'block' : 'hidden'}>
                                            <label htmlFor="homeVerificationRequired" className="block text-sm font-medium text-gray-700 mb-1">Home Verification Required</label>
                                            <select
                                                id="homeVerificationRequired"
                                                name="homeVerificationRequired"
                                                value={formData.homeVerificationRequired}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                // Only required if the dropdown is visible (i.e., status is empty)
                                                required={!isCompleted && !isRescheduled} 
                                            >
                                                <option value="">Select</option>
                                                <option value="Required">Required</option>
                                                <option value="Not Required">Not Required</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Interview Result. Conditional options based on status. */}
                                    <div className={isRescheduled ? 'col-span-1' : 'block'}>
                                        <label htmlFor="interviewResult" className="block text-sm font-medium text-gray-700 mb-1">Interview Result</label>
                                        <select
                                            id="interviewResult"
                                            name="interviewResult"
                                            value={formData.interviewResult}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Result</option>
                                            
                                            {/* OPTIONS for Completed Status */}
                                            {isCompleted && (
                                                <>
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Rejected">Rejected</option>
                                                </>
                                            )}

                                            {/* OPTIONS for Rescheduled Status */}
                                            {isRescheduled && (
                                                <>
                                                    {/* MODIFICATION 3: Show "Another Interviewer Required" ONLY if NOT round 3 */}
                                                    {!isRound3 && (
                                                         <option value="Another Interview Required">Another Interview Required</option>
                                                    )}
                                                    <option value="Home Verification Required">Home Verification Required</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                                
                                {/* Remarks Textarea */}
                                <div>
                                    <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks (Max 200 characters)
                                    </label>
                                    <textarea
                                        id="remarks"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        maxLength="200"
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        placeholder="Enter detailed remarks here..."
                                    />
                                </div>

                                {/* File Upload Section */}
                                <div className="pt-4">
                                    <label htmlFor="interviewFile" className="block text-sm font-medium text-gray-700 mb-1">
                                        Upload Interview Report (JPEG or PDF, max 10MB)
                                    </label>
                                    <input
                                        type="file"
                                        id="interviewFile"
                                        name="interviewFile"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                                        accept=".jpeg, .jpg, .pdf"
                                        required
                                    />
                                    {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
                                    {selectedFile && !fileError && (
                                        <p className="mt-2 text-sm text-green-600">File selected: {selectedFile.name}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center">
                                    <button
                                        type="submit"
                                        // Disabled if submitting or if critical fields are missing
                                        disabled={loading.submit || !selectedFile || !formData.remarks.trim() || !formData.interviewResult || (isCompleted && !formData.homeVerificationRequired)} 
                                        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:hover:scale-100"
                                    >
                                        {loading.submit ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Submission Message Box - Positioned below the form */}
                        {message.text && !submissionStatus && (
                            <div className={`mt-6 p-4 rounded-lg border-l-4 ${getMessageClasses(message.type)} flex items-center justify-between`}>
                                <p className="font-medium text-sm sm:text-base">{message.text}</p>
                                <button
                                    onClick={() => setMessage({ type: '', text: '' })}
                                    className="p-1 rounded-full text-gray-500 hover:text-gray-700"
                                    aria-label="Close message"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const HomeVerificationView = () => {
    // Max date is today (prevents selecting future dates)
    const today = new Date().toISOString().substring(0, 10); 
    
    const [students, setStudents] = useState([]);
    const [selectedApplicantId, setSelectedApplicantId] = useState('');
    // CHANGE: Initialize dateOfVerification to an empty string to remove default date
    const [dateOfVerification, setDateOfVerification] = useState(''); 
    const [status, setStatus] = useState('');
    const [verifiedBy, setVerifiedBy] = useState('');
    const [verificationType, setVerificationType] = useState('');
    const [remarks, setRemarks] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const statusOptions = ['Accepted', 'Rejected'];
    const typeOptions = ['Physical', 'Virtual'];

    // --- 1. Fetch Students on Component Mount ---
    useEffect(() => {
        const fetchStudents = async () => {
            setIsInitialLoad(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/students-for-verification`);
                setStudents(response.data);
            } catch (error) {
                console.error('Error fetching students:', error);
                setMessage('Error fetching student list.');
            } finally {
                setIsInitialLoad(false);
            }
        };
        fetchStudents();
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.size > 1 * 1024 * 1024) { 
            setMessage('File size exceeds the 10MB limit.');
            setFile(null);
            e.target.value = null;
        } else {
            setFile(selectedFile);
            setMessage('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Validation for mandatory fields
        if (!selectedApplicantId || !status || !verifiedBy || !verificationType || !dateOfVerification) {
            setMessage('Please fill all mandatory fields (marked with *).');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('applicantId', selectedApplicantId);
        formData.append('dateOfVerification', dateOfVerification);
        formData.append('status', status);
        formData.append('verifiedBy', verifiedBy);
        formData.append('verificationType', verificationType);
        formData.append('remarks', remarks);
        
        if (file) {
            formData.append('verificationDocument', file);
        }

        try {
            await axios.post(`${API_BASE_URL}/submit-home-verification`, formData);

            setMessage('Verification submitted successfully! ✅');
            setIsSubmitted(true); 

        } catch (error) {
            const errMsg = error.response?.data?.message || 'A network error occurred during submission.';
            console.error('Submission Error:', error.response ? error.response.data : error.message);
            setMessage(`Error: ${errMsg} ❌`);
        } finally {
            setLoading(false);
        }
    };

    // --- Conditional Rendering based on state ---

    if (isSubmitted) {
        return (
            <div>
                <h2>Home Verification Entry</h2>
                <li> The report must consist of a PDF provided by the interviewer, and that PDF should correctly display the embedded images (only PDFs are accepted or one image).</li>

                <p>
                    Verification submitted successfully! This application is complete.
                </p>
            </div>
        );
    }

    if (isInitialLoad) {
        return <div>Loading students...</div>;
    }

    if (students.length === 0) {
        return (
            <div>
                <h2>Home Verification Entry</h2>
                <p>No students currently assigned for Home Verification or all pending verifications have been submitted.</p>
                {message && <p>{message}</p>}
            </div>
        );
    }
    
    return (
        <div>
            <h2>Home Verification Entry</h2>
            {message && (
                <p>
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                {/* 1. Student Dropdown */}
                <div>
                    <label htmlFor="studentSelect">Select Student: *</label>
                    <select
                        id="studentSelect"
                        value={selectedApplicantId}
                        onChange={(e) => setSelectedApplicantId(e.target.value)}
                        required
                    >
                        <option value="">-- Select a Student --</option>
                        {students.map((student) => (
                            <option key={student.applicant_id} value={student.applicant_id}>
                                {/* CHANGE: Show ONLY the student's name, not the ID */}
                                {student.student_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Date of Verification - No default value, max is TODAY */}
                <div>
                    <label htmlFor="date">Date of Verification: *</label>
                    <input
                        type="date"
                        id="date"
                        value={dateOfVerification}
                        onChange={(e) => setDateOfVerification(e.target.value)}
                        max={today} 
                        required
                    />
                </div>

                {/* 3. Status Dropdown */}
                <div>
                    <label htmlFor="status">Status: *</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                    >
                        <option value="">-- Select Status --</option>
                        {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                {/* 4. Verified By */}
                <div>
                    <label htmlFor="verifiedBy">Verified By: *</label>
                    <input
                        type="text"
                        id="verifiedBy"
                        value={verifiedBy}
                        onChange={(e) => setVerifiedBy(e.target.value)}
                        required
                        maxLength="100" 
                    />
                </div>

                {/* 5. Verification Type Dropdown */}
                <div>
                    <label htmlFor="type">Verification Type: *</label>
                    <select
                        id="type"
                        value={verificationType}
                        onChange={(e) => setVerificationType(e.target.value)}
                        required
                    >
                        <option value="">-- Select Type --</option>
                        {typeOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                {/* 6. Remarks */}
                <div>
                    <label htmlFor="remarks">Remarks (Max 200 chars):</label>
                    <textarea
                        id="remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        maxLength="200"
                        rows="3"
                    />
                </div>

                {/* 7. File Upload (Max 10MB) */}
                <div>
                    <label htmlFor="file">Upload Document (Max 10MB):</label>
                    <input
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                    />
                    {file && <small>Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</small>}
                </div>

                {/* 8. Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading} 
                >
                    {loading ? 'Submitting...' : 'Submit Verification'}
                </button>
            </form>
        </div>
    );
};

function EvaluationInterview() {
    // Added 'homeVerification' to the possible states
    const [view, setView] = useState('main'); // 'main', 'assign', 'fill', 'homeVerification'
    const [selectedCenter, setSelectedCenter] = useState('');
    const nmmsYear = new Date().getFullYear();

    const renderView = () => {
        switch (view) {
            case 'assign':
                return (
                    <div className="detailed-view">
                        <h1 className="detailed-view-heading">Assign/Reassign Students</h1>
                        <div className="w-full max-w-2xl mt-8 pt-6 border-t-2 border-gray-200">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Instructions</h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>A student can be assigned to one interviewer at a time for a round. They can be reassigned as many times as needed before the evaluation is submitted.</li>
                                <li>To conclude the interview, a student will have a maximum of 3 rounds.</li>
                                <li>A student cannot be assigned to the same interviewer for a subsequent round.</li>
                            </ul>
                        </div>
                        <AssignInterviewView
                            nmmsYear={nmmsYear}
                            selectedCenter={selectedCenter}
                            setSelectedCenter={setSelectedCenter}
                        />
                        <div className="back-button-container">
                            <button onClick={() => setView('main')} className="back-button">Back</button>
                        </div>
                    </div>
                );
            case 'fill':
                return (
                    <div className="detailed-view">
                        <h1 className="detailed-view-heading">Fill Interview Results</h1>
                         <div className="w-full max-w-2xl mt-8 pt-6 border-t-2 border-gray-200">
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Instructions</h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-600">
                                <li>Rescheduled means the interview result can be "Another Round" or "Home Verification Required".</li>
                                <li>Every field is required. Please double-check your submission, as no corrections will be permitted after saving.</li>
                                <li>If the result is "Another Interview," the student must be assigned through the Assign Students Interview interface.</li>
                                <li> The report must consist of a PDF provided by the interviewer, and that PDF should correctly display the embedded images (only PDFs are accepted or one image).</li>
                            </ul>
                        </div>
                        <FillInterviewView />
                        <div className="back-button-container">
                            <button onClick={() => setView('main')} className="back-button">Back</button>
                        </div>
                    </div>
                );
            // New case for home verification
            case 'homeVerification':
                return (
                    <div className="detailed-view">
                        <HomeVerificationView />
                        <div className="back-button-container">
                            <button onClick={() => setView('main')} className="back-button">Back</button>
                        </div>
                    </div>
                );
            
            case 'main':
            default:
                return (
                    <div className="interview-options-grid">
                        <div className="option-box" onClick={() => setView('assign')}>
                            <span className="icon-box">👨‍💻</span>
                            <span className="text-box">Assign Interviews</span>
                        </div>
                        <div className="option-box" onClick={() => setView('fill')}>
                            <span className="icon-box">📝</span>
                            <span className="text-box">Submit Interview Results</span>
                        </div>
                        {/* The new Home Verification box */}
                        <div className="option-box" onClick={() => setView('homeVerification')}>
                            <span className="icon-box">🏡</span>
                            <span className="text-box">Home Verification Status</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="interview-module">
            <h1>Interview</h1>
            <hr className="divider" />
            {renderView()}
        </div>
    );
}

export default EvaluationInterview;