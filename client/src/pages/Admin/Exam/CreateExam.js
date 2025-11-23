import React, { useState, useEffect } from "react";
import useCreateExamHooks from "../../../hooks/CreateExamHooks.js";
import AssignStudentsModal from "./AssignStudentsModal.js";
import ExamCreationModal from "./ExamCreationModal.js";
import axios from "axios";
import { FaListAlt, FaDownload, FaPlus, FaTrash } from "react-icons/fa";
import classes from "./CreateExam.module.css";

const CreateExam = () => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [assignExamId, setAssignExamId] = useState(null);
  const [notAssignedExams, setNotAssignedExams] = useState([]);
  const [message, setMessage] = useState("");
  const {
    entries,
    isLoading,
    error,
    deleteExam,
    toggleFreezeExam,
    newCentre,
  handleCentreChange,
   districts,
     setDistricts,
    usedBlocks,
    isCreatingCentre,
  setIsCreatingCentre,
    newCentreName,
    createCentre,
    setNewCentreName
  } = useCreateExamHooks();

  // Fetch exams created but not assigned any students
  useEffect(() => {
    const fetchNotAssignedExams = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/exams/notassigned");
        setNotAssignedExams(response.data || []);
      } catch (error) {
        setNotAssignedExams([]);
      }
    };
    fetchNotAssignedExams();
  }, []);

  // Confirm before delete
  const handleDelete = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        await deleteExam(examId);
        setNotAssignedExams(prev => prev.filter(exam => exam.exam_id !== examId));
        setMessage("✅ Exam deleted successfully");
        setTimeout(() => setMessage(""), 3000);
      } catch (err) {
        setMessage("❌ Failed to delete exam");
        setTimeout(() => setMessage(""), 3000);
      }
    }
  };

  // Confirm before freeze
  const handleFreeze = (examId) => {
    if (window.confirm("Are you sure you want to freeze this exam?")) {
      toggleFreezeExam(examId);
    }
  };

  return (
    <div className={classes.container}>
      <header>
        <h1>Exam Dashboard</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setCreateModalOpen(true)} className={classes.createButton}>
            Create New Exam
          </button>

          <button
            type="button"
            className={classes.createButton}
            onClick={() => setIsCreatingCentre(true)}
          >
            <FaPlus /> Create Centre
          </button>
        </div>
      </header>

      {/* Show message */}
      {message && (
        <div className={message.includes("✅") ? classes.messageSuccess : classes.messageError}>
          {message}
        </div>
      )}

      {isCreateModalOpen && <ExamCreationModal onClose={() => setCreateModalOpen(false)} />}

      {assignExamId && <AssignStudentsModal examId={assignExamId} onClose={() => setAssignExamId(null)} />}

         {/* creaing the centre */}

         {isCreatingCentre && (
  <div className={classes.popupBox}>
    <h4>Create New Exam Centre</h4>

    <input
      type="text"
      placeholder="Centre Code (optional)"
      value={newCentre.pp_exam_centre_code}
      onChange={(e) =>
        handleCentreChange("pp_exam_centre_code", e.target.value)
      }
      maxLength={20}
    />

    <input
      type="text"
      placeholder="Center Name* (Example: Smt Ushatai Gogte Girls High School, Belagavi)"
      value={newCentre.pp_exam_centre_name}
      onChange={(e) =>
        handleCentreChange("pp_exam_centre_name", e.target.value)
      }
      required
      maxLength={100}
    />

    <input
      type="text"
      placeholder="Address"
      value={newCentre.address}
      onChange={(e) => handleCentreChange("address", e.target.value)}
      maxLength={200}
    />

    <input
      type="text"
      placeholder="Village"
      value={newCentre.village}
      onChange={(e) => handleCentreChange("village", e.target.value)}
      maxLength={100}
    />

    <input
      type="text"
      placeholder="Pincode (5–12 digits)"
      value={newCentre.pincode}
      onChange={(e) => handleCentreChange("pincode", e.target.value)}
      maxLength={12}
    />

    <input
      type="text"
      placeholder="Contact Person"
      value={newCentre.contact_person}
      onChange={(e) => handleCentreChange("contact_person", e.target.value)}
      maxLength={100}
    />

    <input
      type="text"
      placeholder="Contact Phone (7–12 digits)"
      value={newCentre.contact_phone}
      onChange={(e) => handleCentreChange("contact_phone", e.target.value)}
      maxLength={12}
    />

    <input
      type="email"
      placeholder="Contact Email"
      value={newCentre.contact_email}
      onChange={(e) => handleCentreChange("contact_email", e.target.value)}
      maxLength={200}
    />

    <input
      type="number"
      placeholder="Sitting Capacity"
      value={newCentre.sitting_capacity}
      onChange={(e) => handleCentreChange("sitting_capacity", e.target.value)}
      min="0"
    />

    <input
      type="text"
      placeholder="Latitude (e.g. 28.7041)"
      value={newCentre.latitude}
      onChange={(e) => handleCentreChange("latitude", e.target.value)}
    />

    <input
      type="text"
      placeholder="Longitude (e.g. 77.1025)"
      value={newCentre.longitude}
      onChange={(e) => handleCentreChange("longitude", e.target.value)}
    />

    {message && (
      <div
        style={{
          marginTop: "10px",
          padding: "8px",
          borderRadius: "4px",
          backgroundColor: message.startsWith("✅") ? "#d4edda" : "#f8d7da",
          color: message.startsWith("✅") ? "#155724" : "#721c24",
        }}
      >
        {message}
      </div>
    )}

    <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
      <button className={classes.btnGreen} onClick={createCentre}>
        Create
      </button>
      <button
        className={classes.btnRed}
        onClick={() => setIsCreatingCentre(false)}
      >
        Cancel
      </button>
    </div>
  </div>
)}



      {/* List of exams created but NOT assigned any students */}
      <div className={classes.notAssignedExamsContainer}>
        <h3>Created Exams (No Applicants Assigned Yet):</h3>
        {notAssignedExams.length === 0 ? (
          <p>No unassigned exams found.</p>
        ) : (
          <ul>
            {notAssignedExams.map((exam) => (
              <li key={exam.exam_id}>
                <span className={classes.examInfo}>
                  <h3>{exam.exam_name}</h3>
                  <p>Date: {new Date(exam.exam_date).toLocaleDateString()}</p>
                  <p>Centre: {exam.pp_exam_centre_name}</p>
                  <p>Exam start time :{exam.exam_start_time}</p>
                  <p>Exam End time :{exam.exam_end_time}</p>
                </span>
                <button
                  className={classes.assignButton}
                  onClick={() => setAssignExamId(exam.exam_id)}
                >
                  Assign Students
                </button>
                <button
                  className={classes.deleteButton}
                  onClick={() => handleDelete(exam.exam_id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Regular dashboard list of exams (assigned or not) */}
      <main>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <div>
            {entries.map((entry) => (
              <div key={entry.exam_id} className={classes.examCard}>
  <h3>{entry.exam_name}</h3>
  <p>Date: {new Date(entry.exam_date).toLocaleDateString()}</p>
  <p>Exam Start TIme :{entry.exam_start_time}</p>
  <p>Exam End TIme :{entry.exam_end_time}</p>
  <p>Centre: {entry.pp_exam_centre_name}</p>
  {entry.blocks && entry.blocks.length > 0 ? (
    <p>Blocks: {entry.blocks.map((b) => b.name).join(", ")}</p>
  ) : (
    <p style={{ color: "orange" }}>Applicants not assigned</p>
  )}

  {/* assigned student exams */}
  {entry.district_name && (
    <div className={classes.actionRow}>

      <a
        href={`http://localhost:5000/api/exams/${entry.exam_id}/student-list`}
        download
        className={`${classes.actionButton} ${classes.btnGreen}`}
      >
        <FaListAlt /> Calling List
      </a>

      <a
        href={`http://localhost:5000/api/exams/${entry.exam_id}/download-all-hall-tickets`}
        download
        className={`${classes.actionButton} ${classes.btnYellow}`}
      >
        <FaDownload /> Hall Tickets
      </a>

      {!entry.frozen_yn || entry.frozen_yn === "N" ? (
        <button
          className={classes.deleteButton}
          onClick={() => handleDelete(entry.exam_id)}
          style={{ marginRight: "10px" }}
        >
          Delete
        </button>
      ) : null}

      {entry.frozen_yn === "N" && (
        <button
          className={classes.btnGreen}
          onClick={() => handleFreeze(entry.exam_id)}
        >
          Freeze Exam
        </button>
      )}
    </div>
  )}
</div>

            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateExam;