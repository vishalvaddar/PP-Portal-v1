import { useState } from "react";
import axios from "axios";

const NewApplication = () => {
    const [formData, setFormData] = useState({
        nmms_year: "",
        nmms_reg_number: "",
        app_state: "",
        nmms_district: "",
        nmms_block: "",
        student_name: "",
        father_name: "",
        gmat_score: "",
        sat_score: "",
        contact_no1: "",
        contact_no2: "",
        current_institute: "",
        previous_institute: "",
        medium: "",
        home_address: "",
        family_income: "",
        mother_name: "",
        gender: "",
        aadhaar: "",
        DOB: ""
    });

    const [page, setPage] = useState(1);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/applicants/create", formData);
            if (response.status === 200) {
                alert("Application submitted successfully!");
                setFormData({
                    nmms_year: "",
                    nmms_reg_number: "",
                    app_state: "",
                    nmms_district: "",
                    nmms_block: "",
                    student_name: "",
                    father_name: "",
                    gmat_score: "",
                    sat_score: "",
                    contact_no1: "",
                    contact_no2: "",
                    current_institute: "",
                    previous_institute: "",
                    medium: "",
                    home_address: "",
                    family_income: "",
                    mother_name: "",
                    gender: "",
                    aadhaar: "",
                    DOB: ""
                });
                setPage(1);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to submit application.");
        }
    };

    return (
        <div>
            <h2>New Application</h2>
            <form onSubmit={handleSubmit}>
                {page === 1 && (
                    <>
                        <div>
                            <label>NMMS Year: </label>
                            <input type="text" name="nmms_year" value={formData.nmms_year} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>NMMS Reg Number: </label>
                            <input type="text" name="nmms_reg_number" value={formData.nmms_reg_number} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>App State: </label>
                            <input type="text" name="app_state" value={formData.app_state} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>NMMS District: </label>
                            <input type="text" name="nmms_district" value={formData.nmms_district} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>NMMS Block: </label>
                            <input type="text" name="nmms_block" value={formData.nmms_block} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Student Name: </label>
                            <input type="text" name="student_name" value={formData.student_name} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Father Name: </label>
                            <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>GMAT Score: </label>
                            <input type="text" name="gmat_score" value={formData.gmat_score} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>SAT Score: </label>
                            <input type="text" name="sat_score" value={formData.sat_score} onChange={handleChange} required />
                        </div>
                        <button type="button" onClick={() => setPage(2)}>Next</button>
                    </>
                )}

                {page === 2 && (
                    <>
                        <div>
                            <label>Contact No1: </label>
                            <input type="text" name="contact_no1" value={formData.contact_no1} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Contact No2: </label>
                            <input type="text" name="contact_no2" value={formData.contact_no2} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Current Institute: </label>
                            <input type="text" name="current_institute" value={formData.current_institute} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Previous Institute: </label>
                            <input type="text" name="previous_institute" value={formData.previous_institute} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Medium: </label>
                            <input type="text" name="medium" value={formData.medium} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Home Address: </label>
                            <input type="text" name="home_address" value={formData.home_address} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Family Income: </label>
                            <input type="text" name="family_income" value={formData.family_income} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Mother Name: </label>
                            <input type="text" name="mother_name" value={formData.mother_name} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Gender: </label>
                            <input type="text" name="gender" value={formData.gender} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Aadhaar: </label>
                            <input type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Date of Birth: </label>
                            <input type="date" name="DOB" value={formData.DOB} onChange={handleChange} required />
                        </div>
                        <button type="button" onClick={() => setPage(1)}>Back</button>
                        <button type="submit">Submit</button>
                    </>
                )}
            </form>
        </div>
    );
};

export default NewApplication;