import React, { useEffect } from "react";
import useCreateExamHooks from "../../../hooks/CreateExamHooks";
import { FaTrash } from "react-icons/fa";
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


  
  //exam_name createion
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
  formData.examstarttime,  // ✅ Required!
  centres
]);


  return (
    <div className={classes.modal}>
      <h2>Create New Exam</h2>
      <form onSubmit={async (e) => { await handleSubmit(e); onClose(); }}>
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
            required
          />
        </div>

        <div className={classes.formGroup}>
          <label>Exam Start time</label>
          <input
          type ="time"
          name = "examstarttime"
          value = {formData.examstarttime}
          onChange={handleChange}
          />
        </div>

        <div className={classes.formGroup}>
          <label>Exam End time</label>
          <input
          type ="time"
          name = "examendtime"
          value = {formData.examendtime}
          onChange={handleChange}
          />
        </div>
        
        <div className={classes.formGroup}>
          <label>Exam Name (Autofill)</label>
          <input
            type="text"
            name="examName"
            value={formData.examName}
            readOnly
          />
        </div>
        
        <div style={{ marginTop: "15px" ,display:"flex"}}>
          <button 
            type="submit" 
            disabled={loading} 
            className={classes.btnGreen}
          >
            {loading ? "Creating..." : "Create Exam"}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className={classes.btnRed}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
        
        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </form>
    </div>
  );
};

export default ExamCreationModal;