import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditForm.css";

const EditForm = () => {
  const { nmms_reg_number } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const mediumOptions = ["ENGLISH", "KANNADA"];

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/applicants/${nmms_reg_number}`
        );
        if (response.data) {
          setFormData(response.data);
          // Set initial photo preview
          if (response.data.photo) {
            setPhotoPreview(
              `http://localhost:5000/uploads/profile_photos/${response.data.photo}`
            );
          } else {
            setPhotoPreview(
              response.data.gender === "M"
                ? "/default-boy.png"
                : "/default-girl.png"
            );
          }
        } else {
          setError("Student not found.");
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
        setError("Failed to load student data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentDetails();
  }, [nmms_reg_number]);

  const fixedFields = [
    "applicant_id",
    "nmms_reg_number",
    "nmms_year",
    "district",
    "gmat_score",
    "sat_score",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;
    if (
      ["student_name", "father_name", "mother_name", "home_address"].includes(
        name
      )
    ) {
      newValue = value.toUpperCase();
    }

    // Allow only numbers for specific fields
    if (
      [
        "aadhaar",
        "contact_no1",
        "contact_no2",
        "gmat_score",
        "sat_score",
        "family_income_total",
      ].includes(name)
    ) {
      if (!/^\d*$/.test(value)) return; // Prevent non-numeric characters
    }

    // Restrict GMAT and SAT scores to 2-digit numbers (0-90)
    if (["gmat_score", "sat_score"].includes(name)) {
      if (!/^(?:[0-9]|[1-8][0-9]|90)?$/.test(value)) return;
    }

    if (fixedFields.includes(name)) {
      return; // Ignore changes to fixed fields
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // First upload photo if changed
      let photoName = formData.photo;
      // Then update student data
      const updatedData = { ...formData };
      if (photoName) updatedData.photo = photoName;

      await axios.put(
        `http://localhost:5000/applicants/${nmms_reg_number.trim()}`,
        updatedData
      );

      setSuccess(true);
      setTimeout(() => navigate("/view-applications"), 1500);
    } catch (error) {
      console.error("Error updating details:", error);
      setError("Failed to update student details.");
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading student details...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <p>{error}</p>
        <button
          className="back-button"
          onClick={() => navigate("/view-applications")}
        >
          Back to Applications
        </button>
      </div>
    );

  // Fields to exclude from editing
  const excludedFields = [
    "nmms_reg_number",
    "createdAt",
    "updatedAt",
    "_id",
    "__v",
  ];

  // Field labels mapping
  const fieldLabels = {
    nmms_year: "NMMS YEAR ",
    nmms_reg_number: "NMMS REG NUMBER ",
    student_name: "STUDENT NAME ",
    gender: "GENDER ",
    DOB: "DATE OF BIRTH ",
    aadhaar: "AADHAAR NO ",
    father_name: "FATHER NAME ",
    mother_name: "MATHER NAME ",
    family_income_total: "FAMILY INCOME ",
    home_address: "HOME ADDRESS ",
    contact_no1: "CONTACT NO1 ",
    contact_no2: "CONTACT NO2 ",
    app_state: "STATE ",
    district: "DISTRICT ",
    nmms_block: "NMMS BLOCK ",
    current_institute_dise_code: "CURRENT SCHOOL DISE CODE ",
    previous_institute_dise_code: "PREVIOUS SCHOOL DISE CODE ",
    medium: "MEDIUM",
    gmat_score: "GMAT SCORE",
    sat_score: "SAT SCORE",
  };

  return (
    <div className="edit-form-container">
      {success && (
        <div className="success-overlay">
          <div className="success-message">
            <svg viewBox="0 0 24 24" className="success-icon">
              <path
                fill="currentColor"
                d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
              />
            </svg>
            <p>Details updated successfully!</p>
          </div>
        </div>
      )}

      <div className="edit-form-card">
        <div className="form-header">
          <h2>Edit Student Details</h2>
          <p className="reg-number">Registration: {nmms_reg_number}</p>
        </div>

        <div className="profile-section">
          <label htmlFor="photo-upload" className="profile-image-container">
            <img src={photoPreview} alt="Profile" className="profile-image" />
            <div className="profile-overlay">
              {/* <span>Change Photo</span> */}
            </div>
            {/* <input
              id="photo-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            /> */}
          </label>
        </div>

        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {Object.keys(formData || {}).map(
              (key) =>
                !excludedFields.includes(key) && (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>
                      {fieldLabels[key] || key.replace(/_/g, " ")}:
                    </label>
                    {key === "medium" ? (
                      <select
                        id={key}
                        name={key}
                        className="form-input"
                        value={formData[key] || ""}
                        onChange={handleChange}
                      >
                        <option value="">Select Medium</option>
                        {mediumOptions.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={key.includes("date") ? "date" : "text"}
                        id={key}
                        name={key}
                        className="form-input"
                        value={formData[key] || ""}
                        onChange={handleChange}
                        placeholder={`Enter ${
                          fieldLabels[key] || key.replace(/_/g, " ")
                        }`}
                        readOnly={fixedFields.includes(key)}
                      />
                    )}
                  </div>
                )
            )}
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate("/view-applications")}
            >
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Update Details
              <svg viewBox="0 0 24 24" className="submit-icon">
                <path
                  fill="currentColor"
                  d="M17,3L22.25,7.5L17,12L22.25,16.5L17,21V18H14.26L11.44,15.18L13.56,13.06L15.5,15H17V12L17,9H15.5L6.5,18H2V15H5.26L14.26,6H17V3M2,6H6.5L9.32,8.82L7.2,10.94L5.26,9H2V6Z"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditForm;
