import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { PlusCircle, Pencil, Trash2, X, Lock, Unlock } from "lucide-react";
import axios from "axios";
import classes from "./UserRoles.module.css";

// Notification Component
const Notification = ({ message, type, onDismiss }) => {
  if (!message) return null;
  return (
    <div className={`${classes.notification} ${classes[type]}`}>
      <p>{message}</p>
      <button onClick={onDismiss} className={classes.dismissButton}><X size={18} /></button>
    </div>
  );
};

// Confirmation Modal Component - Made more generic for reuse
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmButtonText = "Confirm" }) => {
  if (!show) return null;
  return (
    <div className={classes.modalOverlay}>
      <div className={classes.modal}>
        <h3>{title}</h3>
        <p className={classes.confirmMessage}>{message}</p>
        <div className={classes.modalActions}>
          <button onClick={onConfirm} className={classes.dangerBtn}>{confirmButtonText}</button>
          <button onClick={onClose} className={classes.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const UserRoles = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]); // Now stores objects: { id, roleName, status }
  const [notification, setNotification] = useState({ message: "", type: "success" });

  const [userForm, setUserForm] = useState({ username: "", password: "", roles: [] });
  const [errors, setErrors] = useState({});
  const [editUser, setEditUser] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleError, setRoleError] = useState("");

  const [userToDelete, setUserToDelete] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false); // Renamed for clarity

  // State for user status confirmation
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [targetUserStatus, setTargetUserStatus] = useState(''); // "N" for active, "Y" for deactivated

  // New state for role status confirmation
  const [showConfirmRoleStatusModal, setShowConfirmRoleStatusModal] = useState(false);
  const [roleToToggleStatus, setRoleToToggleStatus] = useState(null);
  const [targetRoleStatus, setTargetRoleStatus] = useState(''); // "N" for active, "Y" for deactivated

  const notify = (msg, type = "success") => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: "", type }), 4000);
  };

  const fetchUsers = useCallback(async () => {
    console.log("Fetching users...");
    try {
      const res = await axios.get("http://localhost:5000/api/users");
      console.log("Users fetched successfully:", res.data);
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      notify("Failed to fetch users.", "error");
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    console.log("Fetching roles...");
    try {
      // Assuming backend returns roles as objects with id, roleName, and status
      const res = await axios.get("http://localhost:5000/api/roles");
      console.log("Roles fetched successfully:", res.data);
      setRoles(res.data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      notify("Failed to fetch roles.", "error");
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const validateUser = ({ username, password }, isEdit = false) => {
    const errs = {};
    if (!username.trim()) errs.username = "Username is required";
    if (!isEdit && !password.trim()) errs.password = "Password is required";
    return errs;
  };

  // Modified getOptions to filter for active roles and map to { value, label }
  const getOptions = (arr) => arr.filter(r => r.status === "N").map(r => ({ value: r.roleName, label: r.roleName }));
  // getSelected remains the same as userForm.roles are strings
  const getSelected = (arr) => arr.map(r => ({ value: r, label: r }));

  const openCreate = () => {
    setUserForm({ username: "", password: "", roles: [] });
    setErrors({});
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    const errs = validateUser(userForm);
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      console.log("Creating user with data:", userForm);
      await axios.post("http://localhost:5000/api/users", userForm);
      notify(`User "${userForm.username}" created`);
      fetchUsers();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
      notify("Error creating user", "error");
    }
  };

  const openEdit = (u) => {
    setEditUser({ ...u, password: "" }); // Clear password for edit form
    setErrors({});
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    const errs = validateUser(editUser, true);
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      console.log(`Updating user ${editUser.id} with data:`, editUser);
      await axios.put(`http://localhost:5000/api/users/${editUser.id}`, editUser);
      notify(`User "${editUser.username}" updated`);
      fetchUsers();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating user:", error);
      notify("Error updating user", "error");
    }
  };

  const handleDeleteClick = (id) => { // Renamed for clarity
    setUserToDelete(id);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteUser = async () => { // Renamed for clarity
    if (!userToDelete) return;
    try {
      console.log("Deleting user with ID:", userToDelete);
      await axios.delete(`http://localhost:5000/api/users/${userToDelete}`);
      notify("User deleted");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      notify("Delete failed.", "error");
    } finally {
      setShowConfirmDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Function to initiate user status toggle confirmation
  const initiateToggleUserStatus = (user) => {
    const newStatus = user.status === "N" ? "Y" : "N"; // "N" for Active, "Y" for Deactivated
    console.log(`Initiating toggle for user ${user.username}. Current status: ${user.status}, New status: ${newStatus}`);
    setUserToToggleStatus(user);
    setTargetUserStatus(newStatus);
    setShowConfirmStatusModal(true);
  };

  // Function to confirm and execute user status toggle
  const confirmToggleUserStatus = async () => {
    if (!userToToggleStatus) return;
    console.log(`Confirming user status change for ${userToToggleStatus.username} to ${targetUserStatus}`);

    // --- Optimistic Update for User Status ---
    const originalStatus = userToToggleStatus.status;
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userToToggleStatus.id ? { ...u, status: targetUserStatus } : u
      )
    );
    // ------------------------------------------

    try {
      const response = await axios.put(`http://localhost:5000/api/users/${userToToggleStatus.id}/status`, { status: targetUserStatus });
      console.log("User status update response:", response.data);
      notify(`User "${userToToggleStatus.username}" ${targetUserStatus === "N" ? "activated" : "deactivated"} successfully!`);
      // No need to fetchUsers() immediately here, as we optimistically updated.
      // However, a full re-fetch can be a fallback for complex scenarios or if backend returns more than just status.
      // For now, relying on optimistic update + error handling.
    } catch (error) {
      console.error("Error updating user status:", error);
      notify("Error updating user status", "error");
      // --- Revert Optimistic Update on Error ---
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userToToggleStatus.id ? { ...u, status: originalStatus } : u
        )
      );
      // ------------------------------------------
    } finally {
      setShowConfirmStatusModal(false);
      setUserToToggleStatus(null);
      setTargetUserStatus('');
    }
  };

  // Function to initiate role status toggle confirmation
  const initiateToggleRoleStatus = (role) => {
    const newStatus = role.status === "N" ? "Y" : "N"; // "N" for Active, "Y" for Deactivated
    console.log(`Initiating toggle for role ${role.roleName}. Current status: ${role.status}, New status: ${newStatus}`);
    setRoleToToggleStatus(role);
    setTargetRoleStatus(newStatus);
    setShowConfirmRoleStatusModal(true);
  };

  // Function to confirm and execute role status toggle
  const confirmToggleRoleStatus = async () => {
    if (!roleToToggleStatus) return;
    console.log(`Confirming role status change for ${roleToToggleStatus.roleName} to ${targetRoleStatus}`);

    // --- Optimistic Update for Role Status ---
    const originalStatus = roleToToggleStatus.status;
    setRoles(prevRoles =>
      prevRoles.map(r =>
        r.id === roleToToggleStatus.id ? { ...r, status: targetRoleStatus } : r
      )
    );
    // ------------------------------------------

    try {
      // Assuming a PUT endpoint for role status: /api/roles/:id/status
      const response = await axios.put(`http://localhost:5000/api/roles/${roleToToggleStatus.id}/status`, { status: targetRoleStatus });
      console.log("Role status update response:", response.data);
      notify(`Role "${roleToToggleStatus.roleName}" ${targetRoleStatus === "N" ? "activated" : "deactivated"} successfully!`);
      // No need to fetchRoles() immediately here due to optimistic update.
      // Re-fetching users is still good in case role status affects user display.
      fetchUsers();
    } catch (error) {
      console.error("Error updating role status:", error);
      notify("Error updating role status", "error");
      // --- Revert Optimistic Update on Error ---
      setRoles(prevRoles =>
        prevRoles.map(r =>
          r.id === roleToToggleStatus.id ? { ...r, status: originalStatus } : r
        )
      );
      // ------------------------------------------
    } finally {
      setShowConfirmRoleStatusModal(false);
      setRoleToToggleStatus(null);
      setTargetRoleStatus('');
    }
  };

  const createRole = async () => {
    const rn = roleName.trim().toUpperCase();
    if (!rn) return setRoleError("Role name is required");
    try {
      // Assuming new roles default to 'N' (Active) status on creation
      console.log("Creating role with data:", { roleName: rn, status: "N" });
      await axios.post("http://localhost:5000/api/roles", { roleName: rn, status: "N" });
      setRoleName("");
      setShowRoleModal(false);
      fetchRoles();
      notify(`Role "${rn}" created`);
    } catch (error) {
      console.error("Error creating role:", error);
      notify("Error creating role", "error");
    }
  };

  return (
    <div className={classes.container}>
      <Notification {...notification} onDismiss={() => setNotification({ message: "", type: "" })} />

      {/* Confirmation Modal for User Deletion */}
      <ConfirmationModal
        show={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={confirmDeleteUser}
        title="Confirm Deletion"
        message={`Are you sure you want to delete user "${users.find(u => u.id === userToDelete)?.username || 'this user'}"? This action cannot be undone.`}
        confirmButtonText="Delete"
      />

      {/* Confirmation Modal for User Status Change */}
      <ConfirmationModal
        show={showConfirmStatusModal}
        onClose={() => setShowConfirmStatusModal(false)}
        onConfirm={confirmToggleUserStatus}
        title={`Confirm ${targetUserStatus === "N" ? "Activation" : "Deactivation"}`}
        message={`Are you sure you want to ${targetUserStatus === "N" ? "activate" : "deactivate"} user "${userToToggleStatus?.username}"?`}
        confirmButtonText={targetUserStatus === "N" ? "Activate" : "Deactivate"}
      />

      {/* Confirmation Modal for Role Status Change */}
      <ConfirmationModal
        show={showConfirmRoleStatusModal}
        onClose={() => setShowConfirmRoleStatusModal(false)}
        onConfirm={confirmToggleRoleStatus}
        title={`Confirm ${targetRoleStatus === "N" ? "Activation" : "Deactivation"}`}
        message={`Are you sure you want to ${targetRoleStatus === "N" ? "activate" : "deactivate"} role "${roleToToggleStatus?.roleName}"?`}
        confirmButtonText={targetRoleStatus === "N" ? "Activate" : "Deactivate"}
      />

      <div className={classes.header}>
        <h1>User Management</h1>
        <div>
          <button onClick={openCreate} className={classes.addBtn}>
            <PlusCircle size={18} /> Add User
          </button>
          <button onClick={() => setShowRoleModal(true)} className={classes.secondaryBtn}>
            <PlusCircle size={18} /> Create Role
          </button>
        </div>
      </div>

      <table className={classes.table}>
        <thead>
          <tr>
            <th>User</th>
            <th>Role(s)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{(u.roles || []).join(", ")}</td>
              <td>
                <span className={`${classes.statusBadge} ${u.status === "N" ? classes.activeStatus : classes.inactiveStatus}`}>
                  {u.status === "N" ? "Active" : "Deactivated"}
                </span>
              </td>
              <td className={classes.actions}>
                <button onClick={() => openEdit(u)} className={classes.actionBtn}><Pencil size={16} /></button>
                <button onClick={() => handleDeleteClick(u.id)} className={`${classes.actionBtn} ${classes.dangerBtnIcon}`}>
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => initiateToggleUserStatus(u)}
                  className={`${classes.actionBtn} ${u.status === "N" ? classes.deactivateBtn : classes.activateBtn}`}
                  title={u.status === "N" ? "Deactivate User" : "Activate User"}
                >
                  {u.status === "N" ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* New Section for Role Management */}
      <div className={classes.header} style={{ marginTop: '40px' }}>
        <h2>Role Management</h2>
      </div>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(r => (
            <tr key={r.id}>
              <td>{r.roleName}</td>
              <td>
                <span className={`${classes.statusBadge} ${r.status === "N" ? classes.activeStatus : classes.inactiveStatus}`}>
                  {r.status === "N" ? "Active" : "Deactivated"}
                </span>
              </td>
              <td className={classes.actions}>
                {/* Add edit/delete role buttons here if needed later */}
                <button
                  onClick={() => initiateToggleRoleStatus(r)}
                  className={`${classes.actionBtn} ${r.status === "N" ? classes.deactivateBtn : classes.activateBtn}`}
                  title={r.status === "N" ? "Deactivate Role" : "Activate Role"}
                >
                  {r.status === "N" ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* Create User Modal */}
      {showCreateModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Create User</h3>
            <div className={classes.modalContent}>
              <label>Username</label>
              <input name="username" value={userForm.username}
                onChange={e => setUserForm(o => ({ ...o, username: e.target.value }))}
                className={errors.username ? classes.errorInput : ''}
              />
              {errors.username && <span className={classes.errorText}>{errors.username}</span>}

              <label>Password</label>
              <input type="password" name="password" value={userForm.password}
                onChange={e => setUserForm(o => ({ ...o, password: e.target.value }))}
                className={errors.password ? classes.errorInput : ''}
              />
              {errors.password && <span className={classes.errorText}>{errors.password}</span>}

              <label>Roles</label>
              <CreatableSelect
                isMulti
                options={getOptions(roles)}
                value={getSelected(userForm.roles)}
                onChange={selection => setUserForm(o => ({ ...o, roles: selection.map(s => s.value) }))}
                classNamePrefix="react-select"
              />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleCreate} className={classes.saveBtn}>Create</button>
              <button onClick={() => setShowCreateModal(false)} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Edit User</h3>
            <div className={classes.modalContent}>
              <label>Username</label>
              <input name="username" value={editUser.username}
                onChange={e => setEditUser(o => ({ ...o, username: e.target.value }))}
                className={errors.username ? classes.errorInput : ''}
              />
              {errors.username && <span className={classes.errorText}>{errors.username}</span>}

              <label>Password (optional)</label>
              <input type="password" name="password" value={editUser.password}
                onChange={e => setEditUser(o => ({ ...o, password: e.target.value }))} />

              <label>Roles</label>
              <CreatableSelect
                isMulti
                options={getOptions(roles)}
                value={getSelected(editUser.roles)}
                onChange={selection => setEditUser(o => ({ ...o, roles: selection.map(s => s.value) }))}
                classNamePrefix="react-select"
              />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleEdit} className={classes.saveBtn}>Save</button>
              <button onClick={() => setShowEditModal(false)} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Create Role</h3>
            <div className={classes.modalContent}>
              <input value={roleName}
                onChange={e => { setRoleName(e.target.value); setRoleError(""); }}
                placeholder="Role name"
                className={roleError ? classes.errorInput : ''}
              />
              {roleError && <span className={classes.errorText}>{roleError}</span>}
            </div>
            <div className={classes.modalActions}>
              <button onClick={createRole} className={classes.saveBtn}>Create</button>
              <button onClick={() => setShowRoleModal(false)} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles;
