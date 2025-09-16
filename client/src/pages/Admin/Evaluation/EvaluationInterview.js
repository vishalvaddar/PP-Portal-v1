import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EvaluationInterview.css';

// --- API Calls ---
// Make sure REACT_APP_BACKEND_API_URL is correctly set in your environment variables.
const API_BASE_URL = `${process.env.REACT_APP_BACKEND_API_URL}/api/interview`;

const api = {
    getExamCenters: () => axios.get(`${API_BASE_URL}/exam-centers`),
    getUnassignedStudents: (centerName, nmmsYear) => axios.get(`${API_BASE_URL}/unassigned-students`, { params: { centerName, nmmsYear } }),
    getReassignableStudents: (centerName, nmmsYear) => axios.get(`${API_BASE_URL}/reassignable-students`, { params: { centerName, nmmsYear } }),
    getInterviewers: () => axios.get(`${API_BASE_URL}/interviewers`),
    assignStudents: (applicantIds, interviewerId, nmmsYear) => axios.post(`${API_BASE_URL}/assign-students`, { applicantIds, interviewerId, nmmsYear }),
    reassignStudents: (applicantIds, newInterviewerId, nmmsYear) => axios.post(`${API_BASE_URL}/reassign-students`, { applicantIds, newInterviewerId, nmmsYear }),
    
};
api.getStates = () => axios.get(`${API_BASE_URL}/states`);
api.getDistricts = (stateName) => axios.get(`${API_BASE_URL}/districts/${encodeURIComponent(stateName)}`);
api.getBlocks = (districtName) => axios.get(`${API_BASE_URL}/blocks/${encodeURIComponent(districtName)}`);
api.getUnassignedBlockStudents = (stateName, districtName, blockName, nmmsYear) =>
  axios.get(`${API_BASE_URL}/unassignedStudentsByBlock`, { params: { stateName, districtName, blockName, nmmsYear } });

api.getReassignableBlockStudents = (stateName, districtName, blockName, nmmsYear) =>
  axios.get(`${API_BASE_URL}/reassignableStudentsByBlock`, { params: { stateName, districtName, blockName, nmmsYear } });
