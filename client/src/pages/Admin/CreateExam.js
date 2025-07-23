import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaBuilding,
  FaPencilAlt,
  FaTasks,
  FaCheckCircle,
  FaExclamationCircle,
  FaTrash,
  FaDownload,
  FaListAlt,
  FaLock,
  FaRegSnowflake
} from "react-icons/fa";
import useCreateExamHooks from "../../hooks/CreateExamHooks";
import classes from "./CreateExam.module.css";

// WIZARD COMPONENT
const ExamCreationWizard = ({ onCancel }) => {
  const {
    districts,
    blocks,
    loading,
    message,
    centres,
    newCentreName,
    setNewCentreName,
    formData,
    setFormData,
    handleChange,
    handleBlockCheckboxChange,
    handleSubmit,
    createCentre,
    deleteCentre,
    usedBlocks
  } = useCreateExamHooks();

  const [step, setStep] = useState(1);
  const [isCreatingCentre, setIsCreatingCentre] = useState(false);
  const [centreSelectionMode, setCentreSelectionMode] = useState(null);

  const handleBack = () => setStep(prev => prev - 1);

  useEffect(() => {
    if (formData.centreId && formData.examDate) {
      const selectedCentre = centres.find(c => c.pp_exam_centre_id === formData.centreId);
      const centreName = selectedCentre?.pp_exam_centre_name?.replace(/\s+/g, '_') || '';
      const date = formData.examDate;

      setFormData(prev => ({
        ...prev,
        examName: `${centreName}_${date}`
      }));
    }
  }, [formData.centreId, formData.examDate, centres]);

  const handleNext = async () => {
    if (step === 1) {
      if (centreSelectionMode === "new") {
        setIsCreatingCentre(true);
      } else if (centreSelectionMode === "existing" && formData.centreId) {
        setStep(2);
      } else {
        alert("Please select or create an exam centre.");
      }
    } else if (step === 2) {
      if (formData.examName && formData.examDate) {
        setStep(3);
      } else {
        alert("Please fill all exam details before proceeding.");
      }
    }
  };

  const selectedCentreName =
    centres.find(c => c.pp_exam_centre_id === formData.centreId)?.pp_exam_centre_name || newCentreName;
  const selectedDistrictName = districts.find(d => d.id === formData.district)?.name;
  const selectedBlockNames =
    formData.blocks.map(blockId => blocks.find(b => b.id === blockId)?.name).join(", ") || "None selected";

  return (
    <div className={classes.wizardOverlay}>
      <div className={classes.wizardContainer}>
        <div className={classes.wizardHeader}>
          <h2>Create a New Exam</h2>
          <button onClick={onCancel} className={classes.closeButton} title="Cancel">
            ×
          </button>
        </div>

        <div className={classes.progressBar}>
          <div className={`${classes.progressStep} ${step >= 1 ? classes.active : ""}`}>
            <FaBuilding /> Choose Centre
          </div>
          <div className={`${classes.progressStep} ${step >= 2 ? classes.active : ""}`}>
            <FaPencilAlt /> Schedule Exam
          </div>
          <div className={`${classes.progressStep} ${step >= 3 ? classes.active : ""}`}>
            <FaTasks /> Assign Student
          </div>
        </div>

        <form id="wizardForm" onSubmit={handleSubmit} className={classes.wizardBody}>
          {step === 1 && (
            <div className={classes.stepContent}>
              <h3>Step 1: Choose Exam Centre</h3>
              <div className={classes.choiceContainer}>
                <div
                  className={`${classes.choiceCard} ${
                    centreSelectionMode === "existing" ? classes.selected : ""
                  }`}
                  onClick={() => setCentreSelectionMode("existing")}
                >
                  Use Existing Centre
                </div>
                {/* <div
                  className={`${classes.choiceCard} ${
                    centreSelectionMode === "new" ? classes.selected : ""
                  }`}
                  onClick={() => setCentreSelectionMode("new")}
                >
                  Create New Centre
                </div> */}
              </div>

              {centreSelectionMode === "existing" && (
                <div className={classes.inputWithAction}>
                  <select 
                    name="centreId" 
                    value={formData.centreId} 
                    onChange={handleChange} 
                    required
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
              )}
            </div>
          )}

          {step === 2 && (
            <div className={classes.stepContent}>
              <h3>Step 2: Define Exam Details</h3>
              <label>Exam Name</label>
              <input
                type="text"
                name="examName"
                placeholder="Auto-generated from Centre and Date"
                value={formData.examName}
                readOnly
              />

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
            </div>
          )}

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
                      const createdId = await createCentre();
                      if (createdId) {
                        setFormData({ ...formData, centreId: createdId });
                        setIsCreatingCentre(false);
                        setStep(2);
                      }
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
                    setCentreSelectionMode(null);
                  }} 
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={classes.stepContent}>
              <h3>Step 3: Assign Students</h3>
              <div className={classes.formGroup}>
                <label>District</label>
                <select 
                  name="district" 
                  value={formData.district} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">-- Select District --</option>
                  {districts?.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={classes.formGroup}>
                <label>Assign shortlisted students from the selected blocks to an exam center.</label>
                <div className={classes.checkboxGrid}>
                  {blocks.map(b => (
                    <div
                      key={b.id}
                      className={`${classes.checkboxItem} ${
                        usedBlocks.includes(Number(b.id)) ? classes.disabled : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={`b-${b.id}`}
                        checked={formData.blocks.includes(b.id)}
                        onChange={() => handleBlockCheckboxChange(b.id)}
                        disabled={usedBlocks.includes(Number(b.id))}
                      />
                      <label htmlFor={`b-${b.id}`}>
                        {b.name} {usedBlocks.includes(Number(b.id)) && <span>(In use)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className={classes.reviewSection}>
                <h4>
                  <FaCheckCircle /> Review Your Details
                </h4>
                <p>
                  <strong>Centre:</strong> {selectedCentreName}
                </p>
                <p>
                  <strong>Exam Name:</strong> {formData.examName}
                </p>
                <p>
                  <strong>Date:</strong> {formData.examDate}
                </p>
                <p>
                  <strong>District:</strong> {selectedDistrictName}
                </p>
                <p>
                  <strong>Blocks:</strong> {selectedBlockNames}
                </p>
              </div>
            </div>
          )}
        </form>

        <div className={classes.wizardNav}>
          <div className={classes.messageArea}>
            {message && (
              <div className={message.includes("✅") ? classes.success : classes.error}>
                {message}
              </div>
            )}
          </div>
          <div className={classes.buttonGroup}>
            {step > 1 && (
              <button type="button" onClick={handleBack} className={classes.backButton}>
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={handleNext}
                className={classes.nextButton}
                disabled={isCreatingCentre}
              >
                {isCreatingCentre ? "Creating..." : "Next"}
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                form="wizardForm"
                className={classes.submitButton}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Confirm & Create Exam"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// MAIN COMPONENT
const CreateExam = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isCreatingCentre, setIsCreatingCentre] = useState(false);
  const { entries, isLoading, error, deleteExam, toggleFreezeExam, createCentre, newCentreName, setNewCentreName } = useCreateExamHooks();

  return (
    <div className={classes.pageContainer}>
      {isWizardOpen && <ExamCreationWizard onCancel={() => setIsWizardOpen(false)} />}

      <header className={classes.dashboardHeader}>
        <h1>Exam Dashboard</h1>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
          <button
            type="button"
            className={classes.createButton}
            onClick={() => setIsCreatingCentre(true)}
          >
            <FaPlus /> Create Centre
          </button>
          <button 
            className={classes.createButton} 
            onClick={() => setIsWizardOpen(true)}
          >
            <FaPlus /> Create New Exam
          </button>
        </div>
      </header>

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

      <main>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className={classes.errorText}>Error: {error}</p>
        ) : entries?.length > 0 ? (
          <div className={classes.examGrid}>
            {entries.map(entry => (
              <div key={entry.exam_id} className={classes.examCard}>
                <div className={classes.cardHeader}>
                  <h3>{entry.exam_name}</h3>
                  <span>ID: {entry.exam_id}</span>
                </div>
                <div className={classes.cardBody}>
                  <p>
                    <strong>Centre:</strong> {entry.pp_exam_centre_name || "N/A"}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(entry.exam_date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>District:</strong> {entry.district_name || "N/A"}
                  </p>
                  <p>
                    <strong>Blocks:</strong>{" "}
                    {entry.blocks?.map(b => b.name).join(", ") || "N/A"}
                  </p>
                </div>
                <div className={classes.cardFooter}>
                  <a
                    href={`$${process.env.REACT_APP_API_URL}/api/exams/${entry.exam_id}/student-list`}
                    download
                    className={`${classes.actionButton} ${classes.btnGreen}`}
                  >
                    <FaListAlt /> Calling List
                  </a>
                  <a
                    href={`$${process.env.REACT_APP_API_URL}/api/exams/${entry.exam_id}/download-all-hall-tickets`}
                    download
                    className={`${classes.actionButton} ${classes.btnYellow}`}
                  >
                    <FaDownload />  Hall Tickets

                  </a>
                  {entry.frozen_yn === "N" ? (
                    <>
                      <button
                        onClick={() => window.confirm("Are you sure?") && toggleFreezeExam(entry.exam_id)}
                        className={`${classes.actionButton} ${classes.btnBlue}`}
                      >
                        <FaRegSnowflake /> Freeze
                      </button>
                      <button
                        onClick={() => window.confirm("Are you sure?") && deleteExam(entry.exam_id)}
                        className={`${classes.actionButton} ${classes.btnRed}`}
                      >
                        <FaTrash /> Delete
                      </button>
                    </>
                  ) : (
                    <div className={classes.frozenTag}>
                      <FaLock /> Frozen
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={classes.emptyState}>
            <FaExclamationCircle size={50} />
            <h2>No Exams Found</h2>
            <button onClick={() => setIsWizardOpen(true)} className={classes.createButton}>
              <FaPlus /> Create First Exam
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateExam;