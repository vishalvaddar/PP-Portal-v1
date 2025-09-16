import React, { useEffect, useState } from "react";
import useCreateExamHooks from "../../../hooks/CreateExamHooks";
import classes from "./CreateExam.module.css";

const AssignStudentsModal = ({ examId, onClose, onAssigned }) => {
  const {
    districts,
    blocks,
    formData,
    setFormData,
    handleBlockCheckboxChange,
    usedBlocks,
  } = useCreateExamHooks();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load the examId into formData on modal open
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      examId,
      district: "",
      blocks: [],
    }));
    setMessage("");
  }, [examId, setFormData]);

  // When district changes clear selected blocks
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      blocks: [],
    }));
  }, [formData.district, setFormData]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!formData.district) {
      setMessage("❌ Please select a district.");
      setLoading(false);
      return;
    }
    if (formData.blocks.length === 0) {
      setMessage("❌ Please select at least one block.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        district: formData.district,
        blocks: formData.blocks,
      };

      const response = await fetch(
        `http://localhost:5000/api/exams/${examId}/assign-students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Assignment failed");
      }

      const result = await response.json();
      setMessage(result.message || "✅ Students assigned successfully");

      if (onAssigned) {
        onAssigned();
      }

      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1200);

    } catch (err) {
      setMessage(`❌ ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className={classes.modal}>
      <h2>Assign Students to Exam</h2>
      <form onSubmit={handleAssignSubmit}>
        <div className={classes.formGroup}>
          <label>District</label>
          <select
            name="district"
            value={formData.district}
            onChange={e => setFormData(prev => ({ ...prev, district: e.target.value }))}
            required
          >
            <option value="">-- Select District --</option>
            {districts?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

     {formData.district && (
        <div className={classes.formGroup}>
          <label>Blocks</label>
          <div className={classes.checkboxGrid}>
            {blocks.map(b => {
              const isUsed = usedBlocks.includes(Number(b.id));
              return (
                <div
                  key={b.id}
                  className={`${classes.checkboxItem} ${isUsed ? classes.disabled : ""}`}
                >
                  <input
                    type="checkbox"
                    id={`b-${b.id}`}
                    checked={formData.blocks.includes(b.id)}
                    onChange={() => handleBlockCheckboxChange(b.id)}
                    disabled={isUsed}
                  />
                  <label htmlFor={`b-${b.id}`}>
                    {b.name} {isUsed && <span>(In use)</span>}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        )}

        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button type="submit" disabled={loading} className={classes.btnGreen}>
            {loading ? "Assigning..." : "Assign"}
          </button>
          <button type="button" onClick={onClose} className={classes.btnRed} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        </div>
        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </form>
    </div>
  );
};

export default AssignStudentsModal;