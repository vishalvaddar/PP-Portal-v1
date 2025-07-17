import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FileText } from "lucide-react";
import classes from "./NewApplication.module.css";
import { useFetchStates, useFetchDistricts, useFetchBlocks, useFetchInstitutes } from "../../hooks/useJurisData";

const NewApplication = () => {
  const currentYear = new Date().getFullYear();
  const startYear = 2022;
  const yearOptions = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  const submitButtonRef = useRef(null);

  const initialFormData = {
    nmms_year: "",
    nmms_reg_number: "",
    student_name: "",
    gender: "",
    DOB: "",
    aadhaar: "",
    father_name: "",
    mother_name: "",
    family_income_total: "",
    home_address: "",
    contact_no1: "",
    contact_no2: "",
    app_state: "",
    district: "",
    nmms_block: "",
    current_institute_dise_code: "",
    previous_institute_dise_code: "",
    medium: "",
    gmat_score: "",
    sat_score: "",
  };

  const initialSecondaryData = {
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
  };

  const [formData, setFormData] = useState(initialFormData);
  const [secondaryData, setSecondaryData] = useState(initialSecondaryData);
  const [institutes, setInstitutes] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission status

  // Fetching jurisdictional data
  useFetchStates(setStates);
  useFetchDistricts(formData.app_state, setDistricts);
  useFetchBlocks(formData.district, setBlocks);
  useFetchInstitutes(formData.nmms_block, setInstitutes);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Convert specific fields to uppercase
    if (["student_name", "father_name", "mother_name", "home_address"].includes(name)) {
      newValue = value.toUpperCase();
    }

    // Allow only numbers for specific primary data fields
    if (["aadhaar", "contact_no1", "contact_no2", "family_income_total"].includes(name)) {
      if (!/^\d*$/.test(value)) return; // Prevent non-numeric characters
    }

    // Restrict GMAT and SAT scores to 2-digit numbers (0-90)
    if (["gmat_score", "sat_score"].includes(name)) {
      // Allow empty string to clear the field, otherwise validate
      if (value === "") {
        newValue = "";
      } else if (!/^(?:[0-9]|[1-8][0-9]|90)$/.test(value)) {
        return; // Prevent values outside 0-90
      }
    }

    // Reset dependent dropdowns when parent selection changes
    if (name === 'app_state') {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        district: "",
        nmms_block: "",
        current_institute_dise_code: "",
        previous_institute_dise_code: ""
      }));
      setDistricts([]);
      setBlocks([]);
      setInstitutes([]);
    } else if (name === 'district') {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        nmms_block: "",
        current_institute_dise_code: "",
        previous_institute_dise_code: ""
      }));
      setBlocks([]);
      setInstitutes([]);
    } else if (name === 'nmms_block') {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
        current_institute_dise_code: "",
        previous_institute_dise_code: ""
      }));
      setInstitutes([]);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  const handleSecondaryChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Numeric validation for specific fields
    if (["household_size", "distance_to_school", "num_two_wheelers",
      "num_four_wheelers", "irrigation_land"].includes(name)) {
      if (!/^\d*\.?\d*$/.test(newValue)) return;
    }

    // Phone number validation for secondary data
    if (["neighbor_phone", "favorite_teacher_phone"].includes(name)) {
      if (!/^\d*$/.test(newValue)) return; // Only allow digits
      if (newValue.length > 10) return; // Restrict to 10 digits
    }

    // Yes/No fields validation
    if (["own_house", "smart_phone_home", "internet_facility_home"].includes(name)) {
      newValue = newValue.toUpperCase();
      // Allow empty string, "YES", or "NO"
      if (newValue !== "YES" && newValue !== "NO" && newValue !== "") {
        return;
      }
    }

    setSecondaryData((prev) => ({
      ...prev,
      [name]: newValue
    }));
  };

  const validateForm = () => {
    let validationErrors = {};
    const namePattern = /^[a-zA-Z\s]+$/;
    const aadhaarPattern = /^\d{12}$/;
    const incomePattern = /^\d+$/;
    const phonePattern = /^\d{10}$/;
    const scorePattern = /^(?:[0-8]?\d|90)$/; // 0 to 90 max

    // Basic Information Validation
    if (!formData.nmms_year) {
      validationErrors.nmms_year = "Please select an NMMS Year.";
    }
    if (!formData.nmms_reg_number || formData.nmms_reg_number.length !== 11 || !/^\d{11}$/.test(formData.nmms_reg_number)) {
      validationErrors.nmms_reg_number = "NMMS Registration Number must be exactly 11 digits.";
    }
    if (!formData.student_name || !formData.student_name.match(namePattern)) {
      validationErrors.student_name = "Student name should contain only letters and spaces.";
    }
    if (!formData.gender) {
      validationErrors.gender = "Please select a gender.";
    }
    if (formData.DOB && new Date(formData.DOB) > new Date()) {
      validationErrors.DOB = "Date of birth cannot be in the future.";
    }
    if (formData.aadhaar && !formData.aadhaar.match(aadhaarPattern)) {
      validationErrors.aadhaar = "Aadhaar number must be exactly 12 digits.";
    }

    // Family Information Validation
    if (!formData.father_name || !formData.father_name.match(namePattern)) {
      validationErrors.father_name = "Father's name should contain only letters and spaces.";
    }
    if (formData.mother_name && !formData.mother_name.match(namePattern)) {
      validationErrors.mother_name = "Mother's name should contain only letters and spaces.";
    }
    if (formData.family_income_total && !formData.family_income_total.match(incomePattern)) {
      validationErrors.family_income_total = "Family income must be a valid number.";
    }

    // Contact Information Validation
    if (!formData.contact_no1 || !formData.contact_no1.match(phonePattern)) {
      validationErrors.contact_no1 = "Primary contact number should be exactly 10 digits.";
    }
    if (formData.contact_no2 && !formData.contact_no2.match(phonePattern)) {
      validationErrors.contact_no2 = "Secondary contact number should be exactly 10 digits.";
    }

    // Educational Information Validation
    if (!formData.app_state) {
      validationErrors.app_state = "Please select a state.";
    }
    if (!formData.district) {
      validationErrors.district = "Please select a district.";
    }
    if (!formData.nmms_block) {
      validationErrors.nmms_block = "Please select an NMMS Block.";
    }
    if (!formData.medium) {
      validationErrors.medium = "Please select a medium.";
    }
    if (!formData.current_institute_dise_code) {
      validationErrors.current_institute_dise_code = "Please select the current school.";
    }

    // Test Scores Validation
    // Scores are required fields in the form, so we validate their presence and format
    if (formData.gmat_score === "" || !formData.gmat_score.match(scorePattern)) {
      validationErrors.gmat_score = "GMAT score must be a number between 0 and 90.";
    }
    if (formData.sat_score === "" || !formData.sat_score.match(scorePattern)) {
      validationErrors.sat_score = "SAT score must be a number between 0 and 90.";
    }

    // Secondary Data Validation (add as needed, these are examples)
    if (secondaryData.neighbor_phone && !/^\d{10}$/.test(secondaryData.neighbor_phone)) {
      validationErrors.neighbor_phone = "Neighbor's phone number must be 10 digits.";
    }
    if (secondaryData.favorite_teacher_phone && !/^\d{10}$/.test(secondaryData.favorite_teacher_phone)) {
      validationErrors.favorite_teacher_phone = "Favorite teacher's phone number must be 10 digits.";
    }
    if (["own_house", "smart_phone_home", "internet_facility_home"].some(field => secondaryData[field] && !["YES", "NO"].includes(secondaryData[field]))) {
      // This checks if any of these fields have a value that's not "YES" or "NO" (and not empty)
      validationErrors.yesNoFields = "Please enter 'YES' or 'NO' for the specified fields.";
    }


    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Disable button to prevent multiple submissions

    if (!validateForm()) {
      setIsSubmitting(false); // Re-enable button if validation fails
      // Scroll to the first error or show a general message
      alert("Please correct the errors in the form.");
      return;
    }

    try {
      // Submit primary data
      const primaryResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/applicants/create`, formData);

      if (primaryResponse.status === 201) {
        if (primaryResponse.data && primaryResponse.data.applicant_id) {
          // Add the applicant_id to secondaryData before submitting
          const secondaryDataWithApplicantId = {
            ...secondaryData,
            applicant_id: primaryResponse.data.applicant_id
          };
          try {
            // Submit secondary data with the applicant_id
            await axios.post(
              `${process.env.REACT_APP_API_URL}/api/secondaryApplicants/create`,
              secondaryDataWithApplicantId
            );
          } catch (secondaryError) {
            console.error("Error creating secondary data record:", secondaryError);
            // Decide how to handle secondary data submission failure:
            // - Option 1: Alert user about secondary data failure but primary success
            // - Option 2: Rollback primary data (more complex, requires backend support)
            // For now, we'll just log and proceed.
            alert("Secondary information could not be saved. Please contact support if this issue persists.");
          }
        }

        animateSubmitButton();
        alert("Application submitted successfully!");
        setFormData(initialFormData);
        setSecondaryData(initialSecondaryData); // Reset secondary data too
        setErrors({});
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false); // Re-enable button after submission attempt
    }
  };

  const animateSubmitButton = () => {
    const button = submitButtonRef.current;
    if (!button) return;

    button.classList.add("state-1", "animated");

    setTimeout(() => {
      button.classList.add("state-2");

      setTimeout(() => {
        button.classList.remove("state-1", "state-2", "animated");
      }, 2000);
    }, 2000);
  };

  return (
    <div className={classes.container}>
      <h2 className={classes.h2}><FileText size={25} /> New Application</h2>
      {Object.keys(errors).length > 0 && (
        <div className={classes.errorContainer}>
          <p>Please correct the following errors:</p>
          <ul>
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate> {/* Add noValidate to prevent browser's default validation */}
        <div className={classes.formSection}>
          <h3 className={classes.sectionTitle}>🧾 Basic Information</h3>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label className={classes.label}> NMMS YEAR : <span className={classes.required}>*</span></label>
              <select
                name="nmms_year"
                value={formData.nmms_year}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.nmms_year && (<p className={classes.errorMessage}>{errors.nmms_year}</p>)}
            </div>
            <div className={classes.formField}>
              <label>NMMS Reg Number: <span className={classes.required}>*</span></label>
              <input
                type="text"
                name="nmms_reg_number"
                value={formData.nmms_reg_number}
                onChange={handleChange}
                maxLength="11"
                inputMode="numeric"
                required
              />
              {errors.nmms_reg_number && (<p className={classes.errorMessage}>{errors.nmms_reg_number}</p>)}
            </div>
          </div>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>Student Name: <span className={classes.required}>*</span></label>
              <input
                type="text"
                name="student_name"
                value={formData.student_name}
                onChange={handleChange}
                required
              />
              {errors.student_name && (<p className={classes.errorMessage}>{errors.student_name}</p>)}
            </div>
            <div className={classes.formField}>
              <label>Gender : <span className={classes.required}>*</span></label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              {errors.gender && (<p className={classes.errorMessage}>{errors.gender}</p>)}
            </div>
          </div>

          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>Date of Birth:</label>
              <input
                type="date"
                name="DOB"
                value={formData.DOB}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
              />
              {errors.DOB && <p className={classes.errorMessage}>{errors.DOB}</p>}
            </div>
            <div className={classes.formField}>
              <label>Aadhaar:</label> {/* Aadhaar is not marked as required in your form but has validation, consider if it should be required */}
              <input
                type="text"
                name="aadhaar"
                value={formData.aadhaar}
                onChange={handleChange}
                maxLength="12"
                inputMode="numeric"
              />
              {errors.aadhaar && (<p className={classes.errorMessage}>{errors.aadhaar}</p>)}
            </div>
          </div>
        </div>

        <div className={classes.sectionDivider} />
        <div className={classes.formSection}>
          <h3 className={classes.sectionTitle}>👨‍👩‍👧‍👦 Family Information</h3>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>Father Name: <span className={classes.required}>*</span></label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name}
                onChange={handleChange}
                required
              />
              {errors.father_name && (<p className={classes.errorMessage}>{errors.father_name}</p>)}
            </div>
            <div className={classes.formField}>
              <label>Mother Name:</label>
              <input
                type="text"
                name="mother_name"
                value={formData.mother_name}
                onChange={handleChange}
              />
              {errors.mother_name && (<p className={classes.errorMessage}>{errors.mother_name}</p>)}
            </div>
          </div>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>Family Income (monthly):</label>
              <input
                type="text"
                name="family_income_total"
                value={formData.family_income_total}
                onChange={handleChange}
                maxLength="7"
                inputMode="numeric"
                placeholder="Monthly income in rupees"
              />
              {errors.family_income_total && (<p className={classes.errorMessage}>{errors.family_income_total}</p>)}
            </div>
            <div className={classes.formField}>
              <label>Home Address:</label>
              <input
                type="text"
                name="home_address"
                value={formData.home_address}
                onChange={handleChange}
                placeholder="Complete residential address"
              />
            </div>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div className={classes.formSection}>
          <h3 className={classes.sectionTitle}>☎️ Contact Information</h3>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>Contact No 1 (Whatsapp): <span className={classes.required}>*</span></label>
              <input
                type="text"
                name="contact_no1"
                value={formData.contact_no1}
                onChange={handleChange}
                required
                maxLength="10"
                inputMode="tel" // Use tel for phone numbers
                placeholder="10-digit mobile number"
              />
              {errors.contact_no1 && (<p className={classes.errorMessage}>{errors.contact_no1}</p>)}
            </div>
            <div className={classes.formField}>
              <label>Contact No 2:</label> {/* Not marked as required, but has validation, consider if it should be required */}
              <input
                type="text"
                name="contact_no2"
                value={formData.contact_no2}
                onChange={handleChange}
                maxLength="10"
                inputMode="tel"
                placeholder="Alternative contact number"
              />
              {errors.contact_no2 && (<p className={classes.errorMessage}>{errors.contact_no2}</p>)}
            </div>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div className={classes.formSection}>
          <h3 className={classes.sectionTitle}>🎓 Educational Information</h3>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>State: <span className={classes.required}>*</span></label>
              <select
                name="app_state"
                value={formData.app_state}
                onChange={handleChange}
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.app_state && (<p className={classes.errorMessage}>{errors.app_state}</p>)}
            </div>
            <div className={classes.formField}>
              <label>EDUCATION DISTRICT: <span className={classes.required}>*</span></label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                disabled={!formData.app_state} // Disable until state is selected
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.district && (<p className={classes.errorMessage}>{errors.district}</p>)}
            </div>
          </div>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>NMMS Block: <span className={classes.required}>*</span></label>
              <select
                name="nmms_block"
                onChange={handleChange}
                value={formData.nmms_block}
                required
                disabled={!formData.district} // Disable until district is selected
              >
                <option value="">Select Block</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
              </select>
              {errors.nmms_block && (<p className={classes.errorMessage}>{errors.nmms_block}</p>)}
            </div>
            <div className={classes.formField}>
              <label>Medium: <span className={classes.required}>*</span></label>
              <select
                name="medium"
                value={formData.medium}
                onChange={handleChange}
                required
              >
                <option value="">Select medium</option>
                <option value="KANNADA">KANNADA</option>
                <option value="ENGLISH">ENGLISH</option>
                <option value="URDU">URDU</option>
                <option value="MARATHI">MARATHI</option>
              </select>
              {errors.medium && (<p className={classes.errorMessage}>{errors.medium}</p>)}
            </div>
          </div>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>Current School Name: <span className={classes.required}>*</span></label>
              <select
                name="current_institute_dise_code"
                value={formData.current_institute_dise_code}
                onChange={handleChange}
                required
                disabled={!formData.nmms_block} // Disable until block is selected
              >
                <option value="">Select School</option>
                {institutes.map((inst) => (
                  <option key={inst.institute_id} value={inst.dise_code}>
                    {inst.institute_name} ({inst.dise_code})
                  </option>
                ))}
              </select>
              {errors.current_institute_dise_code && (<p className={classes.errorMessage}>{errors.current_institute_dise_code}</p>)}
            </div>
            <div className={classes.formField}>
              <label>Previous School Name:</label>
              <select
                name="previous_institute_dise_code"
                value={formData.previous_institute_dise_code}
                onChange={handleChange}
                disabled={!formData.nmms_block} // Disable until block is selected
              >
                <option value="">Select School</option>
                {institutes.map((inst) => (
                  <option key={inst.institute_id} value={inst.dise_code}>
                    {inst.institute_name} ({inst.dise_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className={classes.sectionDivider} />
        <div className={classes.formSection}>
          <h3 className={classes.sectionTitle}>📝 Test Scores</h3>
          <div className={classes.fieldGroup}>
            <div className={classes.formField}>
              <label>GMAT Score: <span className={classes.required}>*</span></label>
              <input
                type="number" // Use type="number" for scores, but keep handleChange logic for custom validation
                name="gmat_score"
                value={formData.gmat_score}
                onChange={handleChange}
                inputMode="numeric"
                maxLength="2"
                required
                min="0"
                max="90"
                placeholder="Score between 0-90"
              />
              {errors.gmat_score && (<p className={classes.errorMessage}>{errors.gmat_score}</p>)}
            </div>
            <div className={classes.formField}>
              <label>SAT Score: <span className={classes.required}>*</span></label>
              <input
                type="number" // Use type="number" for scores, but keep handleChange logic for custom validation
                name="sat_score"
                value={formData.sat_score}
                onChange={handleChange}
                inputMode="numeric"
                maxLength="2"
                required
                min="0"
                max="90"
                placeholder="Score between 0-90"
              />
              {errors.sat_score && (<p className={classes.errorMessage}>{errors.sat_score}</p>)}
            </div>
          </div>
        </div>

        <button
          type="submit"
          ref={submitButtonRef}
          className={`${classes.submitButton} submit-button`}
          disabled={isSubmitting} // Disable button during submission
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default NewApplication;