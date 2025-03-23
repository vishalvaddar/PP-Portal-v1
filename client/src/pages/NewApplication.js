import React, { useState, useEffect } from "react";
import axios from "axios";

const districtBlockMapping = {
  BELAGAVI: [
    "BAILHONGAL",
    "BELAGAVI CITY",
    "BELAGAVI RURAL",
    "KHANAPUR",
    "KITTUR",
    "RAMDURG",
    "SOUNDATTI",
  ],
  CHIKKODI: [
    "ATHANI",
    "CHIKODI",
    "GOKAK",
    "HUKKERI",
    "KAGWAD",
    "MUDALGI",
    "NIPPANI",
    "RAIBAG",
  ],
  DHARWAD: [
    "DHARWAD",
    "DHARWAD CITY",
    "HUBLI",
    "HUBLI CITY",
    "KHALGHATAGI",
    "KUNDAGOL",
    "NAVALGUND",
  ],
  "UTTARA KANNADA": [
    "HALIYAL",
    "JOIDA",
    "MUNDAGOD",
    "SIDDAPUR",
    "SIRSI",
    "YELLAPUR",
    "ANKOLA",
    "BHATKAL",
    "HONNAVAR",
    "KUMTA",
    "KARWAR",
  ],
  GADAG: [
    "GADAG CITY",
    "GADAG RURAL",
    "MUNDARAGI",
    "NARAGUND",
    "RON",
    "SHIRHATTI",
  ],
  VIJAYPUR: [
    "BASAVAN BAGEWADI",
    "CHADACHAN",
    "INDI",
    "MUDDEBIHAL",
    "SINDAGI",
    "VIJAYPUR RURAL",
    "VIJAYPUR URBAN",
  ],
  HAVERI: [
    "BYADAGI",
    "HANAGAL",
    "HAVERI",
    "HIREKERUR",
    "RANNEBENNUR",
    "SAVANUR",
    "SHIGGOAN",
  ],
  SIRSI: ["SIRSI"],
  BAGALKOT: [
    "BADAMI",
    "BAGALKOT",
    "HUNAGUND",
    "JAMAKHANDI",
    "MUDHOL",
    "BILAGI",
  ],
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
    favorite_teacher_phone: "",
  });

  const [institutes, setInstitutes] = useState([]);

  useEffect(() => {
    const fetchInstitutes = async () => {
      if (formData.nmms_block) {
        try {
          const response = await axios.get(
            `http://localhost:5000/institutes/by-block/${formData.nmms_block}`
          );
          console.log("Fetched institutes:", response.data);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/applicants/create", formData);
      alert("✅ Application submitted successfully!");
      window.location.reload();
    } catch (error) {
      console.error("❌ Error submitting application:", error);
      alert("❌ Failed to submit application.");
    }
  };

  return (
    <div className="container">
      <h2>📄 New Application</h2>
      <form onSubmit={handleSubmit}>
        <h4>Primary Info</h4>

        <div>
          <label>NMMS Year: </label>
          <input
            type="number"
            name="nmms_year"
            value={formData.nmms_year}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>NMMS Reg Number: </label>
          <input
            type="text"
            name="nmms_reg_number"
            value={formData.nmms_reg_number}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,12}$/.test(value)) {
                setFormData({ ...formData, nmms_reg_number: value });
              }
            }}
            required
          />
        </div>

        <div>
          <label>State: </label>
          <select
            name="app_state"
            value={formData.app_state}
            onChange={handleChange}
            required
          >
            <option value="Karnataka">Karnataka</option>
          </select>
        </div>

        <div>
          <label>District: </label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            required
          >
            <option value="">Select District</option>
            {educationDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Block: </label>
          <select
            name="nmms_block"
            value={formData.nmms_block}
            onChange={handleChange}
            required
          >
            <option value="">Select Block</option>
            {formData.district &&
              districtBlockMapping[formData.district].map((block, index) => (
                <option key={index} value={block}>
                  {block}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label>Student Name: </label>
          <input
            type="text"
            name="student_name"
            value={formData.student_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Father Name: </label>
          <input
            type="text"
            name="father_name"
            value={formData.father_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Mother Name: </label>
          <input
            type="text"
            name="mother_name"
            value={formData.mother_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>GMAT Score: </label>
          <input
            type="number"
            name="gmat_score"
            value={formData.gmat_score}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || (Number(value) >= 0 && Number(value) <= 90)) {
                setFormData({ ...formData, gmat_score: value });
              }
            }}
            required
          />
        </div>

        <div>
          <label>SAT Score: </label>
          <input
            type="number"
            name="sat_score"
            value={formData.sat_score}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || (Number(value) >= 0 && Number(value) <= 90)) {
                setFormData({ ...formData, sat_score: value });
              }
            }}
            required
          />
        </div>

        <div>
          <label>Gender: </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </div>

        <div>
          <label>Aadhaar: </label>
          <input
            type="text"
            name="aadhaar"
            value={formData.aadhaar}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,12}$/.test(value)) {
                setFormData({ ...formData, aadhaar: value });
              }
            }}
            required
          />
        </div>

        <div>
          <label>DOB: </label>
          <input
            type="date"
            name="DOB"
            value={formData.DOB}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Home Address: </label>
          <input
            type="text"
            name="home_address"
            value={formData.home_address}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Family Income: </label>
          <input
            type="number"
            name="family_income_total"
            value={formData.family_income_total}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Contact No 1: </label>
          <input
            type="text"
            name="contact_no1"
            value={formData.contact_no1}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, contact_no1: value });
              }
            }}
            required
          />
        </div>

        <div>
          <label>Contact No 2: </label>
          <input
            type="text"
            name="contact_no2"
            value={formData.contact_no2}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, contact_no2: value });
              }
            }}
            required
          />
        </div>

        <div>
          <label>Current Institute: </label>
          <select
            name="current_institute_dise_code"
            value={formData.current_institute_dise_code}
            onChange={handleChange}
            required
          >
            <option value="">Select Institute</option>
            {institutes.map((inst) => (
              <option key={inst.institute_id} value={inst.dise_code}>
                {inst.institute_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Previous Institute: </label>
          <select
            name="previous_institute_dise_code"
            value={formData.previous_institute_dise_code}
            onChange={handleChange}
            required
          >
            <option value="">Select Institute</option>
            {institutes.map((inst) => (
              <option key={`prev-${inst.institute_id}`} value={inst.dise_code}>
                {inst.institute_name}
              </option>
            ))}
          </select>
        </div>

        <h4>Secondary Info</h4>
        {[
          ["village", "Village"],
          ["father_occupation", "Father Occupation"],
          ["mother_occupation", "Mother Occupation"],
          ["father_education", "Father Education"],
          ["mother_education", "Mother Education"],
          ["household_size", "Household Size"],
          ["career_goals", "Career Goals"],
          ["transportation_mode", "Transportation Mode"],
          ["distance_to_school", "Distance to School (km)"],
          ["num_two_wheelers", "Number of Two Wheelers"],
          ["num_four_wheelers", "Number of Four Wheelers"],
          ["irrigation_land", "Irrigation Land (acres)"],
          ["neighbor_name", "Neighbor Name"],
          ["favorite_teacher_name", "Favorite Teacher Name"],
        ].map(([name, label]) => (
          <div key={name} className="form-group">
            <label>{label}:</label>
            <input
              className="form-input"
              type="text"
              name={name}
              value={formData[name]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        {/* own_house - Radio Buttons */}
        <div className="form-group">
          <label>Own House (Y/N):</label>
          <div>
            <label>
              <input
                type="radio"
                name="own_house"
                value="Yes"
                checked={formData.own_house === "Yes"}
                onChange={handleChange}
                required
              />
              Yes
            </label>
            <label style={{ marginLeft: "1rem" }}>
              <input
                type="radio"
                name="own_house"
                value="No"
                checked={formData.own_house === "No"}
                onChange={handleChange}
              />
              No
            </label>
          </div>
        </div>

        {/* smart_phone_home - Radio Buttons */}
        <div className="form-group">
          <label>Smartphone at Home (Y/N):</label>
          <div>
            <label>
              <input
                type="radio"
                name="smart_phone_home"
                value="Yes"
                checked={formData.smart_phone_home === "Yes"}
                onChange={handleChange}
                required
              />
              Yes
            </label>
            <label style={{ marginLeft: "1rem" }}>
              <input
                type="radio"
                name="smart_phone_home"
                value="No"
                checked={formData.smart_phone_home === "No"}
                onChange={handleChange}
              />
              No
            </label>
          </div>
        </div>

        {/* internet_facility_home - Radio Buttons */}
        <div className="form-group">
          <label>Internet Facility at Home (Y/N):</label>
          <div>
            <label>
              <input
                type="radio"
                name="internet_facility_home"
                value="Yes"
                checked={formData.internet_facility_home === "Yes"}
                onChange={handleChange}
                required
              />
              Yes
            </label>
            <label style={{ marginLeft: "1rem" }}>
              <input
                type="radio"
                name="internet_facility_home"
                value="No"
                checked={formData.internet_facility_home === "No"}
                onChange={handleChange}
              />
              No
            </label>
          </div>
        </div>

        {/* subjects_of_interest - Dropdown */}
        <div className="form-group">
          <label>Subjects of Interest:</label>
          <select
            name="subjects_of_interest"
            value={formData.subjects_of_interest}
            onChange={handleChange}
            required
          >
            <option value="">Select Subject</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Maths">Maths</option>
            <option value="Biology">Biology</option>
            <option value="English">English</option>
          </select>
        </div>

        {/* Neighbor Phone - 10 digit restriction */}
        <div className="form-group">
          <label>Neighbor Phone:</label>
          <input
            type="text"
            name="neighbor_phone"
            placeholder="Enter 10-digit Phone No."
            value={formData.neighbor_phone}
            maxLength={10}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, neighbor_phone: value });
              }
            }}
            required
          />
        </div>

        {/* Favorite Teacher Phone - 10 digit restriction */}
        <div className="form-group">
          <label>Favorite Teacher Phone:</label>
          <input
            type="text"
            name="favorite_teacher_phone"
            placeholder="Enter 10-digit Phone No."
            value={formData.favorite_teacher_phone}
            maxLength={10}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,10}$/.test(value)) {
                setFormData({ ...formData, favorite_teacher_phone: value });
              }
            }}
            required
          />
        </div>

        <button type="submit" className="btn btn-success mt-3">
          Submit Application
        </button>
      </form>
    </div>
  );
};

export default NewApplication;
