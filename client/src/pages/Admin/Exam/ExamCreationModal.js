import React, { useEffect, useState } from "react";
import useCreateExamHooks from "../../../hooks/CreateExamHooks";
import { FaTrash, FaCheckCircle } from "react-icons/fa";
import classes from "./CreateExam.module.css";

const ExamCreationModal = ({ onClose }) => {
  const {
    centres,
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    loading,
    message,
    deleteCentre
  } = useCreateExamHooks();

  const [conflictError, setConflictError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  //exam_name creation
  useEffect(() => {
    if (formData.centreId && formData.examDate && formData.examstarttime) {
      const selectedCentre = centres.find(
        c => c.pp_exam_centre_id === formData.centreId
      );

      const centreName =
        selectedCentre?.pp_exam_centre_name?.replace(/\s+/g, "_") || "";

      setFormData(prev => ({
        ...prev,
        examName: `${centreName}_${prev.examDate}_${prev.examstarttime}`
      }));
    }
  }, [
    formData.centreId,
    formData.examDate,
    formData.examstarttime,
    centres
  ]);

  // ✅ Custom submit handler with proper error handling
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setConflictError("");
    setSuccessMessage("");
    
    // ✅ Validate time range
    if (formData.examendtime <= formData.examstarttime) {
      setConflictError("Exam end time must be after start time");
      return;
    }
    
    try {
      const result = await handleSubmit(e);
      
      // ✅ If submission was successful
      if (result?.success !== false) {
        setSuccessMessage("✅ Exam created successfully! You can now assign students to this exam.");
        
        // ✅ Close modal after 2 seconds to show the success message
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      // Handle specific error from API
      if (error.response?.status === 409) {
        setConflictError(error.response?.data?.message || "Time conflict detected. Please choose a different time slot.");
      } else {
        setConflictError("Failed to create exam. Please try again.");
      }
    }
  };

  return (
    <div className={classes.modal}>
      <h2>Create New Exam</h2>
      <form onSubmit={handleFormSubmit}>
        <div className={classes.formGroup}>
          <label>Exam Centre</label>
          <div style={{ display: "flex", alignItems: "center" }}>
            <select
              name="centreId"
              value={formData.centreId}
              onChange={handleChange}
              required
              style={{ flex: 1 }}
            >
              <option value="">-- Select a Centre --</option>
              {centres?.map(c => (
                <option key={c.pp_exam_centre_id} value={c.pp_exam_centre_id}>
                  {c.pp_exam_centre_name}
                </option>
              ))}
            </select>
            {formData.centreId && (
              <button
                type="button"
                className={classes.deleteCentreButton}
                title="Delete Selected Centre"
                onClick={() =>
                  window.confirm("Are you sure you want to delete this centre?") &&
                  deleteCentre(formData.centreId)
                }
              >
                <FaTrash />
              </button>
            )}
          </div>
        </div>
        
        <div className={classes.formGroup}>
          <label>Exam Date</label>
          <input
            type="date"
            name="examDate"
            value={formData.examDate}
            onChange={handleChange}
            min={getTodayDate()}
            required
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Please select today's date or a future date
          </small>
        </div>

        <div className={classes.formGroup}>
          <label>Exam Start Time</label>
          <input
            type="time"
            name="examstarttime"
            value={formData.examstarttime}
            onChange={handleChange}
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label>Exam End Time</label>
          <input
            type="time"
            name="examendtime"
            value={formData.examendtime}
            onChange={handleChange}
            required
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            End time must be after start time
          </small>
        </div>
        
        <div className={classes.formGroup}>
          <label>Exam Name (Autofill)</label>
          <input
            type="text"
            name="examName"
            value={formData.examName}
            readOnly
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
        </div>
        
        {/* ✅ Display success message */}
        {successMessage && (
          <div style={{ 
            marginTop: "15px", 
            padding: "12px", 
            backgroundColor: "#f0fff4", 
            borderLeft: "4px solid #28a745",
            borderRadius: "6px",
            color: "#0f5132",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <FaCheckCircle style={{ color: "#28a745" }} />
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* ✅ Display conflict error message */}
        {conflictError && (
          <div style={{ 
            marginTop: "15px", 
            padding: "12px", 
            backgroundColor: "#fff5f5", 
            borderLeft: "4px solid #e74c3c",
            borderRadius: "6px",
            color: "#721c24"
          }}>
            <strong>⚠️ Error:</strong> {conflictError}
          </div>
        )}
        
        {/* ✅ Display general message from hook */}
        {message && !successMessage && !conflictError && (
          <p style={{ 
            marginTop: "10px", 
            padding: "12px",
            borderRadius: "6px",
            backgroundColor: message.includes("✅") ? "#f0fff4" : "#fff5f5",
            color: message.includes("✅") ? "#0f5132" : "#721c24",
            borderLeft: `4px solid ${message.includes("✅") ? "#28a745" : "#e74c3c"}`
          }}>
            {message}
          </p>
        )}
        
        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button 
            type="submit" 
            disabled={loading || successMessage} 
            className={classes.btnGreen}
          >
            {loading ? "Creating..." : "Create Exam"}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className={classes.btnRed}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamCreationModal;