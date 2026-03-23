import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaCopy, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./ConfigurationDraftFileList.module.css";

export default function ConfigurationDraftFileList() {
  const [configurationDraftFileDtls, setConfigurationDraftFileDtls] = useState([]);
  const navigate = useNavigate();

  const BASE = `${process.env.REACT_APP_BACKEND_API_URL}/api/timetable`;

  useEffect(() => {
    fetchConfigurationDraftFileDtls();
  }, []);

  const fetchConfigurationDraftFileDtls = async () => {
    try {
      const res = await axios.get(`${BASE}/timeTable/getAllConfigurationDraftFileDtls`);
      setConfigurationDraftFileDtls(res.data);
    } catch (err) {
      console.error("Error fetching list", err);
    }
  };

// ConfigurationDraftFileList.js


const handleCreate = () => {
  // Use the full nested path so the sidebar stays visible
  navigate("/admin/academics/time-table-dashboard/configure");
};

const handleEdit = (id) => {
  navigate(`/admin/academics/time-table-dashboard/configure/${id}?mode=edit`);
};

const handleCopy = (id) => {
  navigate(`/admin/academics/time-table-dashboard/configure/${id}?mode=copy`);
};


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    try {
      await axios.delete(`${BASE}/timeTable/deleteConfigurationDraftFile/${id}`);
      fetchConfigurationDraftFileDtls(); // refresh list
    } catch (err) {
      console.error("Delete failed", err);
    }
  };


  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Configuration Draft Files</h2>
        <button className={styles.primaryBtn} onClick={handleCreate}>
          + New Configuration
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {configurationDraftFileDtls.length === 0 ? (
              <tr>
                <td colSpan="4" className={styles.center}>
                  No Data Available
                </td>
              </tr>
            ) : (
              configurationDraftFileDtls.map((item) => (
                <tr key={item.config_id}>
                  <td>{item.config_file_name}</td>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{formatDate(item.updated_at)}</td>

                  <td>
                    <span
                      className={styles.linkIcon}
                      onClick={() => handleEdit(item.config_id)}
                      title="Edit"
                    >
                      <FaEdit />
                    </span>

                    <span
                      className={styles.linkIcon}
                      onClick={() => handleCopy(item.config_id)}
                      title="Copy"
                    >
                      <FaCopy />
                    </span>

                    <span
                      className={`${styles.linkIcon} ${styles.delete}`}
                      onClick={() => handleDelete(item.config_id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}