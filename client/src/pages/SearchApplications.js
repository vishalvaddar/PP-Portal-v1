import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import classes from "./SearchApplications.module.css";

const SearchApplication = () => {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const startYear = 2022;
  const yearOptions = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  const mediumOptions = ["ENGLISH", "KANNADA"];

  const [filters, setFilters] = useState({
    nmms_year: "",
    nmms_reg_number: "",
    student_name: "",
    medium: "",
    district: "",
    current_institute_dise_code: "",
  });

  const [districts, setDistricts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [noResults, setNoResults] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  const handleSchoolChange = (e) => {
    setSchoolSearch(e.target.value);
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const districtRes = await axios.get("http://localhost:5000/districts/all");
        setDistricts(districtRes.data);
      } catch (error) {
        console.error("Error loading dropdowns:", error);
        setErrorMessage("Failed to load districts.");
      }
    };
    fetchDropdownData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: name === "student_name" ? value.toUpperCase().trim() : value.trim(),
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setNoResults(false);

    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      if (schoolSearch.trim()) {
        activeFilters.institute_name = schoolSearch.trim();
      }

      const response = await axios.get("http://localhost:5000/api/search", {
        params: activeFilters,
      });

      if (Array.isArray(response.data) && response.data.length === 0) {
        setNoResults(true);
      } else {
        navigate("/view-applications", { state: { results: response.data } });
      }
    } catch (error) {
      console.error("Error searching applications:", error);
      setErrorMessage(error.response?.data?.error || "Application not found.");
    }
  };

  const isSearchLocked = filters.nmms_reg_number.trim() !== "" || schoolSearch.trim() !== "";

  return (
    <div className={classes.container}>
      <h1 className={classes.heading}>Search Applications</h1>
      {errorMessage && <div className={classes.error}>{errorMessage}</div>}

      <form onSubmit={handleSearch} className={classes.formWrapper}>
        <div className={classes.formGroup}>
          <label className={classes.label}>NMMS Year</label>
          <select
            name="nmms_year"
            value={filters.nmms_year}
            onChange={handleChange}
            className={classes.select}
            disabled={isSearchLocked}
          >
            <option value="">Select Year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>NMMS Reg Number</label>
          <input
            type="text"
            name="nmms_reg_number"
            value={filters.nmms_reg_number}
            onChange={handleChange}
            className={classes.input}
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Student Name</label>
          <input
            type="text"
            name="student_name"
            value={filters.student_name}
            onChange={handleChange}
            className={classes.input}
            disabled={isSearchLocked}
          />
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>Medium</label>
          <select
            name="medium"
            value={filters.medium}
            onChange={handleChange}
            className={classes.select}
            disabled={isSearchLocked}
          >
            <option value="">Select Medium</option>
            {mediumOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>District</label>
          <select
            name="district"
            value={filters.district}
            onChange={handleChange}
            className={classes.select}
            disabled={isSearchLocked}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.district_id} value={d.district_id}>
                {d.district}
              </option>
            ))}
          </select>
        </div>

        <div className={classes.formGroup}>
          <label className={classes.label}>School Name</label>
          <input
            type="text"
            name="school_search"
            value={schoolSearch}
            onChange={handleSchoolChange}
            className={classes.input}
            placeholder="Enter full or partial school name..."
            autoComplete="off"
          />
        </div>

        <button type="submit" className={classes.button}>
          Search
        </button>
      </form>

      {noResults && (
        <div className={classes.warning}>
          No applications found
          {schoolSearch ? ` for school name "${schoolSearch}"` : "."}
        </div>
      )}
    </div>
  );
};

export default SearchApplication;
