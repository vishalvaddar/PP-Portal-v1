import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import classes from './ViewApplications.module.css'; // Your CSS module

const ViewApplications = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const initialState = location.state || {};
    const initialApps = initialState.initialApplications || [];
    const initialPagination = initialState.paginationInfo || { total: 0, limit: 10, offset: 0, totalPages: 0 };
    const initialFilters = initialState.searchFilters || {};

    const [applications, setApplications] = useState(initialApps);
    const [pagination, setPagination] = useState({
        limit: initialPagination.limit,
        offset: initialPagination.offset,
        total: initialPagination.total,
        totalPages: initialPagination.totalPages,
        currentPage: Math.floor(initialPagination.offset / initialPagination.limit) + 1,
    });
    const [filters] = useState(initialFilters); // Filters don't change here
    const [sorting, setSorting] = useState({ sortBy: 'applicant_id', sortOrder: 'ASC' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch applications
    const fetchApplications = useCallback(async (currentOffset, currentSortBy, currentSortOrder) => {
        setLoading(true);
        setError(null);
        const params = {
            ...filters,
            limit: pagination.limit,
            offset: currentOffset,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
        };

        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/search`, { params });
            if (response.data && response.data.data) {
                setApplications(response.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages,
                    offset: currentOffset,
                    currentPage: Math.floor(currentOffset / prev.limit) + 1,
                }));
            } else {
                setApplications([]);
                setPagination(prev => ({
                    ...prev,
                    total: 0,
                    totalPages: 0,
                    currentPage: 1,
                    offset: 0,
                }));
            }
        } catch (err) {
            console.error("Error fetching applications:", err);
            setError("Failed to fetch applications. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    // Fetch data on page or sort change
    useEffect(() => {
        fetchApplications(pagination.offset, sorting.sortBy, sorting.sortOrder);
    }, [pagination.offset, sorting.sortBy, sorting.sortOrder, fetchApplications]);

    // Handle page navigation
    const handlePageChange = (newOffset) => {
        if (newOffset >= 0 && newOffset < pagination.total) {
            setPagination(prev => ({ ...prev, offset: newOffset }));
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>View Applications</h1>
                <button onClick={() => navigate('/admin/admissions/search-applications')} className={classes.backButton}>
                    Back to Search
                </button>
            </div>

            {error && <p className={classes.error}>{error}</p>}
            {loading && <p className={classes.loading}>Loading...</p>}
            {!loading && applications.length === 0 && <p className={classes.noResults}>No applications found for the selected criteria.</p>}

            {!loading && applications.length > 0 && (
                <>
                    <div className={classes.tableContainer}>
                        <table className={classes.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Reg Number</th>
                                    <th>Name</th>
                                    <th>Year</th>
                                    <th>District</th>
                                    <th>Block</th>
                                    <th>Institute Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((app) => (
                                    <tr key={app.applicant_id}>
                                        <td>{app.applicant_id}</td>
                                        <td>
                                            <Link to={`/admin/admissions/view-student-info/${app.nmms_reg_number}`} className={classes.link}>
                                                {app.nmms_reg_number}
                                            </Link>
                                        </td>
                                        <td>{app.student_name}</td>
                                        <td>{app.nmms_year}</td>
                                        <td>{app.district_name}</td>
                                        <td>{app.block_name}</td>
                                        <td>{app.institute_name || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    <div className={classes.pagination}>
                        <span>
                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} results)
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.offset - pagination.limit)}
                            disabled={pagination.offset === 0 || loading}
                            className={classes.paginationButton}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                            disabled={pagination.offset + pagination.limit >= pagination.total || loading}
                            className={classes.paginationButton}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ViewApplications;