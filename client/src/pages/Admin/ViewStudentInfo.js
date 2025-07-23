import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import classes from "./ViewStudentInfo.module.css";
// import classes from "./EditForm.module.css"; // Assuming you reuse the CSS

const ViewStudentInfo = () => {
  const { nmms_reg_number } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [institutes, setInstitutes] = useState([]); // Keep if needed for display
  const [expandedSections, setExpandedSections] = useState({
    personal: true, address: true, educational: true, family: true, 
    contact: true, transportation: true, teacher: true, property: true
  });

  const fieldLabels = {
    nmms_year: "NMMS Year",
    nmms_reg_number: "NMMS Registration Number",
    student_name: "Student Name",
    gender: "Gender",
    DOB: "Date of Birth",
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
    nmms_block: "NMMS Block",
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

  const sectionIcons = {
    personal: "👤",
    address: "🏠",
    educational: "🎓",
    family: "👪",
    contact: "📞",
    transportation: "🚌",
    teacher: "👨‍🏫",
    property: "🏗"
  };

  const genderOptions = [
    { label: "Male", value: "M" },
    { label: "Female", value: "F" },
    { label: "Other", value: "O" },
  ];
  
  const yesNoOptions = [
    { label: "Yes", value: "Y" },
    { label: "No", value: "N" }
  ];

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        console.log(`${process.env.REACT_APP_API_URL}/applicants/${nmms_reg_number}`); // Debugging line
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/applicants/${nmms_reg_number}`);
        const data = res.data;

        if (data) {
          const dobFromServer = data.dob;
          console.log("DOB from server:", dobFromServer); // Debugging line
          const formattedDOB = dobFromServer ? new Date(dobFromServer).toISOString().split('T')[0] : '';
          
          const primaryData = {
            applicant_id: data.applicant_id,
            nmms_year: data.nmms_year,
            nmms_reg_number: data.nmms_reg_number,
            app_state: data.app_state,
            district: data.district,
            state_name: data.state_name,
            district_name: data.district_name,
            block_name: data.block_name,
            nmms_block: data.nmms_block,
            student_name: data.student_name,
            father_name: data.father_name,
            mother_name: data.mother_name,
            gmat_score: data.gmat_score,
            sat_score: data.sat_score,
            gender: data.gender,
            aadhaar: data.aadhaar,
            DOB: formattedDOB, // Use formatted date
            home_address: data.home_address,
            family_income_total: data.family_income_total,
            contact_no1: data.contact_no1,
            contact_no2: data.contact_no2,
            current_institute_dise_code: data.current_institute_dise_code,
            previous_institute_dise_code: data.previous_institute_dise_code,
            medium: data.medium
          };

          const secondaryData = {
            applicant_id: data.applicant_id,
            village: data.village || '',
            father_occupation: data.father_occupation || '',
            mother_occupation: data.mother_occupation || '',
            father_education: data.father_education || '',
            mother_education: data.mother_education || '',
            household_size: data.household_size || '',
            own_house: data.own_house || '',
            smart_phone_home: data.smart_phone_home || '',
            internet_facility_home: data.internet_facility_home || '',
            career_goals: data.career_goals || '',
            subjects_of_interest: data.subjects_of_interest || '',
            transportation_mode: data.transportation_mode || '',
            distance_to_school: data.distance_to_school || '',
            num_two_wheelers: data.num_two_wheelers || '',
            num_four_wheelers: data.num_four_wheelers || '',
            irrigation_land: data.irrigation_land || '',
            neighbor_name: data.neighbor_name || '',
            neighbor_phone: data.neighbor_phone || '',
            favorite_teacher_name: data.favorite_teacher_name || '',
            favorite_teacher_phone: data.favorite_teacher_phone || ''
          };

          setFormData(primaryData);
          setSecondaryData(secondaryData);
          setPhotoPreview(data.photo ? `${process.env.REACT_APP_API_URL}/uploads/profile_photos/${data.photo}` : (data.gender === "M" ? "/default-boy.png" : "/default-girl.png"));

          // Fetch institutes after getting the block code
          if (primaryData.nmms_block) {
            fetchInstitutes(primaryData.nmms_block);
          }

        } else {
          setError("Student not found.");
          setFormData(null);
          setSecondaryData(null);
        }
      } catch (err) {
        setError("Failed to fetch student data. Please try again.");
        setFormData(null);
        setSecondaryData(null);
        console.error("Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchInstitutes = async (blockCode) => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/institutes-by-block/${blockCode}`);
        setInstitutes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching institutes", err);
        setInstitutes([]); // Set to empty array on error
      }
    };

    fetchStudentDetails();

  }, [nmms_reg_number]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Function to get institute name from dise code
  const getInstituteName = (diseCode) => {
    if (!diseCode || !institutes || institutes.length === 0) return `DISE: ${diseCode || 'N/A'}`;
    const institute = institutes.find(inst => inst.dise_code === diseCode);
    return institute ? institute.institute_name : `DISE: ${diseCode}`;
  };

  // Simplified renderField for viewing only
  const renderField = (key, value) => {
    const label = fieldLabels[key] || key;
    let displayValue = value;

    if (value === null || value === undefined || value === '') {
      displayValue = '-';
    } else if (key === 'gender') {
      const genderOption = genderOptions.find(opt => opt.value === value);
      displayValue = genderOption ? genderOption.label : value;
    } else if (['own_house', 'smart_phone_home', 'internet_facility_home'].includes(key)) {
      const yesNoOption = yesNoOptions.find(opt => opt.value === value);
      displayValue = yesNoOption ? yesNoOption.label : value;
    } else if (key === 'current_institute_dise_code' || key === 'previous_institute_dise_code') {
      displayValue = getInstituteName(value);
    }
    // Add more formatting here if needed

    return (
      <div className={classes.formGroup} key={key}>
        <label className={classes.formLabel}>{label}</label>
        <div className={classes.formValue}>{displayValue}</div>
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
        <span>{expandedSections[section] ? '−' : '+'}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={classes.container}>
        <div className={classes.loadingMessage}>
          <div className={classes.spinner}></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className={classes.container}>
        <div className={classes.errorMessage}>
          <span className={classes.errorIcon}>⚠</span>
          <span>No student data found for NMMS Registration Number: {nmms_reg_number}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.headerSection}>
        <div className={classes.headerContent}>
          <h2 className={classes.pageTitle}>Applicant</h2>
          <div className={classes.studentMeta}>
            <span className={classes.idLabel}>NMMS Reg No:</span>
            <span className={classes.idValue}>{nmms_reg_number}</span>
          </div>
          <div className={classes.studentIdRow}>
            <span className={classes.idLabel}>Student ID:</span>
            <span className={classes.idValue}>{formData.applicant_id}</span>
          </div>
        </div>
        <div className={classes.profileImageContainer}>
          <img 
            src={photoPreview} 
            alt="Profile" 
            className={classes.profileImage} 
            onError={(e) => { e.target.src = formData.gender === "M" ? "/default-boy.png" : "/default-girl.png"; }}
          />
        </div>
      </div>

      {error && 
        <div className={classes.errorMessage}>
          <span className={classes.errorIcon}>⚠</span>
          <span>{error}</span>
        </div>
      }

      <div className={classes.sectionControls}>
        <button 
          type="button" 
          className={classes.editBtn} 
          onClick={() => navigate(`/admin/admissions/edit-form/${nmms_reg_number}`)}
        >
          Edit Profile  
        </button>
      </div>

      <div className={classes.studentForm}>
        {/* Personal Information Section */}
        {renderSectionHeader("Personal Information", "personal")}
        <div className={`${classes.sectionContent} ${expandedSections.personal ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("student_name", formData.student_name)}
            {renderField("gender", formData.gender)}
            {renderField("DOB", formData.DOB)}
            {renderField("aadhaar", formData.aadhaar)}
            {renderField("medium", formData.medium)}
            {renderField("father_name", formData.father_name)}
            {renderField("mother_name", formData.mother_name)}
          </div>
        </div>

        {/* Address Information Section */}
        {renderSectionHeader("Address Information", "address")}
        <div className={`${classes.sectionContent} ${expandedSections.address ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("app_state", formData.state_name)}
            {renderField("district", formData.district_name)}
            {renderField("nmms_block", formData.block_name)}
            {renderField("home_address", formData.home_address)}
            {secondaryData && renderField("village", secondaryData.village)}
          </div>
        </div>

        {/* Educational Information Section */}
        {renderSectionHeader("Educational Information", "educational")}
        <div className={`${classes.sectionContent} ${expandedSections.educational ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("current_institute_dise_code", formData.current_institute_dise_code)}
            {renderField("previous_institute_dise_code", formData.previous_institute_dise_code)}
            {renderField("gmat_score", formData.gmat_score)}
            {renderField("sat_score", formData.sat_score)}
            {secondaryData && renderField("subjects_of_interest", secondaryData.subjects_of_interest)}
            {secondaryData && renderField("career_goals", secondaryData.career_goals)}
          </div>
        </div>

        {/* Family Information Section */}
        {renderSectionHeader("Family Information", "family")}
        <div className={`${classes.sectionContent} ${expandedSections.family ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("father_occupation", secondaryData?.father_occupation)}
            {renderField("mother_occupation", secondaryData?.mother_occupation)}
            {renderField("father_education", secondaryData?.father_education)}
            {renderField("mother_education", secondaryData?.mother_education)}
            {renderField("family_income_total", formData.family_income_total)}
            {renderField("household_size", secondaryData?.household_size)}
          </div>
        </div>

        {/* Contact Information Section */}
        {renderSectionHeader("Contact Information", "contact")}
        <div className={`${classes.sectionContent} ${expandedSections.contact ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("contact_no1", formData.contact_no1)}
            {renderField("contact_no2", formData.contact_no2)}
            {renderField("neighbor_name", secondaryData?.neighbor_name)}
            {renderField("neighbor_phone", secondaryData?.neighbor_phone)}
          </div>
        </div>

        {/* Transportation Section */}
        {renderSectionHeader("Transportation & Facilities", "transportation")}
        <div className={`${classes.sectionContent} ${expandedSections.transportation ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("transportation_mode", secondaryData?.transportation_mode)}
            {renderField("distance_to_school", secondaryData?.distance_to_school)}
            {renderField("smart_phone_home", secondaryData?.smart_phone_home)}
            {renderField("internet_facility_home", secondaryData?.internet_facility_home)}
          </div>
        </div>

        {/* Teacher Information Section */}
        {renderSectionHeader("Teacher Information", "teacher")}
        <div className={`${classes.sectionContent} ${expandedSections.teacher ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("favorite_teacher_name", secondaryData?.favorite_teacher_name)}
            {renderField("favorite_teacher_phone", secondaryData?.favorite_teacher_phone)}
          </div>
        </div>

        {/* Property Information Section */}
        {renderSectionHeader("Property Information", "property")}
        <div className={`${classes.sectionContent} ${expandedSections.property ? classes.visible : ''}`}>
          <div className={classes.formGrid}>
            {renderField("own_house", secondaryData?.own_house)}
            {renderField("num_two_wheelers", secondaryData?.num_two_wheelers)}
            {renderField("num_four_wheelers", secondaryData?.num_four_wheelers)}
            {renderField("irrigation_land", secondaryData?.irrigation_land)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewStudentInfo;