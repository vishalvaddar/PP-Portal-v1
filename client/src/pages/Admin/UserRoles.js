import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { PlusCircle, Pencil, Trash2, X, Lock, Unlock, Users, Shield } from "lucide-react";
import axios from "axios";
import classes from "./UserRoles.module.css";
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs';

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
  const currentPath = ['Admin', 'System-Settings', 'Users&Roles'];
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'

  // --- State Management ---
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

  const [entityToDelete, setEntityToDelete] = useState(null);
  const [entityToToggleStatus, setEntityToToggleStatus] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ message: msg, type });
    const timeout = type === "error" ? 8000 : 4000;
    setTimeout(() => setNotification({ message: "", type: "" }), timeout);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/users`);
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      notify("Failed to fetch users.", "error");
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_API_URL}/api/roles`);
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
    const errors = {};
    if (!username.trim()) errors.username = "Username is required";
    if (!isEdit && !password.trim()) errors.password = "Password is required";
    return errors;
  };

  const getOptions = (arr) => arr.filter(r => r.status === "Y").map(r => ({ value: r.role_name, label: r.role_name }));
  const getSelected = (arr) => (arr || []).map(r => ({ value: r, label: r }));

  const openCreateUserModal = () => {
    setUserForm({ username: "", password: "", roles: [] });
    setErrors({});
    setShowCreateModal(true);
  };

  const closeCreateUserModal = () => {
    setShowCreateModal(false);
    setUserForm({ username: "", password: "", roles: [] });
    setErrors({});
  };

  const handleCreateUser = async () => {
    const errs = validateUser(userForm);
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/users`, userForm);
      notify(`User "${userForm.username}" created successfully!`);
      fetchUsers();
      closeCreateUserModal();
    } catch (err) {
      console.error("Error creating user:", err);
      const errorMessage = err.response?.data?.message || "Error creating user.";
      notify(errorMessage, "error");
      if (errorMessage.includes("Username already exists")) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      }
    }
  };

  const openEditUserModal = (u) => {
    setEditUser({ ...u, password: "" });
    setErrors({});
    setShowEditModal(true);
  };

  const closeEditUserModal = () => {
    setShowEditModal(false);
    setEditUser(null);
    setErrors({});
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    const errs = validateUser(editUser, true);
    if (Object.keys(errs).length) return setErrors(errs);
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/api/users/${editUser.id}`, editUser);
      notify(`User "${editUser.username}" updated successfully!`);
      fetchUsers();
      closeEditUserModal();
    } catch (err) {
      console.error("Error updating user:", err);
      const errorMessage = err.response?.data?.message || "Error updating user.";
      notify(errorMessage, "error");
      if (errorMessage.includes("Username already taken")) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      }
    }
  };

  const openCreateRoleModal = () => {
    setRoleName("");
    setRoleError("");
    setShowRoleModal(true);
  };

  const closeCreateRoleModal = () => {
    setShowRoleModal(false);
    setRoleName("");
    setRoleError("");
  };

  const handleCreateRole = async () => {
    const rn = roleName.trim().toUpperCase();
    if (!rn) {
      setRoleError("Role name is required");
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/roles`, { roleName: rn });
      notify(`Role "${rn}" created successfully!`);
      fetchRoles();
      closeCreateRoleModal();
    } catch (err) {
      console.error("Error creating role:", err);
      const errorMessage = err.response?.data?.message || "Error creating role.";
      notify(errorMessage, "error");
      if (err.response?.status === 409) {
        setRoleError(errorMessage);
      }
    }
  };

  const openDeleteModal = (id, type) => {
    setEntityToDelete({ id, type });
  };

  const closeDeleteModal = () => {
    setEntityToDelete(null);
  };

  const confirmDelete = async () => {
    if (!entityToDelete) return;
    const { id, type } = entityToDelete;
    const isUser = type === 'user';
    const endpoint = isUser ? `/api/users/${id}` : `/api/roles/${id}`;
    const entityName = isUser ? 'User' : 'Role';

    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_API_URL}${endpoint}`);
      notify(`${entityName} deleted successfully!`);
      if (isUser) {
        fetchUsers();
      } else {
        fetchRoles();
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      const errorMessage = err.response?.data?.message || `Delete failed.`;
      notify(errorMessage, "error");
    } finally {
      closeDeleteModal();
    }
  };
  
  const openToggleStatusModal = (entity, type) => {
    const targetStatus = entity.status === 'Y' ? 'N' : 'Y';
    setEntityToToggleStatus({ entity, type, targetStatus });
  };

  const closeToggleStatusModal = () => {
    setEntityToToggleStatus(null);
  };

  const confirmToggleStatus = async () => {
    if (!entityToToggleStatus) return;
    const { entity, type, targetStatus } = entityToToggleStatus;
    const isUser = type === 'user';
    const endpoint = isUser ? `/api/users/${entity.id}/status` : `/api/roles/${entity.id}/status`;
    const entityName = isUser ? entity.username : entity.role_name;
    const action = targetStatus === 'Y' ? 'activated' : 'deactivated';

    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}${endpoint}`, { status: targetStatus });
      notify(`${type.charAt(0).toUpperCase() + type.slice(1)} "${entityName}" ${action} successfully!`);
      if (isUser) {
        fetchUsers();
      } else {
        fetchRoles();
        fetchUsers();
      }
    } catch (err) {
      console.error(`Error updating ${type} status:`, err);
      const errorMessage = err.response?.data?.message || `Error updating ${type} status.`;
      notify(errorMessage, "error");
    } finally {
      closeToggleStatusModal();
    }
  };

  return (
    <div className={classes.container}>
      <Breadcrumbs path={currentPath} nonLinkSegments={['Admin', 'System-Settings']}/>
      <Notification {...notification} onDismiss={() => setNotification({ message: "", type: "" })} />

      <ConfirmationModal
        show={!!entityToDelete}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${entityToDelete?.type}? This action cannot be undone.`}
        confirmButtonText="Delete"
      />

      <ConfirmationModal
        show={!!entityToToggleStatus}
        onClose={closeToggleStatusModal}
        onConfirm={confirmToggleStatus}
        title={`Confirm ${entityToToggleStatus?.targetStatus === 'Y' ? 'Activation' : 'Deactivation'}`}
        message={`Are you sure you want to ${entityToToggleStatus?.targetStatus === 'Y' ? 'activate' : 'deactivate'} this ${entityToToggleStatus?.type}?`}
        confirmButtonText={entityToToggleStatus?.targetStatus === 'Y' ? 'Activate' : 'Deactivate'}
      />

      <div className={classes.header}>
        <h1>User-Role Management</h1>
      </div>

      <div className={classes.tabContainer}>
        <button className={`${classes.tabButton} ${activeTab === 'users' ? classes.activeTab : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={18} /> Users
        </button>
        <button className={`${classes.tabButton} ${activeTab === 'roles' ? classes.activeTab : ''}`} onClick={() => setActiveTab('roles')}>
          <Shield size={18} /> Roles
        </button>
      </div>

      {activeTab === 'users' && (
        <div className={classes.tabContent}>
          <div className={classes.contentHeader}>
            <h2>Users</h2>
            <button onClick={openCreateUserModal} className={classes.addBtn}>
              <PlusCircle size={18} /> Add User
            </button>
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
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{(user.roles || []).join(", ")}</td>
                  <td>
                    <span className={`${classes.statusBadge} ${user.status === "N" ? classes.activeStatus : classes.inactiveStatus}`}>
                      {user.status === "N" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className={classes.actions}>
                    <button onClick={() => openEditUserModal(user)} className={classes.actionBtn} title="Edit User"><Pencil size={16} /></button>
                    <button onClick={() => openDeleteModal(user.id, 'user')} className={`${classes.actionBtn} ${classes.dangerBtnIcon}`} title="Delete User">
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => openToggleStatusModal(user, 'user')}
                      className={`${classes.actionBtn} ${user.status === 'Y' ? classes.deactivateBtn : classes.activateBtn}`}
                      title={user.status === 'Y' ? "Deactivate User" : "Activate User"}
                    >
                      {user.status === 'Y' ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className={classes.tabContent}>
          <div className={classes.contentHeader}>
            <h2>Roles</h2>
            <button onClick={openCreateRoleModal} className={classes.addBtn}>
              <PlusCircle size={18} /> Create Role
            </button>
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
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>{role.role_name}</td>
                  <td>
                    <span className={`${classes.statusBadge} ${role.status === "Y" ? classes.activeStatus : classes.inactiveStatus}`}>
                      {role.status === "Y" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className={classes.actions}>
                    <button onClick={() => openDeleteModal(role.id, 'role')} className={`${classes.actionBtn} ${classes.dangerBtnIcon}`} title="Delete Role">
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => openToggleStatusModal(role, 'role')}
                      className={`${classes.actionBtn} ${role.status === 'Y' ? classes.deactivateBtn : classes.activateBtn}`}
                      title={role.status === 'Y' ? "Deactivate Role" : "Activate Role"}
                    >
                      {role.status === 'Y' ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Create User</h3>
            <div className={classes.modalContent}>
              <label htmlFor="create-username">Username</label>
              <input id="create-username" name="username" value={userForm.username} onChange={e => setUserForm(o => ({ ...o, username: e.target.value }))} className={errors.username ? classes.errorInput : ''} />
              {errors.username && <span className={classes.errorText}>{errors.username}</span>}

              <label htmlFor="create-password">Password</label>
              <input id="create-password" type="password" name="password" value={userForm.password} onChange={e => setUserForm(o => ({ ...o, password: e.target.value }))} className={errors.password ? classes.errorInput : ''} />
              {errors.password && <span className={classes.errorText}>{errors.password}</span>}

              <label htmlFor="create-roles">Roles</label>
              <CreatableSelect id="create-roles" isMulti options={getOptions(roles)} value={getSelected(userForm.roles)} onChange={selection => setUserForm(o => ({ ...o, roles: selection.map(s => s.value) }))} classNamePrefix="react-select" />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleCreateUser} className={classes.saveBtn}>Create</button>
              <button onClick={closeCreateUserModal} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editUser && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Edit User</h3>
            <div className={classes.modalContent}>
              <label htmlFor="edit-username">Username</label>
              <input id="edit-username" name="username" value={editUser.username} onChange={e => setEditUser(o => ({ ...o, username: e.target.value }))} className={errors.username ? classes.errorInput : ''} />
              {errors.username && <span className={classes.errorText}>{errors.username}</span>}

              <label htmlFor="edit-password">Password (optional)</label>
              <input id="edit-password" type="password" name="password" value={editUser.password} onChange={e => setEditUser(o => ({ ...o, password: e.target.value }))} placeholder="Leave blank to keep current password" />

              <label htmlFor="edit-roles">Roles</label>
              <CreatableSelect id="edit-roles" isMulti options={getOptions(roles)} value={getSelected(editUser.roles)} onChange={selection => setEditUser(o => ({ ...o, roles: selection.map(s => s.value) }))} classNamePrefix="react-select" />
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleEditUser} className={classes.saveBtn}>Save</button>
              <button onClick={closeEditUserModal} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3>Create Role</h3>
            <div className={classes.modalContent}>
              <label htmlFor="role-name-input">Role Name</label>
              <input id="role-name-input" value={roleName} onChange={e => { setRoleName(e.target.value); setRoleError(""); }} placeholder="e.g., ADMIN, STUDENT, TEACHER" className={roleError ? classes.errorInput : ''} />
              {roleError && <span className={classes.errorText}>{roleError}</span>}
            </div>
            <div className={classes.modalActions}>
              <button onClick={handleCreateRole} className={classes.saveBtn}>Create</button>
              <button onClick={closeCreateRoleModal} className={classes.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles;
