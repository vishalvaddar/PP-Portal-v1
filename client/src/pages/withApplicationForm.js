import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./NewApplication.css";

const WithApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get student ID from URL
  const [formData, setFormData] = useState({
    nmms_reg_number: "",
    student_name: "",
    medium: "",
    parent_no: "",
    school_hm_no: "",
    school_name: "",
    school_type: "",
    district_name: "",
    block_name: "",
    gmat_score: "",
    sat_score: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchStudentDetails(id);
    }
  }, [id]);

  const fetchStudentDetails = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:5000/student/${studentId}`);
      if (response.status === 200) {
        setFormData(response.data);
        setLoading(false);
      } else {
        throw new Error("Failed to fetch student details");
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      setError("❌ Error fetching student details.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/student/${id}`, formData);
      navigate("/view-applications"); // Redirect back after update
    } catch (error) {
      console.error("Error updating application:", error);
      setError("❌ Failed to update student details.");
    }
  };

  if (loading) {
    return <p>⏳ Loading student details...</p>;
  }

  return (
    <div className="container">
      <h2>Edit Application</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>NMMS Reg Number</label>
          <input type="text" name="nmms_reg_number" value={formData.nmms_reg_number} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Student Name</label>
          <input type="text" name="student_name" value={formData.student_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Medium</label>
          <input type="text" name="medium" value={formData.medium} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Parent No</label>
          <input type="text" name="parent_no" value={formData.parent_no} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>School HM No</label>
          <input type="text" name="school_hm_no" value={formData.school_hm_no} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>School Name</label>
          <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>School Type</label>
          <input type="text" name="school_type" value={formData.school_type} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>District Name</label>
          <input type="text" name="district_name" value={formData.district_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Block Name</label>
          <input type="text" name="block_name" value={formData.block_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>GMAT Score</label>
          <input type="number" name="gmat_score" value={formData.gmat_score} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>SAT Score</label>
          <input type="number" name="sat_score" value={formData.sat_score} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">Update Application</button>
      </form>
    </div>
  );
};

export default WithApplication;
