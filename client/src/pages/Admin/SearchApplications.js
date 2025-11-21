import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import { FileSearch, Search, RotateCcw, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useFetchStates,
  useFetchEducationDistricts, // 👈 Updated hook auto-fetches districts using divisions internally
  useFetchBlocks,
} from "../../hooks/useJurisData";
import classes from "./SearchApplications.module.css";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";

const SearchApplications = () => {
  const currentPath = ["Admin", "Admissions", "Applications", "Search Application"];
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");

  const currentYear = new Date().getFullYear();
  const startYear = 2022;

  // Academic Year Options
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => ({
      value: startYear + i,
      label: `${startYear + i} - ${startYear + i + 1}`,
    })
  );

  // Medium Options
  const mediumOptions = [
    { value: "ENGLISH", label: "English" },
    { value: "KANNADA", label: "Kannada" },
    { value: "URDU", label: "Urdu" },
    { value: "MARATHI", label: "Marathi" },
  ];

  // --- Form Data ---
  const initialFormData = {
    nmms_year: currentYear,
    app_state: "",
    district: "",
    nmms_block: "",
    medium: "",
    student_name: "",
    nmms_reg_number: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [errors, setErrors] = useState({});

  // --- Fetch Data ---
  useFetchStates(setStates);
  useFetchEducationDistricts(formData.app_state, setDistricts); // 👈 Uses hidden division internally
  useFetchBlocks(formData.district, setBlocks);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (selectedOption, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : "",
    }));

    // Reset dependent fields
    if (name === "app_state") {
      setFormData((prev) => ({ ...prev, district: "", nmms_block: "" }));
      setDistricts([]);
      setBlocks([]);
    } else if (name === "district") {
      setFormData((prev) => ({ ...prev, nmms_block: "" }));
      setBlocks([]);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setDistricts([]);
    setBlocks([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (formData.nmms_reg_number && formData.nmms_reg_number.trim().length !== 11) {
      newErrors.nmms_reg_number = "Registration number must be 11 digits";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const filteredFormData = Object.fromEntries(
      Object.entries(formData).filter(([, v]) => v)
    );

    const searchParams = { ...filteredFormData, limit: 10, offset: 0 };

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/search`,
        { params: searchParams }
      );

      if (!response.data?.data?.length) {
        setToastMessage("No applications found matching your criteria.");
        setTimeout(() => setToastMessage(""), 3000);
        return;
      }

      navigate(`/admin/admissions/view-applications`, {
        state: {
          initialApplications: response.data.data,
          paginationInfo: response.data.pagination,
          searchFilters: filteredFormData,
        },
      });
    } catch (error) {
      const message =
        error.response?.status === 404
          ? "No applications found matching your criteria."
          : "An error occurred while searching. Please try again.";
      setToastMessage(message);
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  // --- Memoized Options ---
  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.id, label: s.name })),
    [states]
  );
  const districtOptions = useMemo(
    () => districts.map((d) => ({ value: d.id, label: d.name })),
    [districts]
  );
  const blockOptions = useMemo(
    () => blocks.map((b) => ({ value: b.id, label: b.name })),
    [blocks]
  );

  const isAdvancedSearchDisabled = !!formData.nmms_reg_number;

  return (
    <div className={classes.pageContainer}>
      <Breadcrumbs path={currentPath} nonLinkSegments={["Admin", "Admissions"]} />

      {toastMessage && (
        <div className={`${classes.toast} ${classes.toastVisible}`}>
          {toastMessage}
        </div>
      )}

      <div className={classes.searchGrid}>
        {/* --- Left Column: Search Form --- */}
        <div className={classes.searchCard}>
          <div className={classes.cardHeader}>
            <FileSearch size={28} />
            <h1>Search Applications</h1>
          </div>

          <form onSubmit={handleSubmit} className={classes.form}>
            {/* --- NMMS Reg Number --- */}
            <div className={classes.formSection}>
              <label htmlFor="nmms_reg_number" className={classes.label}>
                Search by NMMS Registration Number
              </label>
              <div className={classes.inputGroup}>
                <Search className={classes.inputIcon} size={18} />
                <input
                  type="text"
                  id="nmms_reg_number"
                  name="nmms_reg_number"
                  placeholder="Enter 11-digit number..."
                  value={formData.nmms_reg_number}
                  onChange={handleChange}
                  maxLength="11"
                  autoComplete="off"
                  className={classes.input}
                />
              </div>
              {errors.nmms_reg_number && (
                <p className={classes.errorText}>{errors.nmms_reg_number}</p>
              )}
            </div>

            <div className={classes.divider}>
              <span>OR</span>
            </div>

            {/* --- Advanced Filters --- */}
            <fieldset disabled={isAdvancedSearchDisabled} className={classes.fieldset}>
              <div className={classes.filterGrid}>
                {/* Student Name */}
                <div className={classes.field}>
                  <label htmlFor="student_name" className={classes.label}>
                    Student Name
                  </label>
                  <input
                    type="text"
                    id="student_name"
                    name="student_name"
                    placeholder="e.g. Anil Kumar"
                    value={formData.student_name}
                    onChange={handleChange}
                    className={classes.input}
                  />
                </div>

                {/* Academic Year */}
                <div className={classes.field}>
                  <label htmlFor="nmms_year" className={classes.label}>
                    Academic Year
                  </label>
                  <Select
                    id="nmms_year"
                    options={yearOptions}
                    value={yearOptions.find((o) => o.value === formData.nmms_year)}
                    onChange={(s) => handleSelectChange(s, "nmms_year")}
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Medium */}
                <div className={classes.field}>
                  <label htmlFor="medium" className={classes.label}>
                    Medium
                  </label>
                  <Select
                    id="medium"
                    options={mediumOptions}
                    value={mediumOptions.find((o) => o.value === formData.medium)}
                    onChange={(s) => handleSelectChange(s, "medium")}
                    placeholder="Any Medium"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                {/* State */}
                <div className={classes.field}>
                  <label htmlFor="app_state" className={classes.label}>
                    State
                  </label>
                  <Select
                    id="app_state"
                    options={stateOptions}
                    value={stateOptions.find((o) => o.value === formData.app_state)}
                    onChange={(s) => handleSelectChange(s, "app_state")}
                    placeholder="Any State"
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                {/* District (auto-loaded using hidden division logic) */}
                <div className={classes.field}>
                  <label htmlFor="district" className={classes.label}>
                    District
                  </label>
                  <Select
                    id="district"
                    options={districtOptions}
                    value={districtOptions.find((o) => o.value === formData.district)}
                    onChange={(s) => handleSelectChange(s, "district")}
                    placeholder="Any District"
                    isDisabled={!formData.app_state}
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>

                {/* Block */}
                <div className={classes.field}>
                  <label htmlFor="nmms_block" className={classes.label}>
                    Block
                  </label>
                  <Select
                    id="nmms_block"
                    options={blockOptions}
                    value={blockOptions.find((o) => o.value === formData.nmms_block)}
                    onChange={(s) => handleSelectChange(s, "nmms_block")}
                    placeholder="Any Block"
                    isDisabled={!formData.district}
                    classNamePrefix="react-select"
                    isClearable
                  />
                </div>
              </div>
            </fieldset>

            <div className={classes.formActions}>
              <button
                type="button"
                onClick={handleReset}
                className={`${classes.btn} ${classes.btnSecondary}`}
              >
                <RotateCcw size={16} /> Reset
              </button>
              <button type="submit" className={`${classes.btn} ${classes.btnPrimary}`}>
                <Search size={18} /> Search Applications
              </button>
            </div>
          </form>
        </div>

        {/* --- Info Panel --- */}
        <div className={classes.infoPanel}>
          <div className={classes.infoIconContainer}>
            <Info size={24} className={classes.infoIcon} />
          </div>
          <h2>How to Search</h2>
          <p>Use the filters on the left to find student applications.</p>
          <ul>
            <li>
              <strong>Quick Search:</strong> Enter the full 11-digit NMMS Registration Number for instant results.
            </li>
            <li>
              <strong>Advanced Filters:</strong> Combine fields like student name, academic year, and location.
            </li>
            <li>
              <strong>Reset:</strong> Click the “Reset” button to clear all filters and start fresh.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchApplications;
