import React, { useEffect, useState } from "react";
import axios from "axios";

const ViewApplications = () => {
    const [applications, setApplications] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [updatedData, setUpdatedData] = useState({});

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

    const handleEditClick = (app) => {
        setEditingId(app.applicant_id);
        setUpdatedData({ ...app });
    };

    const handleChange = (e, field) => {
        setUpdatedData({ ...updatedData, [field]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            console.log("Updating:", editingId, updatedData);
            await axios.put(`http://localhost:5000/applicants/update/${editingId}`, updatedData);
            setEditingId(null);
            fetchApplications(); // Refresh data after update
        } catch (error) {
            console.error("Error updating application:", error);
        }
    };
    

    const [formData, setFormData] = useState({
        student_name: "",
        father_name: "",
        contact_no1: "",
        contact_no2: "",
        current_institute: "",
        nmms_year:"",
         nmms_reg_number:"",
         app_state:"",
         nmms_district:"",
          nmms_block:"",
                gmat_score:"", 
                sat_score:"",
                 previous_institute:"",
                  medium:"",
                home_address:"",
                 family_income:"",
                  mother_name:"",
                   gender:"",
                   aadhaar:"",
                    DOB:""
    });
    

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
                            {editingId === app.applicant_id ? (
                                <>
                                    <td><input value={updatedData.nmms_year} onChange={(e) => handleChange(e, "nmms_year")} /></td>
                                    <td><input value={updatedData.nmms_reg_number} onChange={(e) => handleChange(e, "nmms_reg_number")} /></td>
                                    <td><input value={updatedData.app_state} onChange={(e) => handleChange(e, "app_state")} /></td>
                                    <td><input value={updatedData.nmms_district} onChange={(e) => handleChange(e, "nmms_district")} /></td>
                                    <td><input value={updatedData.nmms_block} onChange={(e) => handleChange(e, "nmms_block")} /></td>
                                    <td><input value={updatedData.student_name} onChange={(e) => handleChange(e, "student_name")} /></td>
                                    <td><input value={updatedData.father_name} onChange={(e) => handleChange(e, "father_name")} /></td>
                                    <td><input value={updatedData.gmat_score} onChange={(e) => handleChange(e, "gmat_score")} /></td>
                                    <td><input value={updatedData.sat_score} onChange={(e) => handleChange(e, "sat_score")} /></td>
                                    <td><input value={updatedData.contact_no1} onChange={(e) => handleChange(e, "contact_no1")} /></td>
                                    <td><input value={updatedData.contact_no2} onChange={(e) => handleChange(e, "contact_no2")} /></td>
                                    <td><input value={updatedData.current_institute} onChange={(e) => handleChange(e, "current_institute")} /></td>
                                    <td><input value={updatedData.previous_institute} onChange={(e) => handleChange(e, "previous_institute")} /></td>
                                    <td><input value={updatedData.medium} onChange={(e) => handleChange(e, "medium")} /></td>
                                    <td><input value={updatedData.home_address} onChange={(e) => handleChange(e, "home_address")} /></td>
                                    <td><input value={updatedData.family_income} onChange={(e) => handleChange(e, "family_income")} /></td>
                                    <td><input value={updatedData.mother_name} onChange={(e) => handleChange(e, "mother_name")} /></td>
                                    <td><input value={updatedData.gender} onChange={(e) => handleChange(e, "gender")} /></td>
                                    <td><input value={updatedData.aadhaar} onChange={(e) => handleChange(e, "aadhaar")} /></td>
                                    <td><input value={updatedData.DOB} onChange={(e) => handleChange(e, "DOB")} /></td>
                                    <td>
                                        <button onClick={handleUpdate}>Save</button>
                                        <button onClick={() => setEditingId(null)}>Cancel</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    {Object.values(app).slice(1).map((val, index) => <td key={index}>{val}</td>)}
                                    <td>
                                        <button onClick={() => handleEditClick(app)}>Edit</button>
                                        <button onClick={() => deleteApplication(app.applicant_id)}>Delete</button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ViewApplications;
