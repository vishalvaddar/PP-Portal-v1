import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select"; // Used for standard selects if needed, but CreatableSelect is used here
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
      <button onClick={onDismiss} className={classes.dismissButton} aria-label="Dismiss notification">
        <X size={18} />
      </button>
    </div>
  );
};

// Confirmation Modal Component - Made more generic for reuse
const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmButtonText = "Confirm" }) => {
  if (!show) return null;
  return (
    <div className={classes.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={classes.modal}>
        <h3 id="modal-title">{title}</h3>
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
  const [roles, setRoles] = useState([]);
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
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  // State for user status confirmation: "N" for active, "Y" for deactivated
  const [showConfirmStatusModal, setShowConfirmStatusModal] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [targetUserStatus, setTargetUserStatus] = useState(''); // "N" for active, "Y" for deactivated

  // New state for role status confirmation: "Y" for active, "N" for deactivated
  const [showConfirmRoleStatusModal, setShowConfirmRoleStatusModal] = useState(false);
  const [roleToToggleStatus, setRoleToToggleStatus] = useState(null);
  const [targetRoleStatus, setTargetRoleStatus] = useState(''); // "Y" for active, "N" for deactivated

  const notify = (msg, type = "success") => {
    setNotification({ message: msg, type });
    // Keep error messages visible longer or until dismissed, success for a fixed time
    const timeout = type === "error" ? 8000 : 4000;
    setTimeout(() => setNotification({ message: "", type: "" }), timeout);
  };

  const fetchUsers = useCallback(async () => {
    console.log("Fetching users...");
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/users`);
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
      // Assuming backend returns roles as objects with id, role_name, and status
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/roles`);
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
    // Password is only required for new user creation
    if (!isEdit && !password.trim()) errs.password = "Password is required";
    return errs;
  };

  // getOptions to filter for active roles (status "Y" for roles) and map to { value, label }
  const getOptions = (arr) => arr.filter(r => r.status === "Y").map(r => ({ value: r.role_name, label: r.role_name }));
  // getSelected maps selected role strings back to { value, label } for the Select component
  const getSelected = (arr) => arr.map(r => ({ value: r, label: r }));

  const openCreate = () => {
    setUserForm({ username: "", password: "", roles: [] }); // Reset form on open
    setErrors({});
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setUserForm({ username: "", password: "", roles: [] }); // Reset form on close
    setErrors({});
  };

  const handleCreate = async () => {
    const errs = validateUser(userForm);
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      console.log("Creating user with data:", userForm);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/users`, userForm);
      notify(`User "${userForm.username}" created successfully!`);
      fetchUsers(); // Re-fetch users to show new user
      closeCreateModal(); // Close modal and reset form
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error.response?.data?.error || "Error creating user."; // Access error.response.data.error
      notify(errorMessage, "error");
      if (errorMessage.includes("Username already exists")) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      }
    }
  };

  const openEdit = (u) => {
    // When opening edit, copy user data but clear password for security and optional update
    setEditUser({ ...u, password: "" });
    setErrors({});
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditUser(null); // Clear editUser on close
    setErrors({});
  };

  const handleEdit = async () => {
    const errs = validateUser(editUser, true); // Pass true for isEdit
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      console.log(`Updating user ${editUser.id} with data:`, editUser);
      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${editUser.id}`, editUser);
      notify(`User "${editUser.username}" updated successfully!`);
      fetchUsers(); // Re-fetch users to show updated user
      closeEditModal(); // Close modal and reset form
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage = error.response?.data?.error || "Error updating user."; // Access error.response.data.error
      notify(errorMessage, "error");
      if (errorMessage.includes("Username already taken")) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      }
    }
  };

  const handleDeleteClick = (id) => {
    setUserToDelete(id);
    setShowConfirmDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      console.log("Deleting user with ID:", userToDelete);
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/${userToDelete}`);
      notify("User deleted successfully!");
      fetchUsers(); // Re-fetch users after deletion
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage = error.response?.data?.error || "Delete failed."; // Access error.response.data.error
      notify(errorMessage, "error");
    } finally {
      setShowConfirmDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Function to initiate user status toggle confirmation
  const initiateToggleUserStatus = (user) => {
    // Determine the new status: if current is 'N' (active), new is 'Y' (deactivated), else 'N'
    const newStatus = user.status === "N" ? "Y" : "N";
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
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${userToToggleStatus.id}/status`, { status: targetUserStatus });
      console.log("User status update response:", response.data);
      // Message: if target status is 'N' (active), show "activated". If 'Y' (deactivated), show "deactivated".
      notify(`User "${userToToggleStatus.username}" ${targetUserStatus === "N" ? "activated" : "deactivated"} successfully!`);
    } catch (error) {
      console.error("Error updating user status:", error);
      const errorMessage = error.response?.data?.error || "Error updating user status."; // Access error.response.data.error
      notify(errorMessage, "error");
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
    // Determine the new status: if current is 'Y' (active), new is 'N' (deactivated), else 'Y'
    const newStatus = role.status === "Y" ? "N" : "Y";
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
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/roles/${roleToToggleStatus.id}/status`, { status: targetRoleStatus });
      console.log("Role status update response:", response.data);
      // Message: if target status is 'Y' (active), show "activated". If 'N' (deactivated), show "deactivated".
      notify(`Role "${roleToToggleStatus.roleName}" ${targetRoleStatus === "Y" ? "activated" : "deactivated"} successfully!`);
      // Re-fetch users is still good in case role status affects user display,
      // as active/deactive roles affect the dropdown in user modals.
      fetchUsers();
    } catch (error) {
      console.error("Error updating role status:", error);
      const errorMessage = error.response?.data?.error || "Error updating role status."; // Access error.response.data.error
      notify(errorMessage, "error");
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

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setRoleName("");
    setRoleError("");
  };

  const createRole = async () => {
    const rn = roleName.trim().toUpperCase();
    if (!rn) {
      setRoleError("Role name is required");
      return;
    }
    try {
      // Assuming new roles default to 'Y' (Active) status on creation by backend
      console.log("Creating role with data:", { roleName: rn, status: "Y" }); // Frontend now sends 'Y' for active
      await axios.post(`${process.env.REACT_APP_API_URL}/api/roles`, { roleName: rn, status: "Y" });
      notify(`Role "${rn}" created successfully!`);
      fetchRoles(); // Re-fetch roles to update the list and dropdowns
      closeRoleModal();
    } catch (error) {
      console.error("Error creating role:", error);
      const errorMessage = error.response?.data?.error || "Error creating role."; // Access error.response.data.error
      notify(errorMessage, "error");
      // If backend sends a 409 (Conflict) for duplicate role name
      if (error.response && error.response.status === 409) {
        setRoleError(errorMessage); // Display the specific error message from the backend
      }
      // Do NOT clear roleName or close modal on error, let user correct
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
        // Title logic: If current user status is 'N' (Active), we are deactivating. If 'Y' (Deactivated), we are activating.
        title={`Confirm ${userToToggleStatus?.status === "N" ? "Deactivation" : "Activation"}`}
        // Message logic: If target user status is 'N' (Active), message is "activate". If 'Y' (Deactivated), message is "deactivate".
        message={`Are you sure you want to ${targetUserStatus === "N" ? "activate" : "deactivate"} user "${userToToggleStatus?.username}"?`}
        confirmButtonText={targetUserStatus === "N" ? "Activate" : "Deactivate"}
      />

      {/* Confirmation Modal for Role Status Change */}
      <ConfirmationModal
        show={showConfirmRoleStatusModal}
        onClose={() => setShowConfirmRoleStatusModal(false)}
        onConfirm={confirmToggleRoleStatus}
        // Title logic: If current role status is 'Y' (Active), we are deactivating. If 'N' (Deactivated), we are activating.
        title={`Confirm ${roleToToggleStatus?.status === "Y" ? "Deactivation" : "Activation"}`}
        // Message logic: If target role status is 'Y' (Active), message is "activate". If 'N' (Deactivated), message is "deactivate".
        message={`Are you sure you want to ${targetRoleStatus === "Y" ? "activate" : "deactivate"} role "${roleToToggleStatus?.roleName}"?`}
        confirmButtonText={targetRoleStatus === "Y" ? "Activate" : "Deactivate"}
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
          {users.map(({ id, username, roles: userRoles, status }) => (
            <tr key={id}>
              <td>{username}</td>
              <td>{(userRoles || []).join(", ")}</td>
              <td>
                <span className={`${classes.statusBadge} ${status === "N" ? classes.activeStatus : classes.inactiveStatus}`}>
                  {/* Display 'Active' if user status is 'N', 'Deactivated' if 'Y' */}
                  {status === "N" ? "Active" : "Deactivated"}
                </span>
              </td>
              <td className={classes.actions}>
                <button onClick={() => openEdit({ id, username, roles: userRoles, status })} className={classes.actionBtn} title="Edit User"><Pencil size={16} /></button>
                <button onClick={() => handleDeleteClick(id)} className={`${classes.actionBtn} ${classes.dangerBtnIcon}`} title="Delete User">
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => initiateToggleUserStatus({ id, username, status })}
                  // If current user status is 'N' (active), show deactivate button. If 'Y' (deactivated), show activate button.
                  className={`${classes.actionBtn} ${status === "N" ? classes.deactivateBtn : classes.activateBtn}`}
                  title={status === "N" ? "Deactivate User" : "Activate User"}
                >
                  {/* If current user status is 'N' (active), show Lock icon. If 'Y' (deactivated), show Unlock icon. */}
                  {status === "N" ? <Lock size={16} /> : <Unlock size={16} />}
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
          {roles.map(({ id, role_name: rName, status }) => (
            <tr key={id}>
              <td>{rName}</td>
              <td>
                <span className={`${classes.statusBadge} ${status === "Y" ? classes.activeStatus : classes.inactiveStatus}`}>
                  {/* Display 'Active' if role status is 'Y', 'Deactivated' if 'N' */}
                  {status === "Y" ? "Active" : "Deactivated"}
                </span>
              </td>
              <td className={classes.actions}>
                {/* Add edit/delete role buttons here if needed later. Currently only status toggle. */}
                <button
                  onClick={() => initiateToggleRoleStatus({ id, roleName: rName, status })}
                  // If current role status is 'Y' (active), show deactivate button. If 'N' (deactivated), show activate button.
                  className={`${classes.actionBtn} ${status === "Y" ? classes.deactivateBtn : classes.activateBtn}`}
                  title={status === "Y" ? "Deactivate Role" : "Activate Role"}
                >
                  {/* If current role status is 'Y' (active), show Lock icon. If 'N' (deactivated), show Unlock icon. */}
                  {status === "Y" ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* Create User Modal */}
      {showCreateModal && (
        <div className={classes.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="create-user-modal-title">
          <div className={classes.modal}>
            <h3 id="create-user-modal-title">Create User</h3>
            <div className={classes.modalContent}>
              <label htmlFor="create-username">Username</label>
              <input
                id="create-username"
                name="username"
                value={userForm.username}
                onChange={e => setUserForm(o => ({ ...o, username: e.target.value }))}
                className={errors.username ? classes.errorInput : ''}
              />
              {errors.username && <span className={classes.errorText}>{errors.username}</span>}

              <label htmlFor="create-password">Password</label>
              <input
                id="create-password"
                type="password"
                name="password"
                value={userForm.password}
                onChange={e => setUserForm(o => ({ ...o, password: e.target.value }))}
                className={errors.password ? classes.errorInput : ''}
              />
              {errors.password && <span className={classes.errorText}>{errors.password}</span>}

              <label htmlFor="create-roles">Roles</label>
              <CreatableSelect
                id="create-roles"
                isMulti
                options={getOptions(roles)}
                value={getSelected(userForm.roles)}
                onChange={selection => setUserForm(o => ({ ...o, roles: selection.map(s => s.value) }))}
                classNamePrefix="react-select"
                aria-label="Select roles for new user"
              />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleCreate} className={classes.saveBtn}>Create</button>
              <button onClick={closeCreateModal} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className={classes.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="edit-user-modal-title">
          <div className={classes.modal}>
            <h3 id="edit-user-modal-title">Edit User</h3>
            <div className={classes.modalContent}>
              <label htmlFor="edit-username">Username</label>
              <input
                id="edit-username"
                name="username"
                value={editUser.username}
                onChange={e => setEditUser(o => ({ ...o, username: e.target.value }))}
                className={errors.username ? classes.errorInput : ''}
              />
              {errors.username && <span className={classes.errorText}>{errors.username}</span>}

              <label htmlFor="edit-password">Password (optional)</label>
              <input
                id="edit-password"
                type="password"
                name="password"
                value={editUser.password}
                onChange={e => setEditUser(o => ({ ...o, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />

              <label htmlFor="edit-roles">Roles</label>
              <CreatableSelect
                id="edit-roles"
                isMulti
                options={getOptions(roles)}
                value={getSelected(editUser.roles)}
                onChange={selection => setEditUser(o => ({ ...o, roles: selection.map(s => s.value) }))}
                classNamePrefix="react-select"
                aria-label="Select roles for user"
              />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleEdit} className={classes.saveBtn}>Save</button>
              <button onClick={closeEditModal} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className={classes.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="create-role-modal-title">
          <div className={classes.modal}>
            <h3 id="create-role-modal-title">Create Role</h3>
            <div className={classes.modalContent}>
              <label htmlFor="role-name-input">Role Name</label>
              <input
                id="role-name-input"
                value={roleName}
                onChange={e => { setRoleName(e.target.value); setRoleError(""); }}
                placeholder="e.g., ADMIN, USER, EDITOR"
                className={roleError ? classes.errorInput : ''}
              />
              {roleError && <span className={classes.errorText}>{roleError}</span>}
            </div>
            <div className={classes.modalActions}>
              <button onClick={createRole} className={classes.saveBtn}>Create</button>
              <button onClick={closeRoleModal} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles;
