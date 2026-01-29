import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import classes from "./EditForm.module.css";
import { 
  useFetchStates, 
  useFetchEducationDistricts, 
  useFetchBlocks, 
  useFetchInstitutes 
} from "../../hooks/useJurisData";

const SECONDARY_FIELDS = [
  "village", "father_occupation", "mother_occupation", "father_education", "mother_education",
  "household_size", "own_house", "smart_phone_home", "internet_facility_home",
  "career_goals", "subjects_of_interest", "transportation_mode", "distance_to_school",
  "num_two_wheelers", "num_four_wheelers", "irrigation_land", "neighbor_name",
  "neighbor_phone", "favorite_teacher_name", "favorite_teacher_phone"
];

const EditForm = () => {
  const { nmms_reg_number } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    personal: true, address: true, educational: true, family: true,
    contact: true, transportation: true, teacher: true, property: true,
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [institutes, setInstitutes] = useState([]);

  // Hooks
  useFetchStates(setStates);
  useFetchEducationDistricts(formData?.app_state, setDistricts);
  useFetchBlocks(formData?.district, setBlocks);
  useFetchInstitutes(formData?.nmms_block, setInstitutes);

  const mediumOptions = ["ENGLISH", "KANNADA", "URDU", "MARATHI"];
  const genderOptions = [{ label: "Male", value: "M" }, { label: "Female", value: "F" }, { label: "Other", value: "O" }];
  const yesNoOptions = [{ label: "Yes", value: "Y" }, { label: "No", value: "N" }];

  const occupationOptions = [
    { value: "Agriculture", label: "Agriculture/Farming" },
    { value: "Dairy-Poultry", label: "Dairy/Poultry/Fishery" },
    { value: "Job-SemiGovt", label: "Job in Cooperative/Semi-Govt" },
    { value: "Job-Govt", label: "Job in Government" },
    { value: "Job-Pvt", label: "Job in Private Sector" },
    { value: "Job-Small", label: "Job in Small Shop/Anganwadi" },
    { value: "Labour-Agri", label: "Labourer in Agricultural" },
    { value: "Labour-Constr", label: "Labourer in Construction" },
    { value: "Labour-Other", label: "Labourer in Others" },
    { value: "Contract", label: "Own Business:Contract Works" },
    { value: "Business", label: "Own Business:Shop/Loom/Transp/Other" },
    { value: "Professional", label: "Professional:Advocate/Doctor/Accountant" },
    { value: "Sales-Agent", label: "Sales/Marketing/LIC Agent" },
    { value: "Self-Employed", label: "Self Employed:Plumber/Elect/Tailor/Driver/Tutor" },
    { value: "Other", label: "Other" },
    { value: "Not-Earning", label: "Not Earning" },
    { value: "Not Alive", label: "Not Alive" }
  ];

  const fieldLabels = {
    nmms_year: "NMMS Year",
    nmms_reg_number: "NMMS Registration Number",
    student_name: "Student Name",
    gender: "Gender",
    dob: "Date of Birth",
    medium: "Medium of Instruction",
    aadhaar: "Aadhaar Number",
    father_name: "Father's Name",
    mother_name: "Mother's Name",
    family_income_total: "Family Income",
    home_address: "Home Address",
    contact_no1: "Primary Contact",
    contact_no2: "Secondary Contact",
    app_state: "State",
    district: "District",
    nmms_block: "Block",
    current_institute_dise_code: "Current School",
    previous_institute_dise_code: "Previous School",
    village: "Village/Town",
    father_occupation: "Father's Occupation",
    mother_occupation: "Mother's Occupation",
    father_education: "Father's Education",
    mother_education: "Mother's Education",
    household_size: "Household Size",
    own_house: "Own House",
    smart_phone_home: "Smart Phone at Home",
    internet_facility_home: "Internet Facility",
    career_goals: "Career Goals",
    subjects_of_interest: "Subjects of Interest",
    transportation_mode: "Transportation Mode",
    distance_to_school: "Distance to School (km)",
    num_two_wheelers: "Number of Two Wheelers",
    num_four_wheelers: "Number of Four Wheelers",
    irrigation_land: "Irrigation Land (acres)",
    neighbor_name: "Neighbor's Name",
    neighbor_phone: "Neighbor's Phone",
    favorite_teacher_name: "Favorite Teacher's Name",
    favorite_teacher_phone: "Teacher's Contact",
    gmat_score: "GMAT Score",
    sat_score: "SAT Score"
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const expandAll = () => {
    const allExpanded = {};
    Object.keys(expandedSections).forEach(key => { allExpanded[key] = true; });
    setExpandedSections(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed = {};
    Object.keys(expandedSections).forEach(key => { allCollapsed[key] = false; });
    setExpandedSections(allCollapsed);
  };

  useEffect(() => {
    let isMounted = true; 

    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/applicants/reg/${nmms_reg_number}`);
        if (!isMounted) return;
        const data = res.data;

        if (data) {
          const dobFromServer = data.data.dob || data.data.DOB;
          const formattedDOB = dobFromServer 
            ? new Date(dobFromServer).toISOString().split('T')[0] 
            : '';

          const primaryData = {
            applicant_id: data.data.applicant_id,
            nmms_year: data.data.nmms_year,
            nmms_reg_number: data.data.nmms_reg_number,
            
            app_state: data.data.app_state,
            division: data.data.division, 
            district: data.data.district,
            nmms_block: data.data.nmms_block,
            cluster: data.data.cluster, 
            
            student_name: data.data.student_name,
            father_name: data.data.father_name,
            mother_name: data.data.mother_name,
            gmat_score: data.data.gmat_score,
            sat_score: data.data.sat_score,
            gender: data.data.gender,
            aadhaar: data.data.aadhaar,
            dob: formattedDOB,
            home_address: data.data.home_address,
            family_income_total: data.data.family_income_total,
            contact_no1: data.data.contact_no1,
            contact_no2: data.data.contact_no2,
            current_institute_dise_code: data.data.current_institute_dise_code,
            previous_institute_dise_code: data.data.previous_institute_dise_code,
            medium: data.data.medium
          };

          const rawSec = data.data;
          const secondaryData = {};
          SECONDARY_FIELDS.forEach(field => {
             secondaryData[field] = rawSec[field] || '';
          });
          // Add ID back
          secondaryData.applicant_id = data.data.applicant_id;

          setFormData(primaryData);
          setSecondaryData(secondaryData);
          setPhotoPreview(data.photo
            ? `${process.env.REACT_APP_BACKEND_API_URL}/uploads/profile_photos/${data.photo}`
            : data.gender === "M" ? "/default-boy.png" : "/default-girl.png"
          );

        } else {
          setError("Student not found.");
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching student data:", err);
          setError("Failed to fetch student data.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudentDetails();

    return () => { isMounted = false; };
  }, [nmms_reg_number]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    // Convert Uppercase
    if (["student_name", "father_name", "mother_name", "home_address", "village", 
         "neighbor_name", "favorite_teacher_name"].includes(name)) {
      val = val.toUpperCase();
    }

    // Numeric Validation
    if (["aadhaar", "contact_no1", "contact_no2", "gmat_score", "sat_score", 
         "family_income_total", "household_size", "num_two_wheelers", 
         "num_four_wheelers", "distance_to_school", "irrigation_land",
         "neighbor_phone", "favorite_teacher_phone"].includes(name)) {
      if (!/^\d*$/.test(val)) return;
    }

    if (name === "aadhaar" && val.length > 12) return;
    if (["contact_no1", "contact_no2", "neighbor_phone", "favorite_teacher_phone"].includes(name) && val.length > 10) return;
    if (name === "family_income_total" && parseInt(val) > 9999999) return;

    // --- CASCADING RESET LOGIC ---
    if (name === "app_state") {
      setFormData(prev => ({ 
        ...prev, [name]: val, division: "", district: "", nmms_block: "", cluster: "", current_institute_dise_code: "" 
      }));
      return; 
    }
    if (name === "district") {
      setFormData(prev => ({ 
        ...prev, [name]: val, nmms_block: "", cluster: "", current_institute_dise_code: "" 
      }));
      return;
    }
    if (name === "nmms_block") {
      setFormData(prev => ({ 
        ...prev, [name]: val, cluster: "", current_institute_dise_code: "" 
      }));
      return;
    }

    if (SECONDARY_FIELDS.includes(name)) {
      setSecondaryData(prev => ({ ...prev, [name]: val }));
    } else {
      // Otherwise assume it is primary data
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const validateForm = () => {
    if (!formData) return false;
    const required = ["student_name", "gender", "contact_no1", "app_state", "district", "nmms_block", "current_institute_dise_code"];
    const phoneRegex = /^\d{10}$/;
    const aadhaarRegex = /^\d{12}$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    for (const field of required) {
      if (!formData[field]) {
        setError(`${fieldLabels[field] || field} is required.`);
        return false;
      }
    }

    if (formData.contact_no1 && !phoneRegex.test(formData.contact_no1)) {
      setError("Primary contact must be 10 digits.");
      return false;
    }
    if (formData.aadhaar && !aadhaarRegex.test(formData.aadhaar)) {
      setError("Aadhaar must be exactly 12 digits.");
      return false;
    }
    if (formData.student_name && !nameRegex.test(formData.student_name)) {
        setError("Student name must contain only letters and spaces.");
        return false;
    }
    // --- FIX 7: Use lowercase 'dob' ---
    if (formData.dob) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.dob > today) {
        setError("Date of birth cannot be in the future.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const prepareDataForSubmit = (obj) => {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (val === "" || val === undefined) {
            cleaned[key] = null;
        } else {
            cleaned[key] = val;
        }
    });
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
  
    if (!validateForm()) {
      window.scrollTo(0, 0);
      setLoading(false);
      return;
    }
  
    try {
      const { state_name, district_name, block_name, ...filteredFormData } = formData;
  
      // Apply clean logic (empty string -> null)
      const cleanPrimary = prepareDataForSubmit(filteredFormData);
      const cleanSecondary = prepareDataForSubmit(secondaryData);

      const primaryDataToSend = {
        ...cleanPrimary,
        // Explicit casts using strict checks
        nmms_year: cleanPrimary.nmms_year ? Number(cleanPrimary.nmms_year) : null,
        gmat_score: cleanPrimary.gmat_score ? Number(cleanPrimary.gmat_score) : null,
        sat_score: cleanPrimary.sat_score ? Number(cleanPrimary.sat_score) : null,
        family_income_total: cleanPrimary.family_income_total ? Number(cleanPrimary.family_income_total) : null,
        // Ensure dob is sent exactly as is (YYYY-MM-DD or null)
        dob: cleanPrimary.dob
      };
  
      const secondaryDataToSend = {
        ...cleanSecondary,
        household_size: cleanSecondary.household_size ? Number(cleanSecondary.household_size) : null,
        distance_to_school: cleanSecondary.distance_to_school ? Number(cleanSecondary.distance_to_school) : null,
        num_two_wheelers: cleanSecondary.num_two_wheelers ? Number(cleanSecondary.num_two_wheelers) : 0,
        num_four_wheelers: cleanSecondary.num_four_wheelers ? Number(cleanSecondary.num_four_wheelers) : 0,
        irrigation_land: cleanSecondary.irrigation_land ? Number(cleanSecondary.irrigation_land) : 0
      };
  
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/applicants/${formData.applicant_id}/update`,
        {
          primaryData: primaryDataToSend,
          secondaryData: secondaryDataToSend
        }
      );
  
      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => navigate(`/admin/admissions/view-student-info/${nmms_reg_number}`), 1500);
      } else {
        setError("Update was not completely successful.");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.response?.data?.message || "Failed to update student information.");
    } finally {
      setLoading(false);
      window.scrollTo(0, 0);
    }
  };

  const renderField = (key, value, isSecondary = false, disabled = false) => {
    
    const commonProps = {
      name: key,
      value: value === null || value === undefined ? "" : value,
      onChange: handleChange,
      className: classes.formInput,
      disabled: disabled,
    };

    return (
      <div className={classes.formGroup} key={key}>
        <label className={classes.formLabel}>{fieldLabels[key] || key}</label>
        
        {key === "gender" ? (
          <select {...commonProps}>
            <option value="">Select Gender</option>
            {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : key === "medium" ? (
          <select {...commonProps}>
            <option value="">Select Medium</option>
            {mediumOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : ["own_house", "smart_phone_home", "internet_facility_home"].includes(key) ? (
          <select {...commonProps}>
            <option value="">Select</option>
            {yesNoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : ["father_occupation", "mother_occupation"].includes(key) ? (
          <select {...commonProps}>
            <option value="">Select Occupation</option>
            {occupationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

        ) : key === "app_state" ? (
            <select {...commonProps}>
              <option value="">Select State</option>
              {states && states.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

        ) : key === "district" ? (
            <select {...commonProps} disabled={!formData.app_state}>
              <option value="">Select District</option>
              {districts && districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

        ) : key === "nmms_block" ? (
            <select {...commonProps} disabled={!formData.district}>
              <option value="">Select Block</option>
              {blocks && blocks.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

        ) : ["current_institute_dise_code", "previous_institute_dise_code"].includes(key) ? (
          <select {...commonProps} disabled={key === "current_institute_dise_code" && !formData.nmms_block}>
            <option value="">Select School</option>
            {institutes && institutes.map(institute => (
              <option key={institute.institute_id} value={institute.dise_code}>
                {institute.institute_name} ({institute.dise_code})
              </option>
            ))}
          </select>

        ) : key === "dob" ? ( // --- FIX 10: Check lowercase 'dob' ---
          <input type="date" {...commonProps} />
        ) : (
          <input type="text" {...commonProps} />
        )}
      </div>
    );
  };

  const renderSectionHeader = (title, section) => (
    <div
      className={`${classes.sectionHeader} ${expandedSections[section] ? classes.expanded : ''}`}
      onClick={() => toggleSection(section)}
    >
      <div className={classes.sectionTitle}>
        <span className={classes.sectionIcon}>{sectionIcons[section]}</span>
        <h3>{title}</h3>
      </div>
      <div className={classes.sectionToggle}>
        <span className={classes.toggleIcon}>{expandedSections[section] ? '−' : '+'}</span>
      </div>
    </div>
  );

  const sectionIcons = {
    personal: "👤", address: "🏠", educational: "🎓", family: "👪",
    contact: "📞", transportation: "🚌", teacher: "👨‍🏫", property: "🏗"
  };

  if (loading && !formData) {
    return <div className={classes.container}>Loading...</div>;
  }

  if (!formData && !loading) {
    return <div className={classes.container}>Student not found.</div>;
  }

  return (
    <div className={classes.container}>
      <div className={classes.headerSection}>
        {/* Header content unchanged */}
        <div className={classes.headerContent}> 
          <h2 className={classes.pageTitle}>Edit Applicant</h2>
          <div className={classes.studentMeta}>
            <span className={classes.idLabel}>NMMS Reg No: </span>
            <span className={classes.idValue}>{nmms_reg_number}</span>
          </div>
        </div>
      </div>

      {error && <div className={classes.errorMessage}>{error}</div>}
      {success && <div className={classes.successMessage}>Update successful!</div>}

      <div className={classes.sectionControls}>
        <button type="button" className={classes.expandAllBtn} onClick={expandAll}>Expand All</button>
        <button type="button" className={classes.collapseAllBtn} onClick={collapseAll}>Collapse All</button>
      </div>

      <form onSubmit={handleSubmit} className={classes.studentForm}>
        
        {renderSectionHeader("Personal Information", "personal")}
        <div className={`${classes.sectionContent} ${expandedSections.personal ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("student_name", formData.student_name)}
            {renderField("gender", formData.gender)}
            {/* FIX 11: Render field key must be 'dob' */}
            {renderField("dob", formData.dob)}
            {renderField("aadhaar", formData.aadhaar)}
            {renderField("medium", formData.medium)}
            {renderField("father_name", formData.father_name)}
            {renderField("mother_name", formData.mother_name)}
          </div>
        </div>

        {/* ... Rest of the sections ... */}
        {/* Just ensure you pass secondaryData fields correctly like this: */}
        
        {renderSectionHeader("Family Information", "family")}
        <div className={`${classes.sectionContent} ${expandedSections.family ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("father_occupation", secondaryData?.father_occupation, true)}
            {renderField("mother_occupation", secondaryData?.mother_occupation, true)}
            {renderField("father_education", secondaryData?.father_education, true)}
            {renderField("mother_education", secondaryData?.mother_education, true)}
            {renderField("family_income_total", formData.family_income_total)}
            {renderField("household_size", secondaryData?.household_size, true)}
          </div>
        </div>
        
        {/* ... Add other sections identically to your original code, 
            just ensure you are using secondaryData?.field_name 
            and that field_name is in the SECONDARY_FIELDS list ... */}

        {/* Example for Transport Section */}
        {renderSectionHeader("Transportation & Facilities", "transportation")}
        <div className={`${classes.sectionContent} ${expandedSections.transportation ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("transportation_mode", secondaryData?.transportation_mode, true)}
            {renderField("distance_to_school", secondaryData?.distance_to_school, true)}
            {renderField("smart_phone_home", secondaryData?.smart_phone_home, true)}
            {renderField("internet_facility_home", secondaryData?.internet_facility_home, true)}
          </div>
        </div>

        {/* Example for Contact Section */}
        {renderSectionHeader("Contact Information", "contact")}
        <div className={`${classes.sectionContent} ${expandedSections.contact ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("contact_no1", formData.contact_no1)}
            {renderField("contact_no2", formData.contact_no2)}
            {renderField("neighbor_name", secondaryData?.neighbor_name, true)}
            {renderField("neighbor_phone", secondaryData?.neighbor_phone, true)}
          </div>
        </div>
        
         {/* Example for Address Section */}
         {renderSectionHeader("Address & Location", "address")}
        <div className={`${classes.sectionContent} ${expandedSections.address ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("app_state", formData.app_state)} 
            {renderField("district", formData.district)}
            {renderField("nmms_block", formData.nmms_block)}
            {renderField("home_address", formData.home_address)}
            {secondaryData && renderField("village", secondaryData.village, true)}
          </div>
        </div>

         {/* Example for Education Section */}
         {renderSectionHeader("Educational Information", "educational")}
        <div className={`${classes.sectionContent} ${expandedSections.educational ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("current_institute_dise_code", formData.current_institute_dise_code)}
            {renderField("previous_institute_dise_code", formData.previous_institute_dise_code)}
            {renderField("gmat_score", formData.gmat_score)}
            {renderField("sat_score", formData.sat_score)}
            {secondaryData && renderField("subjects_of_interest", secondaryData.subjects_of_interest, true)}
            {secondaryData && renderField("career_goals", secondaryData.career_goals, true)}
          </div>
        </div>

        {/* Example for Teacher Section */}
        {renderSectionHeader("Teacher Information", "teacher")}
        <div className={`${classes.sectionContent} ${expandedSections.teacher ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("favorite_teacher_name", secondaryData?.favorite_teacher_name, true)}
            {renderField("favorite_teacher_phone", secondaryData?.favorite_teacher_phone, true)}
          </div>
        </div>

        {/* Example for Property Section */}
        {renderSectionHeader("Property Information", "property")}
        <div className={`${classes.sectionContent} ${expandedSections.property ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("own_house", secondaryData?.own_house, true)}
            {renderField("num_two_wheelers", secondaryData?.num_two_wheelers, true)}
            {renderField("num_four_wheelers", secondaryData?.num_four_wheelers, true)}
            {renderField("irrigation_land", secondaryData?.irrigation_land, true)}
          </div>
        </div>


        <div className={classes.formActions}>
          <button type="button" className={classes.cancelBtn} onClick={() => navigate(`/admin/admissions/view-student-info/${nmms_reg_number}`)} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className={classes.submitButton} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditForm;