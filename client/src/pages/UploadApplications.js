import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewApplication.css"; // Add your custom styles here

const districtBlockMapping = {
  "BELAGAVI": ["BAILHONGAL", "BELAGAVI CITY", "BELAGAVI RURAL", "KHANAPUR", "KITTUR", "RAMDURG", "SOUNDATTI"],
  "CHIKKODI": ["ATHANI", "CHIKODI", "GOKAK", "HUKKERI", "KAGWAD", "MUDALGI", "NIPPANI", "RAIBAG"],
  "DHARWAD": ["DHARWAD", "DHARWAD CITY", "HUBLI", "HUBLI CITY", "KHALGHATAGI", "KUNDAGOL", "NAVALGUND"],
  "UTTARA KANNADA": ["HALIYAL", "JOIDA", "MUNDAGOD", "SIDDAPUR", "SIRSI", "YELLAPUR", "ANKOLA", "BHATKAL", "HONNAVAR", "KUMTA", "KARWAR"],
  "GADAG": ["GADAG CITY", "GADAG RURAL", "MUNDARAGI", "NARAGUND", "RON", "SHIRHATTI"],
  "VIJAYPUR": ["BASAVAN BAGEWADI", "CHADACHAN", "INDI", "MUDDEBIHAL", "SINDAGI", "VIJAYPUR RURAL", "VIJAYPUR URBAN"],
  "HAVERI": ["BYADAGI", "HANAGAL", "HAVERI", "HIREKERUR", "RANNEBENNUR", "SAVANUR", "SHIGGOAN"],
  "SIRSI": ["SIRSI"],
  "BAGALKOT": ["BADAMI", "BAGALKOT", "HUNAGUND", "JAMAKHANDI", "MUDHOL", "BILAGI"]
};

const educationDistricts = Object.keys(districtBlockMapping);

const NewApplication = () => {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    nmms_year: currentYear,
    nmms_reg_number: "",
    app_state: "Karnataka",
    district: "",
    nmms_block: "",
    student_name: "",
    father_name: "",
    mother_name: "",
    gmat_score: "",
    sat_score: "",
    gender: "",
    aadhaar: "",
    DOB: "",
    home_address: "",
    family_income_total: "",
    contact_no1: "",
    contact_no2: "",
    current_institute_dise_code: "",
    previous_institute_dise_code: "",
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
    favorite_teacher_phone: ""
  });

  const [institutes, setInstitutes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInstitutes = async () => {
      if (formData.nmms_block) {
        try {
          const response = await axios.get(`http://localhost:5000/institutes/by-block/${formData.nmms_block}`);
          setInstitutes(response.data);
        } catch (error) {
          console.error("Error fetching institutes:", error);
          setInstitutes([]);
        }
      }
    };
    fetchInstitutes();
  }, [formData.nmms_block]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nmms_reg_number) newErrors.nmms_reg_number = "Registration number is required";
    if (!formData.student_name) newErrors.student_name = "Student name is required";
    if (!formData.father_name) newErrors.father_name = "Father name is required";
    if (!formData.district) newErrors.district = "District is required";
    if (!formData.nmms_block) newErrors.nmms_block = "Block is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.post("http://localhost:5000/applicants/create", formData);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("❌ Failed to submit application.");
    }
  };

  if (submitted) {
    return (
      <div className="confirmation">
        <h2>✅ Application Submitted Successfully!</h2>
        <p>Thank you for your application.</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>📄 New Application Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4>Primary Info</h4>
          {[
            ["nmms_year", "NMMS Year", "number", "Enter year"],
            ["nmms_reg_number", "Registration Number", "text", "e.g., NMMS2024ABC"],
            ["app_state", "State", "text", "Karnataka"],
            ["student_name", "Student Name", "text", "Full name of the student"],
            ["father_name", "Father Name", "text", "Father’s name"],
            ["mother_name", "Mother Name", "text", "Mother’s name"],
            ["gmat_score", "GMAT Score", "number", "0-100"],
            ["sat_score", "SAT Score", "number", "0-100"],
            ["aadhaar", "Aadhaar", "text", "12-digit Aadhaar number"],
            ["DOB", "Date of Birth", "date", ""],
            ["home_address", "Home Address", "text", "Full address"],
            ["family_income_total", "Family Income", "number", "Annual income in ₹"],
            ["contact_no1", "Primary Contact", "text", "Parent’s phone number"],
            ["contact_no2", "Alternate Contact", "text", "Optional"],
            ["previous_institute_dise_code", "Previous Institute DISE Code", "number", "Enter code"]
          ].map(([name, label, type, placeholder]) => (
            <div key={name} className="form-group">
              <label>{label}:</label>
              <input
                className="form-input"
                type={type}
                name={name}
                value={formData[name]}
                placeholder={placeholder}
                onChange={handleChange}
                required={["nmms_reg_number", "student_name", "father_name"].includes(name)}
              />
              {errors[name] && <p className="error">{errors[name]}</p>}
            </div>
          ))}

          {/* Gender Dropdown */}
          <div className="form-group">
            <label>Gender:</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required className="form-input">
              <option value="">Select Gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          {/* District Dropdown */}
          <div className="form-group">
            <label>District:</label>
            <select name="district" value={formData.district} onChange={handleChange} className="form-input" required>
              <option value="">Select District</option>
              {educationDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.district && <p className="error">{errors.district}</p>}
          </div>

          {/* Block Dropdown */}
          <div className="form-group">
            <label>Block:</label>
            <select name="nmms_block" value={formData.nmms_block} onChange={handleChange} className="form-input" required>
              <option value="">Select Block</option>
              {(districtBlockMapping[formData.district] || []).map(block => (
                <option key={block} value={block}>{block}</option>
              ))}
            </select>
            {errors.nmms_block && <p className="error">{errors.nmms_block}</p>}
          </div>

          {/* Institute Dropdown */}
          <div className="form-group">
            <label>Current Institute:</label>
            <select
              name="current_institute_dise_code"
              value={formData.current_institute_dise_code}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Select Institute</option>
              {institutes.map((inst) => (
                <option key={inst.dise_code} value={inst.dise_code}>{inst.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="form-section">
          <h4>Secondary Info</h4>
          {[
            ["village", "Village", "text", ""],
            ["father_occupation", "Father’s Occupation", "text", ""],
            ["mother_occupation", "Mother’s Occupation", "text", ""],
            ["father_education", "Father’s Education", "text", ""],
            ["mother_education", "Mother’s Education", "text", ""],
            ["household_size", "Household Size", "number", ""],
            ["own_house", "Own House (Y/N)", "text", ""],
            ["smart_phone_home", "Smartphone at Home (Y/N)", "text", ""],
            ["internet_facility_home", "Internet at Home (Y/N)", "text", ""],
            ["career_goals", "Career Goals", "text", ""],
            ["subjects_of_interest", "Subjects of Interest", "text", ""],
            ["transportation_mode", "Transportation Mode", "text", ""],
            ["distance_to_school", "Distance to School (km)", "number", ""],
            ["num_two_wheelers", "Two Wheelers at Home", "number", ""],
            ["num_four_wheelers", "Four Wheelers at Home", "number", ""],
            ["irrigation_land", "Irrigation Land (acres)", "number", ""],
            ["neighbor_name", "Neighbor’s Name", "text", ""],
            ["neighbor_phone", "Neighbor’s Phone", "text", ""],
            ["favorite_teacher_name", "Favorite Teacher", "text", ""],
            ["favorite_teacher_phone", "Teacher’s Phone", "text", ""]
          ].map(([name, label, type, placeholder]) => (
            <div key={name} className="form-group">
              <label>{label}:</label>
              <input
                className="form-input"
                type={type}
                name={name}
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-success mt-4">Submit Application</button>
      </form>
    </div>
  );
};

export default NewApplication;
