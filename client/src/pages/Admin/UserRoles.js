import React, { useState, useEffect } from "react";
import Select from "react-select";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import classes from "./UserRoles.module.css";

const UserRoles = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["ADMIN", "BATCH COORDINATOR", "TEACHER", "INTERVIEWER", "STUDENT", "APPLICANT"]);
  const [userForm, setUserForm] = useState({ username: "", password: "", roles: [] });
  const [errors, setErrors] = useState({});
  const [editUser, setEditUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const validateUser = ({ username, password }) => {
    const errs = {};
    if (!username.trim()) errs.username = "Username is required";
    if (!password.trim()) errs.password = "Password is required";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleRoleChange = (selectedOptions) => {
    setUserForm((prev) => ({ ...prev, roles: selectedOptions.map((r) => r.value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateUser(userForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/users", userForm);
      setUserForm({ username: "", password: "", roles: [] });
      fetchUsers();
    } catch (err) {
      console.error("User creation failed", err);
    }
  };

  const handleEdit = (user) => {
    setEditUser({ ...user });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditRoleChange = (selectedOptions) => {
    setEditUser((prev) => ({ ...prev, roles: selectedOptions.map((r) => r.value) }));
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`http://localhost:5000/api/users/${editUser.id}`, editUser);
      setShowEditModal(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("User update failed", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error("Delete failed", err);
      }
    }
  };

  const getRoleOptions = () => roles.map((r) => ({ value: r, label: r }));

  const getSelectedRoles = (roleArray) =>
    roleArray.map((r) => ({ value: r, label: r }));

  return (
    <div className={classes.container}>
      <h2 className={classes.heading}>
        <PlusCircle size={24} className={classes.icon} />
        Create New User
      </h2>

      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.formGroup}>
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={userForm.username}
            onChange={handleChange}
            className={errors.username ? classes.errorInput : ""}
          />
          {errors.username && <span className={classes.errorText}>{errors.username}</span>}
        </div>

        <div className={classes.formGroup}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={userForm.password}
            onChange={handleChange}
            className={errors.password ? classes.errorInput : ""}
          />
          {errors.password && <span className={classes.errorText}>{errors.password}</span>}
        </div>

        <div className={classes.formGroup}>
          <label>Roles</label>
          <Select
            isMulti
            options={getRoleOptions()}
            value={getSelectedRoles(userForm.roles)}
            onChange={handleRoleChange}
            placeholder="Select roles..."
          />
        </div>

        <button type="submit" className={classes.submitButton}>Create</button>
      </form>

      <h3 className={classes.tableHeading}>Users</h3>
      <table className={classes.userTable}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.roles.join(", ")}</td>
              <td>{u.status}</td>
              <td>
                <button onClick={() => handleEdit(u)} className={classes.iconBtn}><Pencil size={16} /></button>
                <button onClick={() => handleDelete(u.id)} className={classes.iconBtn}><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEditModal && editUser && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Edit User</h3>
            <div className={classes.modalContent}>
              <label>Username</label>
              <input name="username" value={editUser.username} onChange={handleEditChange} />

              <label>Password</label>
              <input name="password" type="password" value={editUser.password} onChange={handleEditChange} />

              <label>Roles</label>
              <Select
                isMulti
                options={getRoleOptions()}
                value={getSelectedRoles(editUser.roles)}
                onChange={handleEditRoleChange}
              />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleSaveEdit} className={classes.saveBtn}>Save</button>
              <button onClick={() => setShowEditModal(false)} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles;
