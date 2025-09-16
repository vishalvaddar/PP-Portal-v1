import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ProfileSection from "../../components/ProfileSection";
import ProfileField from "../../components/ProfileField";
import classes from "./ViewStudentInfo.module.css";

const ViewStudentInfo = () => {
  const { nmms_reg_number } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(null);
  const [secondaryData, setSecondaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [institutes, setInstitutes] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  const isFromBatches = location.pathname.includes("/batches/view-student-info/");
  const pageTitle = isFromBatches ? "Student Profile" : "Applicant Profile";

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
    family_income_total: "Family Income (₹)",
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
    num_two_wheelers: "Two Wheelers",
    num_four_wheelers: "Four Wheelers",
    irrigation_land: "Irrigation Land (acres)",
    neighbor_name: "Neighbor's Name",
    neighbor_phone: "Neighbor's Phone",
    favorite_teacher_name: "Favorite Teacher",
    favorite_teacher_phone: "Teacher's Contact",
    gmat_score: "GMAT Score",
    sat_score: "SAT Score"
  };


const sections = [
    {
      key: 'personal',
      title: 'Personal Information',
      icon: '👤',
      fields: ['student_name', 'gender', 'DOB', 'aadhaar', 'medium', 'father_name', 'mother_name']
    },
    {
      key: 'address',
      title: 'Address Information',
      icon: '🏠',
      fields: ['app_state', 'district', 'nmms_block', 'home_address', 'village']
    },
    {
      key: 'educational',
      title: 'Educational Information',
      icon: '🎓',
      fields: ['current_institute_dise_code', 'previous_institute_dise_code', 'gmat_score', 'sat_score', 'subjects_of_interest', 'career_goals']
    },
    {
      key: 'family',
      title: 'Family Information',
      icon: '👨‍👩‍👧‍👦',
      fields: ['father_occupation', 'mother_occupation', 'father_education', 'mother_education', 'family_income_total', 'household_size']
    },
    {
      key: 'contact',
      title: 'Contact Information',
      icon: '📞',
      fields: ['contact_no1', 'contact_no2', 'neighbor_name', 'neighbor_phone']
    },
    {
      key: 'transportation',
      title: 'Transportation & Facilities',
      icon: '🚌',
      fields: ['transportation_mode', 'distance_to_school', 'smart_phone_home', 'internet_facility_home']
    },
    {
      key: 'teacher',
      title: 'Teacher Information',
      icon: '👨‍🏫',
      fields: ['favorite_teacher_name', 'favorite_teacher_phone']
    },
    {
      key: 'property',
      title: 'Property Information',
      icon: '🏘️',
      fields: ['own_house', 'num_two_wheelers', 'num_four_wheelers', 'irrigation_land']
    }
  ];


  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/applicants/${nmms_reg_number}`);
        const data = res.data;

        if (data) {
          const dobFromServer = data.dob;
          const formattedDOB = dobFromServer ? new Date(dobFromServer).toISOString().split('T')[0] : '';
          
          const primaryData = {
            applicant_id: data.applicant_id,
            nmms_year: data.nmms_year,
            nmms_reg_number: data.nmms_reg_number,
            app_state: data.state_name,
            district: data.district_name,
            nmms_block: data.block_name,
            student_name: data.student_name,
            father_name: data.father_name,
            mother_name: data.mother_name,
            gmat_score: data.gmat_score,
            sat_score: data.sat_score,
            gender: data.gender,
            aadhaar: data.aadhaar,
            DOB: formattedDOB,
            home_address: data.home_address,
            family_income_total: data.family_income_total,
            contact_no1: data.contact_no1,
            contact_no2: data.contact_no2,
            current_institute_dise_code: data.current_institute_dise_code,
            previous_institute_dise_code: data.previous_institute_dise_code,
            medium: data.medium
          };

          const secondaryData = {
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
          setPhotoPreview(data.photo 
            ? `${process.env.REACT_APP_BACKEND_API_URL}/uploads/profile_photos/${data.photo}` 
            : (data.gender === "M" ? "/default-boy.png" : "/default-girl.png")
          );

          if (primaryData.nmms_block) {
            fetchInstitutes(data.nmms_block);
          }
        } else {
          setError("Student not found.");
        }
      } catch (err) {
        setError("Failed to fetch student data. Please try again.");
        console.error("Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchInstitutes = async (blockCode) => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/institutes-by-block/${blockCode}`);
        setInstitutes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching institutes", err);
        setInstitutes([]);
      }
    };

    fetchStudentDetails();
  }, [nmms_reg_number]);

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatValue = (key, value) => {
    if (!value) return "Not specified";
    if (key === "DOB") return new Date(value).toLocaleDateString("en-IN");
    if (key === "family_income_total") return `₹${Number(value).toLocaleString("en-IN")}`;
    return value;
  };

  const renderField = (field) => {
    const value = formData?.[field] ?? secondaryData?.[field] ?? "";
    return <ProfileField key={field} label={fieldLabels[field] || field} value={formatValue(field, value)} />;
  };

  if (loading) return <p>Loading...</p>;
  if (!formData) return <p>{error || "No applicant found"}</p>;

  return (
    <div className={classes.container}>
      <h1 className={classes.pageTitle}>{pageTitle}</h1>

      {/* Profile Header */}
      <div className={classes.headerSection}>
        <div>
          <p><strong>NMMS Reg No:</strong> {formData.nmms_reg_number}</p>
          <p><strong>Applicant ID:</strong> {formData.applicant_id}</p>
        </div>
        <img src={photoPreview} alt="Applicant" className={classes.profileImage} />
      </div>

      <button className={classes.editBtn} onClick={() => navigate(`/admin/admissions/edit-form/${nmms_reg_number}`)}>
        Edit Profile
      </button>

      {sections.map(section => (
        <ProfileSection
          key={section.key}
          section={section}
          expanded={expandedSections[section.key]}
          toggle={toggleSection}
          renderField={renderField}
        />
      ))}
    </div>
  );
};

export default ViewStudentInfo;