function BlockAssignmentView() {
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [selectedState, setSelectedState] = useState('');
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
    const nmmsYear = new Date().getFullYear();

    useEffect(() => {
        api.getStates().then(res => setStates(res.data)).catch(() => setStates([]));
    }, []);

    useEffect(() => {
        if (selectedState) {
            api.getDistricts(selectedState).then(res => setDistricts(res.data)).catch(() => setDistricts([]));
        } else {
            setDistricts([]);
            setSelectedDistrict('');
        }
    }, [selectedState]);

    useEffect(() => {
        if (selectedDistrict) {
            api.getBlocks(selectedDistrict).then(res => setBlocks(res.data)).catch(() => setBlocks([]));
        } else {
            setBlocks([]);
            setSelectedBlock('');
        }
    }, [selectedDistrict]);

    useEffect(() => {
        if (selectedState && selectedDistrict && selectedBlock && assignmentType) {
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
        }
    }, [selectedState, selectedDistrict, selectedBlock, assignmentType, nmmsYear]);

    const handleStudentSelect = (applicantId, isChecked) => {
        if (isChecked) {
            setSelectedStudents(prev => [...prev, applicantId]);
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== applicantId));
        }
    };

    const handleAssignOrReassign = () => {
        if (selectedStudents.length === 0) {
            setMessages(['Please select students.']);
            return;
        }
        if (!selectedInterviewer || !selectedInterviewer.id) {
            setMessages(['Please select an interviewer.']);
            return;
        }
        setModalMessage(`Are you sure you want to ${assignmentType === 'unassigned' ? 'assign' : 'reassign'} ${selectedStudents.length} student(s) to ${selectedInterviewer.name}?`);
        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        setShowConfirmModal(false);
        setLoading(true);
        setMessages([]);
        try {
            let response;
            if (assignmentType === 'unassigned') {
                response = await api.assignStudents(selectedStudents, selectedInterviewer.id, nmmsYear);
            } else {
                response = await api.reassignStudents(selectedStudents, selectedInterviewer.id, nmmsYear);
            }
            const results = response.data?.results || [];
            const studentNameMap = new Map();
            students.forEach(s => studentNameMap.set(s.applicant_id, s.student_name));
            const feedback = results.map(result => {
                const name = studentNameMap.get(result.applicantId) || `Applicant ID ${result.applicantId}`;
                switch (result.status) {
                    case 'Skipped': return `⚠️ Skipped: ${name} - ${result.reason || 'Reason unknown.'}`;
                    case 'Assigned': return `✅ Assigned: ${name} has been successfully assigned for Interview Round ${result.interviewRound}.`;
                    case 'Reassigned': return `✅ Reassigned: ${name} was successfully reassigned for Interview Round ${result.interviewRound}.`;
                    case 'Failed': return `❌ Failed: ${name} - ${result.reason || 'An unexpected error occurred.'}`;
                    default: return `ℹ️ Status: ${name} ${result.status}`;
                }
            });
            setMessages(feedback);
            // Refresh students
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

    return (
        <div className="p-6 bg-gray-50 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Assign/Reassign by Block</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label>State</label>
                    <select value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                        <option value="">Select State</option>
                        {states.map(s => (
                            <option key={s.juris_code} value={s.juris_name}>{s.juris_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>District</label>
                    <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} disabled={!selectedState}>
                        <option value="">Select District</option>
                        {districts.map(d => (
                            <option key={d.juris_code} value={d.juris_name}>{d.juris_name}</option>
                        ))}
                    </select>
                </div>
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
                            {/* Select All Checkbox on the right side */}
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
        </li>
    ))}
</ul>
                            <div className="mt-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                                <InterviewerDropdown
                                    onSelectInterviewer={setSelectedInterviewer}
                                    selectedInterviewerId={selectedInterviewer?.id}
                                />
                                <button
                                    onClick={handleAssignOrReassign}
                                    disabled={loading || selectedStudents.length === 0 || !selectedInterviewer || !selectedInterviewer.id}
                                    className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
                                >
                                    {assignmentType === 'unassigned' ? 'Assign Selected Students' : 'Reassign Selected Students'}
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


// --- Component: ExamCenterDropdown ---
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

// --- Component: AssignmentTypeSelector ---
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

    if (loading) return <div className="message-box loading-message">Loading interviewers...</div>;
    if (error) return <div className="message-box error-message">Error: {error}</div>;

    return (
        <div>
            <label htmlFor="interviewer-select">Select Interviewer:</label>
            <select
                id="interviewer-select"
                onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedInterviewer = interviewers.find(
                        (interviewer) => String(interviewer.interviewer_id) === String(selectedId)
                    );
                    onSelectInterviewer({ id: parseInt(selectedId), name: selectedInterviewer?.interviewer_name || '' });
                }}
                value={selectedInterviewerId || ""}
            >
                <option key="select-interviewer-placeholder" value="">--Please select an interviewer--</option>
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

// --- Component: UnassignedStudentsList ---
function UnassignedStudentsList({ selectedCenter }) {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedInterviewer, setSelectedInterviewer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignmentMessages, setAssignmentMessages] = useState([]);

    // State for the custom confirmation modal
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

    // Corrected formatAssignmentMessages function
    const formatAssignmentMessages = (results, allStudents) => {
        console.log('formatAssignmentMessages called with results:', results);
        if (!results || results.length === 0) {
            return ['No assignment results were returned by the server.'];
        }

        const messages = [];
        const studentNameMap = new Map();
        allStudents.forEach(student => {
            studentNameMap.set(student.applicant_id, student.student_name);
        });

        results.forEach(result => {
            const studentName = studentNameMap.get(result.applicantId) || `Applicant ID ${result.applicantId}`;
            let message = '';

            switch (result.status) {
                case 'Skipped':
                    message = `⚠️ Skipped: ${studentName} - ${result.reason || 'Reason unknown.'}`;
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

            console.log('Full API Response:', response.data);
            const assignmentResults = response.data?.results || [];
            console.log('Assignment Results:', assignmentResults);

            const feedbackMessages = formatAssignmentMessages(assignmentResults, students);
            setAssignmentMessages(feedbackMessages);

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

    if (!selectedCenter) return <div className="p-6 text-center text-gray-600 bg-gray-100 rounded-lg">Please select an exam center first.</div>;
    if (loading && students.length === 0) return <div className="p-6 text-center text-gray-600 bg-gray-100 rounded-lg">Loading unassigned students...</div>;
    if (error) return <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;

    return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
            Unassigned Students for {selectedCenter}
        </h2>

        {students.length === 0 ? (
            <p className="p-4 text-center text-gray-600 bg-gray-100 rounded-lg">
                No unassigned students found for this center.
            </p>
        ) : (
            <>
                {/* Select All Checkbox on the right side */}
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
}

// --- Component: ReassignStudentsList ---
function ReassignStudentsList({ selectedCenter }) {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [newInterviewer, setNewInterviewer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reassignmentMessages, setReassignmentMessages] = useState([]);

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
            setReassignmentMessages([]);
            setNewInterviewer(null);
            try {
                const response = await api.getReassignableStudents(selectedCenter, nmmsYear);
                setStudents(response.data);
            } catch (err) {
                setError('Failed to load reassignable students.');
                console.error('Error fetching reassignable students:', err);
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

    const handleReassign = () => {
        if (selectedStudents.length === 0) {
            setReassignmentMessages(['Please select students to reassign.']);
            return;
        }
        if (!newInterviewer || !newInterviewer.id) {
            setReassignmentMessages(['Please select a new interviewer.']);
            return;
        }

        setModalMessage(`Are you sure you want to reassign ${selectedStudents.length} student(s) to ${newInterviewer.name}?`);
        setShowConfirmModal(true);
    };

    const handleConfirmReassignment = async () => {
        setShowConfirmModal(false);

        setLoading(true);
        setError(null);
        setReassignmentMessages([]);
        try {
            const response = await api.reassignStudents(selectedStudents, newInterviewer.id, nmmsYear);
            console.log('Full API Response:', response.data);
            const reassignmentResults = response.data?.results || [];
            console.log('Reassignment Results:', reassignmentResults);

            const feedbackMessages = formatReassignmentMessages(reassignmentResults, students);
            setReassignmentMessages(feedbackMessages);

            const refreshedResponse = await api.getReassignableStudents(selectedCenter, nmmsYear);
            setStudents(refreshedResponse.data);
            setSelectedStudents([]);
            setNewInterviewer(null);
        } catch (err) {
            const errorMessage = `Error reassigning students: ${err.response?.data?.error || err.message}`;
            setReassignmentMessages([errorMessage]);
            setError('Error during reassignment.');
            console.error('Reassignment error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReassignment = () => {
        setShowConfirmModal(false);
    };

    // Corrected formatReassignmentMessages function
    const formatReassignmentMessages = (results, allStudents) => {
        console.log('formatReassignmentMessages called with results:', results);
        if (!results || results.length === 0) {
            return ['No reassignment results were returned by the server.'];
        }

        const messages = [];
        const studentNameMap = new Map();
        allStudents.forEach(student => {
            studentNameMap.set(student.applicant_id, student.student_name);
        });

        results.forEach(result => {
            const studentName = studentNameMap.get(result.applicantId) || `Applicant ID ${result.applicantId}`;
            let message = '';

            switch (result.status) {
                case 'Skipped':
                    message = `⚠️ Skipped: ${studentName} - ${result.reason || 'Reason unknown.'}`;
                    break;
                case 'Reassigned':
                    message = `✅ Reassigned: ${studentName} was successfully reassigned for Interview Round ${result.interviewRound}.`;
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
    <div className="p-6 bg-gray-50 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Reassign Students for {selectedCenter}</h2>
        {students.length === 0 ? (
            <p className="p-4 text-center text-gray-600 bg-gray-100 rounded-lg">
                No students found for reassigning in this center with 'Scheduled' status and no interview result.
            </p>
        ) : (
            <>
                {/* Select All Checkbox on the right side */}
                <div className="mb-2 flex justify-end items-center">
                    <label htmlFor="select-all-reassign" className="mr-2 text-gray-700 font-medium cursor-pointer">
                        Select All
                    </label>
                    <input
                        type="checkbox"
                        id="select-all-reassign"
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
                <div className="overflow-y-auto max-h-96 pr-2">
                    <ul className="space-y-3">
                        {students.map((student) => (
                            <li key={student.applicant_id} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <input
                                    type="checkbox"
                                    id={`reassign-student-${student.applicant_id}`}
                                    checked={selectedStudents.includes(student.applicant_id)}
                                    onChange={(e) => handleStudentSelect(student.applicant_id, e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded-full transition-colors"
                                />
                                <label htmlFor={`reassign-student-${student.applicant_id}`} className="flex-1 text-gray-700 cursor-pointer">
                                    <span className="font-semibold">{student.student_name}</span> - Score: {student.pp_exam_score} - Current Interviewer: <span className="font-bold">{student.current_interviewer || 'N/A'}</span> - Round: {student.interview_round}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="mt-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                    <InterviewerDropdown
                        onSelectInterviewer={setNewInterviewer}
                        selectedInterviewerId={newInterviewer?.id}
                    />
                    <button
                        onClick={handleReassign}
                        disabled={loading || selectedStudents.length === 0 || !newInterviewer || !newInterviewer.id}
                        className="w-full md:w-auto px-8 py-3 bg-orange-600 text-white rounded-full font-bold shadow-lg hover:bg-orange-700 disabled:bg-gray-400 transition-all duration-300 transform hover:scale-105"
                    >
                        Reassign Selected Students
                    </button>
                </div>
                {reassignmentMessages.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {reassignmentMessages.map((msg, index) => (
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
                // Ensure interviewer_id and interviewer_name are correctly mapped
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
                    // Find the selected interviewer object to get their name, as required by your backend API
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
                    setSelectedStudent(null); // Reset student selection when interviewer changes
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

    // Handler for form input changes, updating the formData state
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // The main function to handle form submission and send data to the backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        showMessageBox({ type: '', text: '' }); // Clear previous messages

        if (!selectedStudent) { // Check if a student object is selected
            showMessageBox('error', 'Please select a student before submitting.');
            return;
        }

        const {
            interviewDate,
            interviewTimeHours,
            interviewTimeMinutes,
            interviewTimeAmPm,
        } = formData;

        // Time validation for today's date
        if (interviewDate === todayDate) {
            const now = new Date();
            let currentHours = now.getHours();
            const currentMinutes = now.getMinutes();

            // Convert selected 12-hour time to 24-hour format
            let selectedHours = parseInt(interviewTimeHours, 10);
            const selectedMinutes = parseInt(interviewTimeMinutes, 10);

            if (interviewTimeAmPm === 'PM' && selectedHours !== 12) {
                selectedHours += 12;
            }
            if (interviewTimeAmPm === 'AM' && selectedHours === 12) {
                selectedHours = 0;
            }

            // Check if selected time is in the future
            if (selectedHours > currentHours || (selectedHours === currentHours && selectedMinutes > currentMinutes)) {
                showMessageBox('error', 'For today\'s date, the interview time cannot be in the future.');
                return;
            }
        }

        setLoading(prev => ({ ...prev, submit: true }));

        // Corrected payload for the backend POST request
        const payload = {
            applicantId: selectedStudent.applicant_id, // Pass applicantId in the body
            nmmsYear: nmmsYear,
            interviewDate: formData.interviewDate,
            interviewTime: `${interviewTimeHours.padStart(2, '0')}:${interviewTimeMinutes.padStart(2, '0')} ${interviewTimeAmPm}`,
            interviewMode: formData.interviewMode,
            interviewStatus: formData.interviewStatus,
            lifeGoalsAndZeal: parseFloat(formData.lifeGoalsAndZeal),
            commitmentToLearning: parseFloat(formData.commitmentToLearning),
            integrity: parseFloat(formData.integrity),
            communicationSkills: parseFloat(formData.communicationSkills),
            homeVerificationRequired: formData.homeVerificationRequired === 'Y',
        };

        // Conditionally add interviewResult based on interviewStatus
        // Now handles the "rescheduled only shows next round" logic on the frontend
        if (formData.interviewStatus === 'Rescheduled') {
            payload.interviewResult = 'next round';
        } else {
            payload.interviewResult = formData.interviewResult;
        }


        try {
            // Corrected fetch call to use POST and the correct URL
            const response = await fetch(`http://localhost:5000/api/interview/submit-interview`, {
                method: 'POST', // Changed from 'PUT' to 'POST'
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Something went wrong on the server.');
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
                                                setFormData(prev => ({
                                                    ...prev,
                                                    interviewStatus: newStatus,
                                                    // Reset interview result to force re-selection on change
                                                    interviewResult: ''
                                                }));
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Status</option>
                                            <option value="Completed">Completed</option>
                                            {/* Only show Rescheduled if the student is not in round 3 */}
                                            {selectedStudent?.interview_round < 3 && (
                                                <option value="Rescheduled">Rescheduled</option>
                                            )}
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
                                    {/* Home Verification Required */}
                                    <div>
                                        <label htmlFor="homeVerificationRequired" className="block text-sm font-medium text-gray-700 mb-1">Home Verification Required</label>
                                        <select
                                            id="homeVerificationRequired"
                                            name="homeVerificationRequired"
                                            value={formData.homeVerificationRequired}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select</option>
                                            <option value="Y">Yes</option>
                                            <option value="N">No</option>
                                        </select>
                                    </div>

                                    {/* Final Interview Result */}
                                    <div>
                                        <label htmlFor="interviewResult" className="block text-sm font-medium text-gray-700 mb-1">Interview Result</label>
                                        <select
                                            id="interviewResult"
                                            name="interviewResult"
                                            value={formData.interviewResult}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            {/* Conditional rendering of options based on interview status and round */}
                                            <option value="">Select Result</option>
                                            {/* If the interview is Rescheduled, only show "Next Round" if applicable */}
                                            {formData.interviewStatus === 'Rescheduled' && selectedStudent?.interview_round < 3 && (
                                                <option value="next round">Next Round</option>
                                            )}
                                            {/* If the interview is Completed, show all options based on the round */}
                                            {formData.interviewStatus === 'Completed' && (
                                                <>
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Rejected">Rejected</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-center">
                                    <button
                                        type="submit"
                                        disabled={loading.submit}
                                        className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                                    >
                                        {loading.submit ? 'Submitting...' : 'Submit '}
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

function EvaluationInterview() {
    const [view, setView] = useState('main'); // 'main', 'assign', 'fill'
    const [selectedCenter, setSelectedCenter] = useState('');
    const nmmsYear = new Date().getFullYear();

    const renderView = () => {
        switch (view) {
            case 'assign':
                return (
                    <div className="detailed-view">
                        <h1 className="detailed-view-heading">Assign/Reassign Students</h1>
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
                        <FillInterviewView />
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
                         {/* Instructions Section */}
            <div className="w-full max-w-2xl mt-8 pt-6 border-t-2 border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>A student can be assigned to one interviewer at a time for a round. They can be reassigned as many times as needed before the evaluation is submitted.</li>
                <li>To conclude the interview, a student will have a maximum of 3 rounds.</li>
                <li>A student cannot be assigned to the same interviewer for a subsequent round.</li>
                <li> Reschedule meanse pushed to next round. </li>

              </ul>
            </div>
                    </div>
                    
                );
        }
    };

    return (
        <div className="interview-module">
            <h1>Interview </h1>
            <hr className="divider" />
            {renderView()}
        </div>
    );
}

export default EvaluationInterview;