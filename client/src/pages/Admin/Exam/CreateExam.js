import React, { useState, useEffect } from "react";
import useCreateExamHooks from "../../../hooks/CreateExamHooks.js";
import AssignStudentsModal from "./AssignStudentsModal.js";
import ExamCreationModal from "./ExamCreationModal.js";
import axios from "axios";
// At the top of your file with other imports
import { FaListAlt, FaDownload, FaPlus, FaTrash, FaUserPlus, FaSnowflake } from "react-icons/fa";
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
        <button 
          onClick={() => setCreateModalOpen(true)} 
          className={classes.createButton}
        >
          <FaPlus /> Create New Exam
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

    {isCreateModalOpen && (
      <div className={classes.modalOverlay}>
        <div className={classes.modalContent}>
          <ExamCreationModal onClose={() => setCreateModalOpen(false)} />
        </div>
      </div>
    )}
 {assignExamId && (
      <div className={classes.modalOverlay}>
        <div className={classes.modalContent}>
          <AssignStudentsModal 
            examId={assignExamId} 
            onClose={() => setAssignExamId(null)} 
          />
        </div>
      </div>
    )}
         {/* creaing the centre */}
{isCreatingCentre && (
   <div className={classes.modalOverlay}>
  <div className={classes.popupBox}>
    <h4>Create New Exam Centre</h4>
    
    <div className={classes.formGroup}>
      <label htmlFor="centreCode">Centre Code (USHATAIBGM)</label>
      <input
        id="centreCode"
        type="text"
        placeholder="USHATAIBGM"
        value={newCentre.pp_exam_centre_code}
        onChange={(e) => handleCentreChange("pp_exam_centre_code", e.target.value)}
        maxLength={20}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="centreName">
        Center Name* <span style={{ color: "#e74c3c" }}>*Required</span>
      </label>
      <input
        id="centreName"
        type="text"
        placeholder="Example: Smt Ushatai Gogte Girls High School, Belagavi"
        value={newCentre.pp_exam_centre_name}
        onChange={(e) => handleCentreChange("pp_exam_centre_name", e.target.value)}
        required
        maxLength={100}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="address">Address of exam center</label>
      <input
        id="address"
        type="text"
        placeholder="Full address of the exam centre"
        value={newCentre.address}
        onChange={(e) => handleCentreChange("address", e.target.value)}
        maxLength={200}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="village">Village</label>
      <input
        id="village"
        type="text"
        placeholder="Village name"
        value={newCentre.village}
        onChange={(e) => handleCentreChange("village", e.target.value)}
        maxLength={100}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="pincode">Pincode (5–12 digits)</label>
      <input
        id="pincode"
        type="text"
        placeholder="560001"
        value={newCentre.pincode}
        onChange={(e) => handleCentreChange("pincode", e.target.value)}
        maxLength={12}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="contactPerson">Contact Person Name</label>
      <input
        id="contactPerson"
        type="text"
        placeholder="Person in charge"
        value={newCentre.contact_person}
        onChange={(e) => handleCentreChange("contact_person", e.target.value)}
        maxLength={100}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="contactPhone">Contact Phone (7–12 digits)</label>
      <input
        id="contactPhone"
        type="text"
        placeholder="9876543210"
        value={newCentre.contact_phone}
        onChange={(e) => handleCentreChange("contact_phone", e.target.value)}
        maxLength={12}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="contactEmail">Contact Email</label>
      <input
        id="contactEmail"
        type="email"
        placeholder="contact@example.com"
        value={newCentre.contact_email}
        onChange={(e) => handleCentreChange("contact_email", e.target.value)}
        maxLength={200}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="sittingCapacity">Sitting Capacity</label>
      <input
        id="sittingCapacity"
        type="number"
        placeholder="100"
        value={newCentre.sitting_capacity}
        onChange={(e) => handleCentreChange("sitting_capacity", e.target.value)}
        min="0"
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="latitude">Latitude (e.g. 28.7041)</label>
      <input
        id="latitude"
        type="text"
        placeholder="28.7041"
        value={newCentre.latitude}
        onChange={(e) => handleCentreChange("latitude", e.target.value)}
      />
    </div>

    <div className={classes.formGroup}>
      <label htmlFor="longitude">Longitude (e.g. 77.1025)</label>
      <input
        id="longitude"
        type="text"
        placeholder="77.1025"
        value={newCentre.longitude}
        onChange={(e) => handleCentreChange("longitude", e.target.value)}
      />
    </div>

    {message && (
      <div className={message.startsWith("✅") ? classes.messageSuccess : classes.messageError}>
        {message}
      </div>
    )}

    <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
      <button className={classes.btnGreen} onClick={createCentre}>
        Create Centre
      </button>
      <button className={classes.btnRed} onClick={() => setIsCreatingCentre(false)}>
        Cancel
      </button>
    </div>
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
    href={`http://localhost:5000/api/exams/${entry.exam_id}/${entry.exam_name}/download-all-hall-tickets`}
    download
    className={`${classes.actionButton} ${classes.btnYellow}`}
  >
    <FaDownload /> Hall Tickets
  </a>

  {!entry.frozen_yn || entry.frozen_yn === "N" ? (
    <button
      className={`${classes.deleteButton}`}
      onClick={() => handleDelete(entry.exam_id)}
    >
      <FaTrash /> Delete
    </button>
  ) : null}

  {entry.frozen_yn === "N" && (
    <button
      className={`${classes.btnGreen}`}
      onClick={() => handleFreeze(entry.exam_id)}
    >
      <FaSnowflake /> Freeze Exam
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