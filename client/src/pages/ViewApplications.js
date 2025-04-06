import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom"; // Import useLocation
import "./ViewApplications.css";

const ViewApplications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [updatedData, setUpdatedData] = useState({});

  useEffect(() => {
    if (location.state?.results) {
      setApplications(location.state.results); // Use search results
    } else {
      fetchApplications(); // Fetch all if no search results
    }
  }, [location.state]); // Re-run when new search results arrive

  const fetchApplications = async () => {
    try {
      const response = await axios.get("http://localhost:5000/applicants");
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit-form/${id}`);
  };

  return (
    <div className="container">
      <header className="header">All Applications</header>

      <button className="toggle-btn" onClick={() => setShowAll(!showAll)}>
        {showAll ? "Show Only 5" : "Show All"}
      </button>

      <table className="application-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>NMMS Year</th>
            <th>Reg Number</th>
            <th>Student Name</th>

            <th>Aadhaar</th>

            <th>Contact No 1</th>
            <th>Contact No 2</th>
            <th>District</th>
            <th>Current School Dice Code</th>

            <th>Medium</th>
            <th>GMAT Score</th>
            <th>SAT Score</th>
          </tr>
        </thead>
        <tbody>
          {(showAll ? applications : applications.slice(0, 5)).map((app) => (
            <tr key={app.applicant_id}>
              <td>{app.applicant_id}</td>
              <td>{app.nmms_year || "N/A"}</td>
              <td
                style={{
                  color: "blue",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/edit-form/${app.nmms_reg_number}`)}
              >
                {app.nmms_reg_number || "N/A"}
              </td>
              <td>{app.student_name || "N/A"}</td>

              <td>{app.aadhaar || "N/A"}</td>

              <td>{app.contact_no1 || "N/A"}</td>
              <td>{app.contact_no2 || "N/A"}</td>

              <td>{app.district || "N/A"}</td>

              <td>{app.current_institute_dise_code || "N/A"}</td>

              <td>{app.medium || "N/A"}</td>
              <td>{app.gmat_score || "N/A"}</td>
              <td>{app.sat_score || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewApplications;
