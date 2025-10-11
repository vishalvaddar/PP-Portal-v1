import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Select from "react-select";
import axios from "axios";
import CreatableSelect from "react-select/creatable";
import { PlusCircle, Pencil, Trash2, X, Users } from "lucide-react";
import classes from "./Batches.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const Notification = ({ message, type, onDismiss }) => {
    if (!message) return null;
    return (
        <div className={`${classes.notification} ${classes[type]}`}>
            <p>{message}</p>
            <button onClick={onDismiss} className={classes.dismissButton}>
                <X size={18} />
            </button>
        </div>
    );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
    if (!show) return null;
    return (
        <div className={classes.modalOverlay}>
            <div className={classes.modal}>
                <h3>{title}</h3>
                <p className={classes.confirmMessage}>{message}</p>
                <div className={classes.modalActions}>
                    <button onClick={onConfirm} className={classes.dangerBtn}>Confirm</button>
                    <button onClick={onClose} className={classes.cancelBtn}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const Batches = () => {
    const navigate = useNavigate();
    const currentPath = ['Admin', 'Academics', 'Batches'];
    const [batch, setBatch] = useState({
        batch_name: "",
        cohort_number: "",
        coordinator_id: "",
        batch_status: "Active",
    });
    const [availableBatchNames, setAvailableBatchNames] = useState([]);
    const [coordinators, setCoordinators] = useState([]);
    const [batches, setBatches] = useState([]);
    const [cohorts, setCohorts] = useState([]);
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [editBatch, setEditBatch] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortBy, setSortBy] = useState("cohort_name");
    const { appliedConfig, loading: configLoading } = useSystemConfig();
    
    const [showCohortModal, setShowCohortModal] = useState(false);
    const [newCohort, setNewCohort] = useState({
        cohort_name: "",
        start_date: "",
        end_date: "",
        description: "",
    });
    const [cohortErrors, setCohortErrors] = useState({});
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState(null);
    
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
    const [batchToToggleStatus, setBatchToToggleStatus] = useState(null);
    const [newStatus, setNewStatus] = useState('');


    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    const fetchCohorts = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/cohorts`);
            setCohorts(res.data.map((c) => ({ value: c.cohort_number, label: c.cohort_name })));
        } catch (err) {
            console.error("Error fetching cohorts", err);
            showNotification('Could not fetch cohorts.', 'error');
        }
    }, []);

    const fetchCoordinators = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/coordinators`);
            setCoordinators(res.data);
        } catch (err) {
            console.error("Error fetching coordinators", err);
            showNotification('Could not fetch coordinators.', 'error');
        }
    }, []);

    const fetchBatches = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches`);
            setBatches(res.data);
        } catch (err) {
            console.error("Error fetching Batches", err);
            showNotification('Could not fetch batches.', 'error');
        }
    }, []);

    const fetchBatchNames = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/names`);
            setAvailableBatchNames(res.data);
        } catch (err) {
            console.error("Error fetching Batch Names", err);
        }
    }, []);

    useEffect(() => {
        fetchCoordinators();
        fetchBatches();
        fetchBatchNames();
        fetchCohorts();
    }, [fetchCoordinators, fetchBatches, fetchBatchNames, fetchCohorts]);

    const validateBatch = (data) => {
        const validationErrors = {};
        if (!data.batch_name || !data.batch_name.trim()) validationErrors.batch_name = "House name is required";
        if (!data.cohort_number) validationErrors.cohort_number = "Please select a cohort";
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBatch((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSelectChange = (name, selectedOption) => {
        setBatch((prev) => ({ ...prev, [name]: selectedOption ? selectedOption.value : "" }));
    };

    const handleEditSelectChange = (name, selectedOption) => {
        setEditBatch((prev) => ({ ...prev, [name]: selectedOption ? selectedOption.value : "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateBatch(batch)) return;
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches`, {
                ...batch,
                batch_name: batch.batch_name.trim(),
                coordinator_id: batch.coordinator_id || null,
            });
            setBatch({ batch_name: "", cohort_number: "", coordinator_id: "", batch_status: "Active" });
            fetchBatches();
            setShowCreateModal(false);
            showNotification("Batch created successfully!");
        } catch (err) {
            if (err.response?.status === 409) {
                setErrors({ batch_name: "House name already exists for this cohort." });
            } else {
                showNotification("House creation failed.", 'error');
            }
        }
    };

    const handleEdit = (batchToEdit) => {
        setEditBatch({
            id: batchToEdit.id,
            batch_name: batchToEdit.batch_name,
            cohort_number: batchToEdit.cohort_number,
            coordinator_id: batchToEdit.coordinator_id || "",
            batch_status: batchToEdit.batch_status || "Active",
        });
        setErrors({});
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditBatch((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        if (!validateBatch(editBatch)) return;
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/${editBatch.id}`, {
                batch_name: editBatch.batch_name,
                cohort_number: editBatch.cohort_number,
                batch_status: editBatch.batch_status,
                coordinator_id: editBatch.coordinator_id || null,
            });
            setEditBatch(null);
            setShowEditModal(false);
            fetchBatches();
            showNotification("House updated successfully!");
        } catch (err) {
            if (err.response?.status === 409) {
                setErrors({ batch_name: "Another House with this name already exists for the selected cohort." });
            } else {
                showNotification("House update failed.", 'error');
            }
        }
    };

    const handleDeleteClick = (id) => {
        setBatchToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDeleteBatch = async () => {
        if (!batchToDelete) return;
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/${batchToDelete}`);
            fetchBatches();
            showNotification("House deleted successfully!");
        } catch {
            showNotification("Delete failed.", 'error');
        } finally {
            setShowConfirmModal(false);
            setBatchToDelete(null);
        }
    };

    const handleStatusToggle = (batch, status) => {
        setBatchToToggleStatus(batch);
        setNewStatus(status);
        setShowStatusConfirmModal(true);
    };

    const confirmStatusChange = async () => {
        if (!batchToToggleStatus) return;
        try {
            await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/${batchToToggleStatus.id}`, {
                ...batchToToggleStatus,
                batch_status: newStatus,
            });
            fetchBatches();
            showNotification(`House status changed to ${newStatus} successfully!`);
        } catch (err) {
            console.error("Error updating house status", err);
            showNotification("Failed to update house status.", 'error');
        } finally {
            setShowStatusConfirmModal(false);
            setBatchToToggleStatus(null);
            setNewStatus('');
        }
    };

    const handleViewBatchDetails = (batchId) => {
        navigate(`/admin/academics/batches/${batchId}/students`);
    };

    const getOption = (options, value, key = 'value') => options.find(opt => opt[key] === value) || null;

    const sortedBatches = [...batches].sort((a, b) => {
        const key = sortBy;
        const valA = a[key] || "";
        const valB = b[key] || "";
        return valA.toString().localeCompare(valB.toString());
    });

    const handleCohortInputChange = (e) => {
        const { name, value } = e.target;
        setNewCohort((prev) => ({ ...prev, [name]: value }));
    };

    const handleCohortSubmit = async (e) => {
        e.preventDefault();
        const { cohort_name, start_date } = newCohort;
        const validationErrors = {};
        if (!cohort_name.trim()) validationErrors.cohort_name = "Cohort name required";
        if (!start_date) validationErrors.start_date = "Start date required";
        setCohortErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/cohorts`, newCohort);
            setNewCohort({ cohort_name: "", start_date: "", description: "" });
            setShowCohortModal(false);
            fetchCohorts();
            showNotification('Cohort created successfully!');
        } catch (err) {
            console.error("Cohort creation error", err);
            showNotification('Cohort creation failed.', 'error');
        }
    };

    const coordinatorOptions = coordinators.map((c) => ({ value: c.id, label: c.name }));

    return (
        <div className={classes.container}>
            <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'Academics']} />
            <Notification
                message={notification.message}
                type={notification.type}
                onDismiss={() => setNotification({ message: '', type: '' })}
            />
            <ConfirmationModal
                show={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDeleteBatch}
                title="Confirm Deletion"
                message="Are you sure you want to delete this House? This action cannot be undone."
            />
            <ConfirmationModal
                show={showStatusConfirmModal}
                onClose={() => setShowStatusConfirmModal(false)}
                onConfirm={confirmStatusChange}
                title={`Confirm ${newStatus === 'Active' ? 'Activation' : 'Deactivation'}`}
                message={`Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} the House "${batchToToggleStatus?.batch_name}"?`}
            />
            

            <div className={classes.header}>
                <h1 className={classes.title}>Batches</h1>
                <div className={classes.headerActions}>
                    <button onClick={() => setShowCohortModal(true)} className={classes.secondaryBtn}>
                        + Add Cohort
                    </button>
                    <button onClick={() => { setErrors({}); setShowCreateModal(true); }} className={classes.addbtn}>
                        <PlusCircle size={20} /> Add House
                    </button>
                </div>
            </div>
            <div className={classes.controls}>
                <label htmlFor="sortBy">Sort By:</label>
                <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={classes.sortSelect}>
                    <option value="cohort_name">Cohort</option>
                    <option value="batch_name">House Name</option>
                    <option value="coordinator_name">Coordinator</option>
                </select>
            </div>
            <div className={classes.cardGrid}>
                {sortedBatches.map((b) => (
                    <div key={b.id} className={classes.card}>
                        <div className={classes.cardHeader}>
                            <h2 className={classes.cardTitle}>{b.batch_name}</h2>
                            <span className={`${classes.statusBadge} ${classes.withIcon} ${b.batch_status === 'Active' ? classes.active : classes.inactive}`}> {b.batch_status}</span>
                        </div>
                        <div className={classes.cardBody}>
                            <p><strong>Cohort:</strong> {b.cohort_name || "—"}</p>
                            <p><strong>Coordinator:</strong> {b.coordinator_name || ""}</p>
                        </div>
                        <div className={classes.cardActions}>
                            <button 
                                className={classes.actionBtn} 
                                onClick={() => handleViewBatchDetails(b.id)}
                            >
                                <Users size={16} /> View Students
                            </button>
                            <button className={classes.actionBtn} onClick={() => handleEdit(b)}><Pencil size={16} /></button>
                            <button className={`${classes.actionBtn} ${classes.dangerBtnIcon}`} onClick={() => handleDeleteClick(b.id)}><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
            {showCreateModal && (
                <div className={classes.modalOverlay}>
                    <div className={classes.modal}>
                        <h3>Create New House</h3>
                        <form onSubmit={handleSubmit} className={classes.modalContent}>
                            <div className={classes.formGroup}>
                                <label>House Name</label>
                                <CreatableSelect
                                    isClearable
                                    placeholder="Choose or type a house name"
                                    options={availableBatchNames}
                                    value={getOption(availableBatchNames, batch.batch_name, 'value')}
                                    onChange={async (selected, { action }) => {
                                        const value = selected?.value || "";
                                        setBatch(prev => ({ ...prev, batch_name: value }));
                                        if (action === "create-option" && value.trim()) {
                                            try {
                                                await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/batches/names`, { name: value.trim() });
                                                fetchBatchNames();
                                            } catch (err) {
                                                console.error("Error saving new house name", err);
                                            }
                                        }
                                    }}
                                    classNamePrefix="react-select"
                                    className={errors.batch_name ? 'react-select-error' : ''}
                                />
                                {errors.batch_name && <span className={classes.errorText}>{errors.batch_name}</span>}
                            </div>
                            <div className={classes.formGroup}>
                                <label>Cohort</label>
                                <Select
                                    options={cohorts}
                                    value={getOption(cohorts, batch.cohort_number)}
                                    onChange={(opt) => handleSelectChange('cohort_number', opt)}
                                    classNamePrefix="react-select"
                                    className={errors.cohort_number ? 'react-select-error' : ''}
                                />
                                {errors.cohort_number && <span className={classes.errorText}>{errors.cohort_number}</span>}
                            </div>
                            <div className={classes.formGroup}>
                                <label>Status</label>
                                <select name="batch_status" value={batch.batch_status} onChange={handleChange}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className={classes.formGroup}>
                                <label>Coordinator</label>
                                <Select
                                    options={coordinatorOptions}
                                    value={getOption(coordinatorOptions, batch.coordinator_id)}
                                    onChange={(opt) => handleSelectChange('coordinator_id', opt)}
                                    isClearable
                                    classNamePrefix="react-select"
                                />
                            </div>
                            <div className={classes.modalActions}>
                                <button type="submit" className={classes.saveBtn}>Create</button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className={classes.cancelBtn}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showCohortModal && (
                <div className={classes.modalOverlay}>
                    <div className={classes.modal}>
                        <h3>Create Cohort</h3>
                        <form onSubmit={handleCohortSubmit} className={classes.modalContent}>
                            <div className={classes.formGroup}>
                                <label>Cohort Name</label>
                                <input
                                    name="cohort_name"
                                    value={newCohort.cohort_name}
                                    onChange={(e) =>
                                    handleCohortInputChange({
                                        target: { name: "cohort_name", value: e.target.value.toUpperCase() },
                                    })
                                    }
                                    className={cohortErrors.cohort_name ? classes.errorInput : ''}
                                />
                                {cohortErrors.cohort_name && (
                                    <span className={classes.errorText}>{cohortErrors.cohort_name}</span>
                                )}
                            </div>
                            <div className={classes.formGroup}>
                                <label>Start Date</label>
                                <input type="date" name="start_date" value={newCohort.start_date} onChange={handleCohortInputChange} className={cohortErrors.start_date ? classes.errorInput : ''} />
                                {cohortErrors.start_date && <span className={classes.errorText}>{cohortErrors.start_date}</span>}
                            </div>
                            <div className={classes.formGroup}>
                                <label>Description</label>
                                <textarea name="description" value={newCohort.description} onChange={handleCohortInputChange} rows="3" />
                            </div>
                            <div className={classes.modalActions}>
                                <button type="submit" className={classes.saveBtn}>Create Cohort</button>
                                <button type="button" onClick={() => setShowCohortModal(false)} className={classes.cancelBtn}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showEditModal && editBatch && (
                <div className={classes.modalOverlay}>
                    <div className={classes.modal}>
                        <h3>Edit Batch</h3>
                        <div className={classes.modalContent}>
                            <div className={classes.formGroup}>
                                <label>Batch Name</label>
                                <input name="batch_name" value={editBatch.batch_name} onChange={handleEditChange} className={errors.batch_name ? classes.errorInput : ''} />
                                {errors.batch_name && <span className={classes.errorText}>{errors.batch_name}</span>}
                            </div>
                            <div className={classes.formGroup}>
                                <label>Cohort</label>
                                <Select
                                    options={cohorts}
                                    value={getOption(cohorts, editBatch.cohort_number)}
                                    onChange={(opt) => handleEditSelectChange('cohort_number', opt)}
                                    classNamePrefix="react-select"
                                    className={errors.cohort_number ? 'react-select-error' : ''}
                                    isDisabled={true}
                                />
                                {errors.cohort_number && <span className={classes.errorText}>{errors.cohort_number}</span>}
                            </div>
                            <div className={classes.formGroup}>
                                <label>Status</label>
                                <select name="batch_status" value={editBatch.batch_status} onChange={handleEditChange}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className={classes.formGroup}>
                                <label>Coordinator</label>
                                <Select
                                    options={coordinatorOptions}
                                    value={getOption(coordinatorOptions, editBatch.coordinator_id)}
                                    onChange={(opt) => handleEditSelectChange('coordinator_id', opt)}
                                    isClearable
                                    classNamePrefix="react-select"
                                />
                            </div>
                        </div>
                        <div className={classes.modalActions}>
                            <button onClick={handleSaveEdit} className={classes.saveBtn}>Save Changes</button>
                            <button onClick={() => setShowEditModal(false)} className={classes.cancelBtn}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Batches;
