import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import classes from "./ViewBatchStudents.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { Users, Hash, Mail, Phone } from "lucide-react";

const ViewBatchStudents = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [batchInfo, setBatchInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBatchData = async () => {
            if (!batchId) return;
            setLoading(true);
            setError(null);
            try {
                // Fetch both batch details and student list in parallel
                const [batchRes, studentsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/${batchId}`),
                    axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/${batchId}/students`)
                ]);
                setBatchInfo(batchRes.data);
                setStudents(studentsRes.data);
            } catch (err) {
                console.error("Error fetching batch data:", err);
                setError("Failed to fetch student data. The batch may not exist or an error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchBatchData();
    }, [batchId]);

    const currentPath = ['Admin', 'Academics', 'Batches', batchInfo ? batchInfo.batch_name : '...'];

    if (loading) {
        return (
            <div className={classes.container}>
                <div className={classes.loadingMessage}>
                    <div className={classes.spinner}></div>
                    <p>Loading student data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={classes.container}>
                <div className={classes.errorMessage}>{error}</div>
            </div>
        );
    }

    return (
        <div className={classes.container}>
            <Breadcrumbs path={currentPath} />
            <div className={classes.header}>
                <h1 className={classes.title}>
                    <Users className={classes.titleIcon} />
                    Students in {batchInfo?.batch_name || 'Batch'}
                </h1>
                <button onClick={() => navigate(-1)} className={classes.backButton}>
                    &larr; Back to Batches
                </button>
            </div>

            {students.length === 0 ? (
                <div className={classes.noStudentsCard}>
                    <p>No students are currently assigned to this batch.</p>
                </div>
            ) : (
                <div className={classes.tableContainer}>
                    <table className={classes.studentTable}>
                        <thead>
                            <tr>
                                <th>Sl. No.</th>
                                <th><Users size={16} /> Student Name</th>
                                <th><Hash size={16} /> Enrollment ID</th>
                                <th><Mail size={16} /> Student Email</th>
                                <th><Phone size={16} /> Contact</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.student_id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Link 
                                            to={`/admin/admissions/view-student-info/${student.nmms_reg_number}`} 
                                            className={classes.studentLink}
                                        >
                                            {student.student_name}
                                        </Link>
                                    </td>
                                    <td>{student.enr_id || "N/A"}</td>
                                    <td>{student.student_email || "N/A"}</td>
                                    <td>{student.contact_no1 || "N/A"}</td>
                                    <td>
                                        <span className={`${classes.statusBadge} ${classes.active}`}>
                                            Assigned
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ViewBatchStudents;
