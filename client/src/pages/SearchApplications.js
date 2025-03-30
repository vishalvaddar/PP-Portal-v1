import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SearchApplications.css";

const SearchApplication = () => {
  const navigate = useNavigate();

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
  const mediumOptions = ["ENGLISH", "KANNADA"];


  // Fetch districts from the database
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get("http://localhost:5000/districts/all");
        setDistricts(response.data);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setErrorMessage("Failed to load districts.");
      }
    };
    fetchDistricts();
  }, []);

  // Update filter values (trim input values)
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]:
        name === "student_name" ? value.toUpperCase().trim() : value.trim(),
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

      const response = await axios.get("http://localhost:5000/api/search", {
        params: activeFilters,
      });

      if (response.data.length === 0) {
        setNoResults(true);
        return;
      }

      navigate("/view-applications", { state: { results: response.data } });
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response) {
        const { status, data } = error.response;
        setErrorMessage(
          status === 404
            ? "No applications found."
            : `Error ${status}: ${data.error || "Unknown error."}`
        );
      } else {
        setErrorMessage("Server is unreachable. Please try again.");
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Search Applications</h1>

      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
          {errorMessage}
        </div>
      )}
      {noResults && (
        <div className="bg-yellow-100 text-yellow-700 p-2 rounded mb-4">
          No applications found.
        </div>
      )}

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-2 gap-4 bg-white p-4 shadow rounded"
      >
        {Object.keys(filters).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-semibold">
              {key.replace(/_/g, " ").toUpperCase()}
            </label>
            {key === "medium" ? (
              <select
                name="medium"
                value={filters.medium}
                onChange={handleChange}
                className="p-2 border rounded mt-1"
              >
                <option value="">Select Medium</option>
                {mediumOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : key === "district" ? (
              <select
                name="district"
                value={filters.district}
                onChange={handleChange}
                className="p-2 border rounded mt-1"
              >
                <option value="">Select District</option>
                {districts.map((d, index) => (
                  <option key={index} value={d.district.trim()}>
                    {d.district.trim()}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name={key}
                value={filters[key]}
                onChange={handleChange}
                className="p-2 border rounded mt-1"
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="col-span-2 p-2 bg-blue-500 text-white rounded mt-2"
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchApplication;
