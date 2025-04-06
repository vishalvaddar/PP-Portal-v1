import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditForm.css";

const EditForm = () => {
  const { nmms_reg_number } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [institutes, setInstitutes] = useState([]);
  const mediumOptions = ["ENGLISH", "KANNADA"];
  const genderOptions = [
    { label: "Male", value: "M" },
    { label: "Female", value: "F" },
    { label: "Other", value: "O" },
  ];

  const fixedFields = [
    "applicant_id",
    "nmms_reg_number",
    "app_state",
    "nmms_year",
    "district",
    "nmms_block",
    "gmat_score",
    "sat_score",
  ];

  const excludedFields = [
    "nmms_reg_number",
    "createdAt",
    "updatedAt",
    "_id",
    "__v",
  ];

  const fieldLabels = {
    nmms_year: "NMMS YEAR",
    nmms_reg_number: "NMMS REG NUMBER",
    student_name: "STUDENT NAME",
    gender: "GENDER",
    DOB: "DATE OF BIRTH",
    aadhaar: "AADHAAR NO",
    father_name: "FATHER NAME",
    mother_name: "MOTHER NAME",
    family_income_total: "FAMILY INCOME",
    home_address: "HOME ADDRESS",
    contact_no1: "CONTACT NO-1",
    contact_no2: "CONTACT NO-2",
    app_state: "STATE",
    district: "DISTRICT",
    nmms_block: "NMMS BLOCK",
    current_institute_dise_code: "CURRENT SCHOOL NAME",
    previous_institute_dise_code: "PREVIOUS SCHOOL NAME",
    medium: "MEDIUM",
    gmat_score: "GMAT SCORE",
    sat_score: "SAT SCORE",
  };

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/applicants/${nmms_reg_number}`
        );
        if (response.data) {
          setFormData(response.data);
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

    const fetchInstitutes = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/institutes/all"
        );
        setInstitutes(response.data);
      } catch (error) {
        console.error("Error fetching institutes:", error);
      }
    };

    fetchStudentDetails();
    fetchInstitutes();
  }, [nmms_reg_number]);

  useEffect(() => {
    setSecondaryData({
      village: "",
      father_occupation: "",
      mother_occupation: "",
      father_education: "",
      mother_education: "",
      household_size: "",
      own_house: "",
      smart_phone_home: "",
      internet_facility_home: "",
      career_goals: "",
      subjects_of_interest: "",
      transportation_mode: "",
      distance_to_school: "",
      num_two_wheelers: "",
      num_four_wheelers: "",
      irrigation_land: "",
      neighbor_name: "",
      neighbor_phone: "",
      favorite_teacher_name: "",
      favorite_teacher_phone: "",
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Uppercase for specific fields
    if (
      ["student_name", "father_name", "mother_name", "home_address"].includes(
        name
      )
    ) {
      newValue = newValue.toUpperCase();
    }

    // Numeric fields
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
      if (!/^\d*$/.test(newValue)) return;
    }

    // Aadhaar validation
    if (name === "aadhaar" && newValue.length > 12) return;

    // Contact number validation
    if (["contact_no1", "contact_no2"].includes(name) && newValue.length > 10)
      return;

    // Income validation
    if (name === "family_income_total" && parseInt(newValue || 0) > 999999)
      return;

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (formData.aadhaar.length !== 12) {
      setError("Aadhaar must be exactly 12 digits.");
      return;
    }

    if (
      formData.contact_no1.length !== 10 ||
      formData.contact_no2.length !== 10
    ) {
      setError("Contact numbers must be exactly 10 digits.");
      return;
    }

    if (parseInt(formData.family_income_total || 0) > 999999) {
      setError("Family income must be less than ₹10,00,000.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/applicants/${nmms_reg_number.trim()}`,
        { ...formData }
      );
      setSuccess(true);
      setTimeout(() => navigate("/view-applications"), 1500);
    } catch (error) {
      console.error("Error updating student:", error);
      setError("Failed to update student details.");
    }
  };

  if (loading) return <div>Loading student details...</div>;

  return (
    <div className="edit-form-container">
      <h2>Edit Student Details</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Updated successfully!</div>}
      <p className="reg-number">NMMS REG NO: {nmms_reg_number}</p>
      <img src={photoPreview} alt="Profile" className="profile-image" />

      <form onSubmit={handleSubmit}>
        <h3>Primary Info</h3>
        <div className="form-grid">
          {Object.entries(formData || {}).map(([key, value]) => {
            if (excludedFields.includes(key)) return null;

            return (
              <div className="form-group" key={key}>
                <label>{fieldLabels[key] || key.replace(/_/g, " ")}:</label>
                {key === "medium" ? (
                  <select
                    name={key}
                    value={value || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select Medium</option>
                    {mediumOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : key === "gender" ? (
                  <select
                    name={key}
                    value={value || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={key.includes("date") ? "date" : "text"}
                    name={key}
                    value={value || ""}
                    onChange={handleChange}
                    readOnly={fixedFields.includes(key)}
                    maxLength={
                      key === "aadhaar"
                        ? 12
                        : key.includes("contact")
                        ? 10
                        : undefined
                    }
                    minLength={key === "aadhaar" ? 12 : undefined}
                  />
                )}
              </div>
            );
          })}
        </div>

        <h3>Additional Info</h3>
        <div className="form-grid">
          {Object.entries(secondaryData || {}).map(([key, value]) => (
            <div className="form-group" key={key}>
              <label>{key.replace(/_/g, " ").toUpperCase()}:</label>
              <input
                type="text"
                name={key}
                value={value}
                onChange={(e) =>
                  setSecondaryData((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/view-applications")}>
            Cancel
          </button>
          <button type="submit">Update Details</button>
        </div>
      </form>
    </div>
  );
};

export default EditForm;
