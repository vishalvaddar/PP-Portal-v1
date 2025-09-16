import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import classes from "./ViewBatchStudents.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import useBatchData from "../../hooks/useBatchData";
import { Users, Hash, Mail, Phone, Search, ArrowUpDown, Plus } from "lucide-react";


const LoadingState = () => (
    <div className={classes.stateContainer}>
        <div className={classes.spinner}></div>
        <p>Loading student data...</p>
    </div>
);

const ErrorState = ({ message }) => (
    <div className={`${classes.stateContainer} ${classes.errorMessage}`}>
        <p>{message}</p>
    </div>
);


const ViewBatchStudents = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const { students, batchInfo, loading, error } = useBatchData(batchId);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "student_name", direction: "ascending" });

    const processedStudents = useMemo(() => {
        let filtered = [...students];
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (s) =>
                    s.student_name?.toLowerCase().includes(lowercasedFilter) ||
                    s.enr_id?.toLowerCase().includes(lowercasedFilter) ||
                    s.student_email?.toLowerCase().includes(lowercasedFilter)
            );
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const valA = a[sortConfig.key] || "";
                const valB = b[sortConfig.key] || "";
                if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
                if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [students, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = "ascending";
        if (sortConfig.key === key && sortConfig.direction === "ascending") {
            direction = "descending";
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown size={14} className={classes.sortIcon} />;
        }
        return sortConfig.direction === "ascending" ? "▲" : "▼";
    };

    const currentPath = ["Admin", "Academics", "Batches", batchInfo ? batchInfo.batch_name : "..."];

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className={classes.container}>
            <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Academics"]} />
            <div className={classes.header}>
                <div className={classes.titleGroup}>
                    <Users className={classes.titleIcon} />
                    <div>
                        <h1 className={classes.title}>Students in {batchInfo?.batch_name || "Batch"}</h1>
                        <span className={classes.studentCount}>
                            {processedStudents.length} student(s) found
                        </span>
                    </div>
                </div>
                <button onClick={() => navigate(-1)} className={classes.backButton}>
                                        <Plus className={classes.titleIcon} />
Add Students
                </button>
                <button onClick={() => navigate(-1)} className={classes.backButton}>
                    &larr; Back to Batches
                </button>
            </div>

            <div className={classes.controls}>
                <div className={classes.searchContainer}>
                    <Search className={classes.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        className={classes.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {processedStudents.length === 0 ? (
                <div className={classes.noStudentsCard}>
                    <p>
                        {searchTerm
                            ? "No students match your search."
                            : "No students are currently assigned to this batch."}
                    </p>
                </div>
            ) : (
                <div className={classes.tableContainer}>
                    <table className={classes.studentTable}>
                        <thead>
                            <tr>
                                <th>Sl. No.</th>
                                <th onClick={() => requestSort("enr_id")}>
                                    <Hash size={16} /> Enrollment ID {getSortIcon("enr_id")}
                                </th>
                                <th onClick={() => requestSort("student_name")}>
                                    <Users size={16} /> Student Name {getSortIcon("student_name")}
                                </th>
                                <th><Mail size={16} /> Student Email</th>
                                <th><Phone size={16} /> Contact</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedStudents.map((student, index) => (
                                <tr key={student.student_id}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Link
                                            to={`/admin/academics/batches/view-student-info/${student.nmms_reg_number}`}
                                            className={classes.studentLink}
                                        >
                                            {student.enr_id}
                                        </Link>
                                    </td>
                                    <td>{student.student_name}</td>
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