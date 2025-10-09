import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BatchManagement.css';
import { Search, Download, Eye, Edit, Archive, X } from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const batches = ['Batch-01', 'Batch-02', 'Batch-03','Batch-04','Batch-05','Batch-06'];
  const cohorts = ['Cohort-01', 'Cohort-02', 'Cohort-03', 'Cohort-04'];

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/coordinator/students`);
        setStudents(response.data);
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = [...students];
    if (searchQuery.trim()) {
      filtered = filtered.filter(s =>
        (s.student_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (s.enr_id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCohort !== 'all') {
      filtered = filtered.filter(s => s.cohort_name === selectedCohort);
    }
    if (selectedBatch !== 'all') {
      filtered = filtered.filter(s => s.batch_name === selectedBatch);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.active_yn?.toLowerCase() === statusFilter);
    }
    setFilteredStudents(filtered);
  }, [students, searchQuery, selectedCohort, selectedBatch, statusFilter]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/api/students/${editStudent.student_id}`, editForm);
      const updated = students.map(s =>
        s.student_id === editStudent.student_id ? { ...s, ...editForm } : s
      );
      setStudents(updated);
      setEditStudent(null);
    } catch (err) {
      console.error('Error saving student:', err);
    }
  };

  return (
    <div className="container">

      {/* Header (removed Add Student button) */}
      <div className="page-header">
        <div>
          <h1 className="title">Student Management</h1>
          <p className="subtitle">Manage your batch students and track their progress</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="filter-bar">
        <div className="filter-item search-box">
          <Search className="input-icon" />
          <input
            type="text"
            placeholder="Search by name or enrollment ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Cohort Filter */}
        <div className="filter-item">
          <select value={selectedCohort} onChange={(e) => setSelectedCohort(e.target.value)}>
            <option value="all">All Cohorts</option>
            {cohorts.map(cohort => (
              <option key={cohort} value={cohort}>{cohort}</option>
            ))}
          </select>
        </div>

        {/* Batch Filter */}
        <div className="filter-item">
          <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="all">All Batches</option>
            {batches.map(batch => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-item">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button className="export-button">
          <Download className="icon" />
          <span>Export</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Cohort</th>
              <th>Batch</th>
              <th>Contact</th>
              <th>Attendance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.student_id}>
                <td>
                  <div className="student-info">
                    <div className="name">{student.student_name}</div>
                    <div className="id">{student.enr_id}</div>
                  </div>
                </td>
                <td><span className="badge">{student.cohort_name || 'N/A'}</span></td>
                <td><span className="badge">{student.batch_name || 'N/A'}</span></td>
                <td>
                  <div>{student.contact_no1 || '-'}</div>
                  <div className="sub-info">Parent: {student.contact_no2 || '-'}</div>
                </td>
                <td>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-bar ${student.attendance >= 90 ? 'green' : student.attendance >= 75 ? 'yellow' : 'red'}`}
                      style={{ width: `${student.attendance}%` }}
                    ></div>
                  </div>
                  <span className="percent">{student.attendance}%</span>
                </td>
                <td>
                  <span className={`status ${student.active_yn?.toLowerCase() || 'unknown'}`}>
                    {student.active_yn}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => setViewStudent(student)}><Eye className="icon" /></button>
                    <button onClick={() => {
                      setEditStudent(student);
                      setEditForm({
                        student_name: student.student_name,
                        contact_no1: student.contact_no1,
                        contact_no2: student.contact_no2,
                        father_name: student.father_name,
                        mother_name: student.mother_name,
                        gender: student.gender,
                        sim_name: student.sim_name,
                        student_email: student.student_email,
                        parent_email: student.parent_email,
                        photo_link: student.photo_link,
                        home_address: student.home_address,
                      });
                    }}><Edit className="icon" /></button>
                    <button><Archive className="icon" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewStudent && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setViewStudent(null)}><X size={18} /></button>
            <h3>Student Details</h3>
            <pre>{JSON.stringify(viewStudent, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editStudent && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setEditStudent(null)}><X size={18} /></button>
            <h3>Edit Student</h3>
            <div className="edit-form">
              {Object.entries(editForm).map(([key, value]) => (
                <div key={key} className="form-group">
                  <label>{key.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    name={key}
                    value={value || ''}
                    onChange={handleEditChange}
                  />
                </div>
              ))}
              <button className="save-btn" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
