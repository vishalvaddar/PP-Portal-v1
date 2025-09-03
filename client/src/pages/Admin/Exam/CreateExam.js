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
  const [isCreatingCentre, setIsCreatingCentre] = useState(false);
  const {
    entries,
    isLoading,
    error,
    deleteExam,
    toggleFreezeExam,
    usedBlocks,
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

      {isCreatingCentre && (
        <div className={classes.popupBox}>
          <h4>Create New Centre</h4>
          <input
            type="text"
            placeholder="Enter New Centre Name"
            value={newCentreName}
            onChange={e => setNewCentreName(e.target.value)}
            required
          />
          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button
              className={classes.btnGreen}
              type="button"
              onClick={async () => {
                if (!newCentreName.trim()) {
                  alert("Please enter a centre name.");
                  return;
                }
                try {
                  await createCentre();
                  alert("Centre created successfully!");
                  setNewCentreName("");
                  setIsCreatingCentre(false);
                } catch (err) {
                  alert("Failed to create centre");
                }
              }}
            >
              Create
            </button>
            <button 
              className={classes.btnRed} 
              onClick={() => {
                setIsCreatingCentre(false);
                setNewCentreName("");
              }} 
              type="button"
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
  <p>Centre: {entry.pp_exam_centre_name}</p>
  {entry.blocks && entry.blocks.length > 0 ? (
    <p>Blocks: {entry.blocks.map((b) => b.name).join(", ")}</p>
  ) : (
    <p style={{ color: "orange" }}>Applicants not assigned</p>
  )}
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