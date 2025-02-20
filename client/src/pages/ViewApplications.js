// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './ViewApplications.css'; // Ensure CSS is correctly imported

// const ViewApplication = () => {
//   const [students, setStudents] = useState([]);
//   const [nmmsRegNumber, setNmmsRegNumber] = useState('');
//   const [studentName, setStudentName] = useState('');
//   const [medium, setMedium] = useState('');
//   const [parentNo, setParentNo] = useState('');
//   const [schoolHmNo, setSchoolHmNo] = useState('');
//   const [schoolName, setSchoolName] = useState('');
//   const [schoolType, setSchoolType] = useState('');
//   const [districtName, setDistrictName] = useState('');
//   const [blockName, setBlockName] = useState('');
//   const [gmatScore, setGmatScore] = useState('');
//   const [satScore, setSatScore] = useState('');
//   const [editMode, setEditMode] = useState(false);
//   const [currentId, setCurrentId] = useState(null);
//   const [error, setError] = useState('');

//   // Fetch students on component mount
//   useEffect(() => {
//     fetchStudents();
//   }, []);

//   const fetchStudents = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/student');
//       setStudents(response.data);
//     } catch (error) {
//       console.error('Error fetching students', error);
//       setError('Failed to fetch student data.');
//     }
//   };

//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     const studentData = {
//       nmms_reg_number: nmmsRegNumber,
//       student_name: studentName,
//       medium,
//       parent_no: parentNo,
//       school_hm_no: schoolHmNo,
//       school_name: schoolName,
//       school_type: schoolType,
//       district_name: districtName,
//       block_name: blockName,
//       gmat_score: gmatScore,
//       sat_score: satScore,
//     };

//     if (editMode) {
//       try {
//         await axios.put(`http://localhost:5000/student/${currentId}`, studentData);
//         setEditMode(false);
//         setCurrentId(null);
//         fetchStudents();
//       } catch (error) {
//         console.error('Error updating student', error);
//         setError('Failed to update student.');
//       }
//     }

//     // Clear input fields after update
//     setNmmsRegNumber('');
//     setStudentName('');
//     setMedium('');
//     setParentNo('');
//     setSchoolHmNo('');
//     setSchoolName('');
//     setSchoolType('');
//     setDistrictName('');
//     setBlockName('');
//     setGmatScore('');
//     setSatScore('');
//   };

//   const handleEdit = (student) => {
//     setNmmsRegNumber(student.nmms_reg_number);
//     setStudentName(student.student_name);
//     setMedium(student.medium);
//     setParentNo(student.parent_no);
//     setSchoolHmNo(student.school_hm_no);
//     setSchoolName(student.school_name);
//     setSchoolType(student.school_type);
//     setDistrictName(student.district_name);
//     setBlockName(student.block_name);
//     setGmatScore(student.gmat_score);
//     setSatScore(student.sat_score);
//     setEditMode(true);
//     setCurrentId(student.id);
//   };

//   const handleDelete = async (studentId) => {
//     try {
//       await axios.delete(`http://localhost:5000/student/${studentId}`);
//       fetchStudents();
//     } catch (error) {
//       console.error('Error deleting student', error);
//       setError('Failed to delete student.');
//     }
//   };

//   return (
//     <div className="view-applications-container">
//       <h1>Student Details</h1>

//       {error && <div className="error-message">{error}</div>}

//       {editMode && (
//         <form onSubmit={handleUpdate} className="edit-form">
//           <input type="text" placeholder="NMMS Reg Number" value={nmmsRegNumber} onChange={(e) => setNmmsRegNumber(e.target.value)} />
//           <input type="text" placeholder="Student Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
//           <input type="text" placeholder="Medium" value={medium} onChange={(e) => setMedium(e.target.value)} />
//           <input type="text" placeholder="Parent No" value={parentNo} onChange={(e) => setParentNo(e.target.value)} />
//           <input type="text" placeholder="School HM No" value={schoolHmNo} onChange={(e) => setSchoolHmNo(e.target.value)} />
//           <input type="text" placeholder="School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
//           <input type="text" placeholder="School Type" value={schoolType} onChange={(e) => setSchoolType(e.target.value)} />
//           <input type="text" placeholder="District Name" value={districtName} onChange={(e) => setDistrictName(e.target.value)} />
//           <input type="text" placeholder="Block Name" value={blockName} onChange={(e) => setBlockName(e.target.value)} />
//           <input type="number" placeholder="GMAT Score" value={gmatScore} onChange={(e) => setGmatScore(e.target.value)} />
//           <input type="number" placeholder="SAT Score" value={satScore} onChange={(e) => setSatScore(e.target.value)} />
//           <button type="submit">Update Student</button>
//         </form>
//       )}

//       <table className="applications-table">
//         <thead>
//           <tr>
//             <th>NMMS Reg Number</th>
//             <th>Student Name</th>
//             <th>Medium</th>
//             <th>Parent No</th>
//             <th>School HM No</th>
//             <th>School Name</th>
//             <th>School Type</th>
//             <th>District Name</th>
//             <th>Block Name</th>
//             <th>GMAT Score</th>
//             <th>SAT Score</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {students.map((student) => (
//             <tr key={student.id}>
//               <td>{student.nmms_reg_number}</td>
//               <td>{student.student_name}</td>
//               <td>{student.medium}</td>
//               <td>{student.parent_no}</td>
//               <td>{student.school_hm_no}</td>
//               <td>{student.school_name}</td>
//               <td>{student.school_type}</td>
//               <td>{student.district_name}</td>
//               <td>{student.block_name}</td>
//               <td>{student.gmat_score}</td>
//               <td>{student.sat_score}</td>
//               <td>
//                 <button className="edit-btn" onClick={() => handleEdit(student)}>Edit</button>
//                 <button className="delete-btn" onClick={() => handleDelete(student.id)}>Delete</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ViewApplication;


import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ViewApplications.css"; // Ensure CSS is correctly imported

const ViewApplication = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/student");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students", error);
      setError("Failed to fetch student data.");
    }
  };

  const handleDelete = async (studentId) => {
    try {
      await axios.delete(`http://localhost:5000/student/${studentId}`);
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student", error);
      setError("Failed to delete student.");
    }
  };

  return (
    <div className="view-applications-container">
      <h1>Student Details</h1>

      {error && <div className="error-message">{error}</div>}

      <table className="applications-table">
        <thead>
          <tr>
            <th>NMMS Reg Number</th>
            <th>Student Name</th>
            <th>Medium</th>
            <th>Parent No</th>
            <th>School HM No</th>
            <th>School Name</th>
            <th>School Type</th>
            <th>District Name</th>
            <th>Block Name</th>
            <th>GMAT Score</th>
            <th>SAT Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.nmms_reg_number}</td>
              <td>{student.student_name}</td>
              <td>{student.medium}</td>
              <td>{student.parent_no}</td>
              <td>{student.school_hm_no}</td>
              <td>{student.school_name}</td>
              <td>{student.school_type}</td>
              <td>{student.district_name}</td>
              <td>{student.block_name}</td>
              <td>{student.gmat_score}</td>
              <td>{student.sat_score}</td>
              <td>
                <button className="edit-btn" onClick={() => navigate(`/view-applications/${student.id}`)}>
                  Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(student.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewApplication;
