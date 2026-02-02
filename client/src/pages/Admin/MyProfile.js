import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  User,
  Shield,
  Edit3,
  Loader2,
  X,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import { useAuth } from "../../contexts/AuthContext";

import styles from "./MyProfile.module.css";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`${styles.notification} ${
        type === "success" ? styles.success : styles.error
      }`}
    >
      {type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
      <button onClick={onClose} aria-label="Close notification">
        <X size={16} />
      </button>
    </div>
  );
};

const InfoRow = ({ label, value, onEdit }) => (
  <div className={styles.infoRow}>
    <div>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
    <Button variant="outline" size="sm" onClick={onEdit}>
      <Edit3 size={14} />
      Edit
    </Button>
  </div>
);

const FormField = ({ label, icon: Icon, error, ...props }) => (
  <div className={styles.formField}>
    <label htmlFor={props.id}>
      {Icon && <Icon size={14} />}
      {label}
    </label>
    <Input {...props} />
    {error && (
      <p className={styles.formError}>
        <AlertCircle size={14} /> {error}
      </p>
    )}
  </div>
);

const PasswordField = ({
  label,
  show,
  onToggle,
  error,
  ...props
}) => (
  <div className={styles.formField}>
    <label htmlFor={props.id}>
      <Shield size={14} />
      {label}
    </label>
    <div className={styles.passwordWrapper}>
      <Input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle password visibility"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {error && (
      <p className={styles.formError}>
        <AlertCircle size={14} /> {error}
      </p>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

const MyProfile = () => {
  const { user, updateUserProfile } = useAuth();

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [showPwd, setShowPwd] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const API = process.env.REACT_APP_BACKEND_API_URL;

  const resetForm = useCallback(() => {
    setForm({
      newUsername: user?.user_name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowPwd({});
  }, [user]);

  useEffect(() => {
    if (user) resetForm();
  }, [user, resetForm]);

  const notify = (message, type = "success") =>
    setNotification({ message, type });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  /* ------------------------------ API Calls ------------------------------ */

  const submitUsername = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/api/user/change-username/${user.user_id}`, {
        username: form.newUsername,
      });

      updateUserProfile({ user_name: form.newUsername });
      notify("Username updated successfully");
      setModal(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to update username";
      setErrors({ newUsername: msg });
      notify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (form.newPassword !== form.confirmPassword) {
      return setErrors({ confirmPassword: "Passwords do not match" });
    }

    setLoading(true);
    try {
      await axios.put(`${API}/api/user/change-password/${user.user_id}`, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      notify("Password updated successfully");
      setModal(null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to update password";
      setErrors({ currentPassword: msg });
      notify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */

  if (!user) {
    return (
      <div className={styles.centered}>
        <Loader2 className={styles.spinner} size={48} />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <>
      <Notification
        {...notification}
        onClose={() => setNotification(null)}
      />

      <div className={styles.page}>
        <Breadcrumbs
          path={["Admin", "System Settings", "My Profile"]}
          nonLinkSegments={["Admin", "System Settings"]}
        />

        <div className={styles.layout}>
          {/* Sidebar */}
          <Card>
            <CardHeader className={styles.profileHeader}>
              <div className={styles.avatar}>
                <User size={40} />
              </div>
              <CardTitle>{user.user_name}</CardTitle>
              <CardDescription>{user.role?.toUpperCase()}</CardDescription>
            </CardHeader>
          </Card>

          {/* Main */}
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                Manage account and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Username"
                value={user.user_name}
                onEdit={() => {
                  resetForm();
                  setModal("username");
                }}
              />
              <InfoRow
                label="Password"
                value="••••••••"
                onEdit={() => {
                  resetForm();
                  setModal("password");
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ------------------------------ Modal ------------------------------ */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.close}
              onClick={() => setModal(null)}
            >
              <X size={18} />
            </button>

            {modal === "username" && (
              <form onSubmit={submitUsername}>
                <h2>Change Username</h2>
                <FormField
                  label="New Username"
                  icon={User}
                  name="newUsername"
                  value={form.newUsername}
                  onChange={handleChange}
                  error={errors.newUsername}
                />
                <Button disabled={loading}>
                  {loading ? (
                    <Loader2 className={styles.spinner} />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </Button>
              </form>
            )}

            {modal === "password" && (
              <form onSubmit={submitPassword}>
                <h2>Change Password</h2>

                <PasswordField
                  label="Current Password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  show={showPwd.current}
                  onToggle={() =>
                    setShowPwd((p) => ({ ...p, current: !p.current }))
                  }
                  error={errors.currentPassword}
                />

                <PasswordField
                  label="New Password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  show={showPwd.new}
                  onToggle={() =>
                    setShowPwd((p) => ({ ...p, new: !p.new }))
                  }
                />

                <PasswordField
                  label="Confirm Password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  show={showPwd.confirm}
                  onToggle={() =>
                    setShowPwd((p) => ({ ...p, confirm: !p.confirm }))
                  }
                  error={errors.confirmPassword}
                />

                <Button disabled={loading}>
                  {loading ? (
                    <Loader2 className={styles.spinner} />
                  ) : (
                    <Shield size={16} />
                  )}
                  Update Password
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MyProfile;
