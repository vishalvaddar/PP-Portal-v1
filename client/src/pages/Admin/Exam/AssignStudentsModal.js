import React, { useEffect, useState } from "react";
import axios from "axios";
import useCreateExamHooks from "../../../hooks/CreateExamHooks";
import classes from "./AssignStudents.module.css";

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

const AssignStudentsModal = ({ examId, onClose, onAssigned }) => {
  const {
    divisions,
    setDivisions,
    educationDistricts,
    setEducationDistricts,
    blocks,
    setBlocks,
    formData,
    setFormData,
    usedBlocks,
    setUsedBlocks
  } = useCreateExamHooks();


  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ On modal open — reset form
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      examId,
      division: "",
      education_district: "",
      blocks: [], // multiple
      cluster: "",
    }));
    setMessage("");
  }, [examId, setFormData]);





  // ✅ Handle multi-select blocks
  const handleBlockChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, blocks: selectedOptions }));
  };

  // ✅ Submit Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { division, education_district, blocks } = formData;

    if (!division || !education_district || !blocks.length) {
      setMessage("❌ Please select all required fields.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
  division: formData.division,
  educationDistrict: formData.education_district,
  blocks: Array.isArray(formData.blocks)
    ? formData.blocks
    : [formData.block], // ensures it’s an array
};


      const response = await fetch(
        `${API_BASE_URL}/api/exams/${examId}/assign-students`,
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

      if (onAssigned) onAssigned();

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
        {/* Division Dropdown */}
        <div className={classes.formGroup}>
          <label>Division</label>
          <select
            value={formData.division}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                division: e.target.value,
                education_district: "",
                blocks: [],
              }))
            }
          >
            <option value="">-- Select Division --</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Education District Dropdown */}
        {educationDistricts.length > 0 && (
          <div className={classes.formGroup}>
            <label>Education District</label>
            <select
              value={formData.education_district}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  education_district: e.target.value,
                  blocks: [],
                }))
              }
            >
              <option value="">-- Select Education District --</option>
              {educationDistricts.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Blocks Multi-Select */}
      {/* Blocks Checkbox Grid */}
      {blocks.length > 0 && (
  <div className={classes.formGroup}>
    <label>Select Blocks</label>
    <div className={classes.checkboxGrid}>
      {blocks.map((b) => {
        const blockId = Number(b.id);

        // ✓ Check if this block is in usedBlocks
        const isUsed = usedBlocks.includes(blockId);

        // ✓ Check if selected
        const isChecked = formData.blocks.includes(String(b.id));

        return (
          <div
            key={b.id}
            className={`${classes.checkboxItem} ${
              isUsed ? classes.disabled : ""
            }`}
          >
            <input
              type="checkbox"
              id={`block-${b.id}`}
              value={b.id}
              checked={isChecked}
              disabled={isUsed}   // <-- main part
              onChange={(e) => {
                const { checked, value } = e.target;

                setFormData((prev) => {
                  let updated = [...prev.blocks];
                  if (checked) {
                    updated.push(value);
                  } else {
                    updated = updated.filter((id) => id !== value);
                  }
                  return { ...prev, blocks: updated };
                });
              }}
            />

            <label htmlFor={`block-${b.id}`}>
              {b.name} {isUsed && <span>(Already Assigned)</span>}
            </label>
          </div>
        );
      })}
    </div>
  </div>
)}


        {/* Buttons */}
        <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
          <button
            type="submit"
            disabled={loading}
            className={classes.btnGreen}
          >
            {loading ? "Assigning..." : "Assign"}
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

export default AssignStudentsModal;
