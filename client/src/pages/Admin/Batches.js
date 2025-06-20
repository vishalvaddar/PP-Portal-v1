import React, { useState, useEffect } from "react";
import Select from "react-select";
import { PlusCircle, Pencil, Trash2, ArrowRight } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import classes from "./Batches.module.css";

const Batches = () => {
  const [batch, setBatch] = useState({ batch_no: "", batch_year: "", coordinator_id: "", batch_status: "Active" });
  const [coordinators, setCoordinators] = useState([]);
  const [batches, setBatches] = useState([]);
  const [errors, setErrors] = useState({});
  const [editBatch, setEditBatch] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchCoordinators();
    fetchBatches();
  }, []);

  const fetchCoordinators = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/batches/coordinators");
      setCoordinators(res.data);
    } catch (err) {
      console.error("Error fetching coordinators", err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Error fetching batches", err);
    }
  };

  const validateBatch = ({ batch_no, batch_year }) => {
    const validationErrors = {};
    if (!batch_no.toUpperCase().startsWith("BATCH-")) validationErrors.batch_no = "Format: BATCH-1";
    const year = Number(batch_year);
    if (!year || year < 2022 || year > currentYear) validationErrors.batch_year = "Valid year required";
    return validationErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBatch((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCoordinatorChange = (selected) => {
    setBatch((prev) => ({ ...prev, coordinator_id: selected?.value || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateBatch(batch);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/batches", {
        ...batch,
        batch_no: batch.batch_no.trim(),
        batch_year: Number(batch.batch_year),
        coordinator_id: batch.coordinator_id || null,
      });
      setBatch({ batch_no: "", batch_year: "", coordinator_id: "", batch_status: "Active" });
      fetchBatches();
    } catch (err) {
      console.error("Batch creation failed", err);
      alert("Batch creation failed.");
    }
  };

  const handleEdit = (b) => {
    setEditBatch({
      id: b.id,
      batch_no: b.batch_no,
      batch_year: b.batch_year,
      batch_status: b.batch_status,
      coordinator_id: b.coordinator_id || "",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditBatch((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCoordinatorChange = (selected) => {
    setEditBatch((prev) => ({ ...prev, coordinator_id: selected?.value || "" }));
  };

  const handleSaveEdit = async () => {
    const validationErrors = validateBatch(editBatch);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/batches/${editBatch.id}`, {
        ...editBatch,
        batch_year: Number(editBatch.batch_year),
      });
      setEditBatch(null);
      setShowEditModal(false);
      fetchBatches();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (window.confirm("Delete this batch?")) {
      try {
        await axios.delete(`http://localhost:5000/api/batches/${id}`);
        fetchBatches();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const handleViewBatchDetails = (id) => navigate(`/admin/batches/${id}`);

  const getCoordinatorOption = (id) => {
    const coordinator = coordinators.find((c) => c.id === id);
    return coordinator ? { value: id, label: coordinator.name } : null;
  };

  return (
    <div className={classes.container}>
      <h2 className={classes.heading}><PlusCircle size={24} className={classes.icon} />Create New Batch</h2>

      <form onSubmit={handleSubmit} className={classes.form}>
        {["batch_no", "batch_year"].map((field) => (
          <div className={classes.formGroup} key={field}>
            <label>{field === "batch_no" ? "Batch No" : "Year"}</label>
            <input
              name={field}
              type={field === "batch_year" ? "number" : "text"}
              value={batch[field]}
              onChange={handleChange}
              placeholder={field === "batch_no" ? "BATCH-1" : ""}
              className={errors[field] ? classes.errorInput : ""}
            />
            {errors[field] && <span className={classes.errorText}>{errors[field]}</span>}
          </div>
        ))}

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
            options={coordinators.map((c) => ({ value: c.id, label: c.name }))}
            value={getCoordinatorOption(batch.coordinator_id)}
            onChange={handleCoordinatorChange}
            isClearable
          />
        </div>

        <button type="submit" className={classes.submitButton}>Create</button>
      </form>

      <h3 className={classes.tableHeading}>Batches</h3>
      <table className={classes.batchTable}>
        <thead>
          <tr>
            <th>Batch No</th>
            <th>Year</th>
            <th>Cohort</th>
            <th>Status</th>
            <th>Coordinator</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((b) => (
            <tr key={b.id}>
              <td>{b.batch_no}</td>
              <td>{b.batch_year}</td>
              <td>{b.cohort || "—"}</td>
              <td>
                <span className={b.batch_status === "Active" ? classes.active : classes.inactive}>
                  {b.batch_status}
                </span>
              </td>
              <td>{b.coordinator_name || "—"}</td>
              <td>
                <button onClick={() => handleEdit(b)} className={classes.iconBtn} title="Edit"><Pencil size={16} /></button>
                <button onClick={() => handleDeleteBatch(b.id)} className={classes.iconBtn} title="Delete"><Trash2 size={16} /></button>
                <button onClick={() => handleViewBatchDetails(b.id)} className={classes.iconBtn} title="View"><ArrowRight size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditModal && editBatch && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Edit Batch</h3>
            <div className={classes.modalContent}>
              <label>Batch No</label>
              <input name="batch_no" value={editBatch.batch_no} onChange={handleEditChange} />

              <label>Year</label>
              <input name="batch_year" type="number" value={editBatch.batch_year} onChange={handleEditChange} />

              <label>Status</label>
              <select name="batch_status" value={editBatch.batch_status} onChange={handleEditChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <label>Coordinator</label>
              <Select
                options={coordinators.map((c) => ({ value: c.id, label: c.name }))}
                value={getCoordinatorOption(editBatch.coordinator_id)}
                onChange={handleEditCoordinatorChange}
                isClearable
              />
            </div>

            <div className={classes.modalActions}>
              <button onClick={handleSaveEdit} className={classes.saveBtn}>Save</button>
              <button onClick={() => setShowEditModal(false)} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
