import React, { useState } from "react";
import axios from "axios";
import classes from "./Students.module.css"; // You can create this for styling

const Students = () => {
  const [formData, setFormData] = useState({
    name: "",
    cohort: "",
    batch_name: "",
    school_name: ""
  });

  const [errors, setErrors] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Simple validation
    if (formData.name.length > 50) {
      newErrors.name = "Name too long";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:5000/api/students/search", {
        params: formData
      });

      setSearchResults(response.data || []);
    } catch (err) {
      console.error("Search error:", err);
      alert("Error occurred while searching students.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.pageWrapper}>
      <h2 className={classes.title}>Search Students</h2>

      <form className={classes.form} onSubmit={handleSearch}>
        <div className={classes.formRow}>
          <div className={classes.formGroup}>
            <label htmlFor="name">Student Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter student name"
              maxLength={50}
            />
            {errors.name && <span className={classes.error}>{errors.name}</span>}
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="cohort">Year/Cohort</label>
            <input
              type="text"
              name="cohort"
              value={formData.cohort}
              onChange={handleChange}
              placeholder="e.g. 2023"
            />
          </div>
        </div>

        <div className={classes.formRow}>
          <div className={classes.formGroup}>
            <label htmlFor="batch_name">Batch Name</label>
            <input
              type="text"
              name="batch_name"
              value={formData.batch_name}
              onChange={handleChange}
              placeholder="e.g. Batch A"
            />
          </div>

          <div className={classes.formGroup}>
            <label htmlFor="school_name">School Name</label>
            <input
              type="text"
              name="school_name"
              value={formData.school_name}
              onChange={handleChange}
              placeholder="e.g. Greenwood High"
            />
          </div>
        </div>

        <button type="submit" className={classes.submitButton}>
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className={classes.results}>
          <h3>Search Results</h3>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>Enroll ID</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Cohort</th>
                <th>School Name</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((student, index) => (
                <tr key={index}>
                  <td>{student.enroll_id}</td>
                  <td>{student.name}</td>
                  <td>{student.batch}</td>
                  <td>{student.cohort}</td>
                  <td>{student.school_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {searchResults.length === 0 && !isLoading && (
        <p style={{ marginTop: "2rem", textAlign: "center", color: "gray" }}>
          No students found. Adjust filters and try again.
        </p>
      )}
    </div>
  );
};

export default Students;
