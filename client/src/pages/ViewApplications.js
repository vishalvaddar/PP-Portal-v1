import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewApplications = () => {
    const [applications, setApplications] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [updatedData] = useState({});

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await axios.get("http://localhost:5000/applicants");
            setApplications(response.data);
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };

    const deleteApplication = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/applicants/delete/${id}`);
            setApplications(applications.filter(app => app.applicant_id !== id));
        } catch (error) {
            console.error("Error deleting application:", error);
        }
    };

    const updateApplication = async (id) => {
        try {
            await axios.put(`http://localhost:5000/applicants/update/${id}`, updatedData);
            alert("Application updated successfully");
            fetchApplications();
        } catch (error) {
            console.error("Error updating application:", error);
        }
    };

    return (
        <div>
            <h2>Applicant List</h2>
            <button onClick={() => setShowAll(!showAll)}>
                {showAll ? "Show Only 5" : "Show All"}
            </button>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>NMMS Year</th>
                        <th>Reg Number</th>
                        <th>State</th>
                        <th>District</th>
                        <th>Block</th>
                        <th>Student Name</th>
                        <th>Father Name</th>
                        <th>GMAT</th>
                        <th>SAT</th>
                        <th>Contact 1</th>
                        <th>Contact 2</th>
                        <th>Current Institute</th>
                        <th>Previous Institute</th>
                        <th>Medium</th>
                        <th>Home Address</th>
                        <th>Family Income</th>
                        <th>Mother Name</th>
                        <th>Gender</th>
                        <th>Aadhaar</th>
                        <th>DOB</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {(showAll ? applications : applications.slice(0, 5)).map((app) => (
                        <tr key={app.applicant_id}>
                            <td>{app.applicant_id}</td>
                            <td>{app.nmms_year}</td>
                            <td>{app.nmms_reg_number}</td>
                            <td>{app.app_state}</td>
                            <td>{app.nmms_district}</td>
                            <td>{app.nmms_block}</td>
                            <td>{app.student_name}</td>
                            <td>{app.father_name}</td>
                            <td>{app.gmat_score}</td>
                            <td>{app.sat_score}</td>
                            <td>{app.contact_no1}</td>
                            <td>{app.contact_no2}</td>
                            <td>{app.current_institute}</td>
                            <td>{app.previous_institute}</td>
                            <td>{app.medium}</td>
                            <td>{app.home_address}</td>
                            <td>{app.family_income}</td>
                            <td>{app.mother_name}</td>
                            <td>{app.gender}</td>
                            <td>{app.aadhaar}</td>
                            <td>{app.DOB}</td>
                            <td>
                                <button onClick={() => deleteApplication(app.applicant_id)}>Delete</button>
                                <button onClick={() => updateApplication(app.applicant_id)}>Update</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewApplications;
