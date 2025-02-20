import React, { useState } from 'react';
import axios from 'axios';
import './NewApplication.css';

const NewApplication = () => {
  const [formData, setFormData] = useState({
    nmms_reg_number: '',
    student_name: '',
    medium: '',
    parent_no: '',
    school_hm_no: '',
    school_name: '',
    school_type: '',
    district_name: '',
    block_name: '',
    gmat_score: '',
    sat_score: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/student', formData);
      setSubmitSuccess(true);

      // Clear form data after successful submission
      setFormData({
        nmms_reg_number: '',
        student_name: '',
        medium: '',
        parent_no: '',
        school_hm_no: '',
        school_name: '',
        school_type: '',
        district_name: '',
        block_name: '',
        gmat_score: '',
        sat_score: '',
      });
    } catch (error) {
      console.error('Error submitting the form:', error);
    }
  };

  return (
    <div className="container">
      <h2>New Application</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nmms_reg_number">NMMS Reg Number</label>
          <input
            type="text"
            id="nmms_reg_number"
            name="nmms_reg_number"
            value={formData.nmms_reg_number}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="student_name">Student Name</label>
          <input
            type="text"
            id="student_name"
            name="student_name"
            value={formData.student_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="medium">Medium</label>
          <select
            id="medium"
            name="medium"
            value={formData.medium}
            onChange={handleChange}
            required
          >
            <option value="">Select Medium</option>
            <option value="Kannada">Kannada</option>
            <option value="English">English</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="parent_no">Parent's Contact Number</label>
          <input
            type="text"
            id="parent_no"
            name="parent_no"
            value={formData.parent_no}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="school_hm_no">School HM Contact Number</label>
          <input
            type="text"
            id="school_hm_no"
            name="school_hm_no"
            value={formData.school_hm_no}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="school_name">School Name</label>
          <input
            type="text"
            id="school_name"
            name="school_name"
            value={formData.school_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="school_type">School Type</label>
          <select
            id="school_type"
            name="school_type"
            value={formData.school_type}
            onChange={handleChange}
            required
          >
            <option value="">Select School Type</option>
            <option value="GOVT">GOVT</option>
            <option value="PRIVATE">PRIVATE</option>
            <option value="AIDED">AIDED</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="district_name">District Name</label>
          <input
            type="text"
            id="district_name"
            name="district_name"
            value={formData.district_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="block_name">Block Name</label>
          <input
            type="text"
            id="block_name"
            name="block_name"
            value={formData.block_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="gmat_score">GMAT Score</label>
          <input
            type="number"
            id="gmat_score"
            name="gmat_score"
            value={formData.gmat_score}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sat_score">SAT Score</label>
          <input
            type="number"
            id="sat_score"
            name="sat_score"
            value={formData.sat_score}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-success">
          Submit Application
        </button>
      </form>

      {submitSuccess && (
        <div className="success-message">Application submitted successfully!</div>
      )}
    </div>
  );
};

export default NewApplication;
