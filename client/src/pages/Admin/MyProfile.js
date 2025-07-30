import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import {
  CheckCircle,
  AlertCircle,
  User,
  Shield,
  Edit3,
  Loader2,
  X,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import styles from "./MyProfile.module.css";

// --- Helper Components (No changes needed) ---

const Notification = ({ message, type, onDismiss }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className={`${styles.globalNotification} ${type === 'success' ? styles.success : styles.error}`}>
      <div className={styles.notificationIcon}>
        {type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      </div>
      <p className={styles.notificationText}>{message}</p>
      <button onClick={onDismiss} className={styles.dismissButton} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
};

const ProfileStats = ({ user }) => (
  <div className={styles.profileStats}>
    <div className={styles.statItem}>
      <div className={styles.statValue}>{user.role?.toUpperCase() || "USER"}</div>
      <div className={styles.statLabel}>Role</div>
    </div>
  </div>
);

const InfoSection = ({ label, value, onEditClick }) => (
  <div className={styles.infoSection}>
    <div>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
    <Button variant="outline" size="sm" onClick={onEditClick}>
      <Edit3 size={14} className={styles.editIcon} />
      Edit
    </Button>
  </div>
);

const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div className={styles.formGroup}>
    <label htmlFor={props.id} className={styles.label}>
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </label>
    <Input {...props} className={`${styles.input} ${error ? styles.errorInput : ""}`} />
    {error && (
      <div className={styles.errorMessage}>
        <AlertCircle size={14} />
        <span>{error}</span>
      </div>
    )}
  </div>
);

const PasswordInput = ({ label, error, showPassword, onTogglePassword, ...props }) => (
  <div className={styles.formGroup}>
    <label htmlFor={props.id} className={styles.label}>
      <Shield size={14} />
      <span>{label}</span>
    </label>
    <div className={styles.passwordInputWrapper}>
      <Input
        {...props}
        type={showPassword ? "text" : "password"}
        className={`${styles.input} ${styles.passwordInput} ${error ? styles.errorInput : ""}`}
      />
      <button type="button" className={styles.togglePasswordButton} onClick={onTogglePassword} aria-label={showPassword ? "Hide password" : "Show password"}>
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
    {error && (
      <div className={styles.errorMessage}>
        <AlertCircle size={14} />
        <span>{error}</span>
      </div>
    )}
  </div>
);


// --- Main Profile Page Component ---

const MyProfile = () => {
  const { user, updateUserProfile } = useAuth();

  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({ username: false, password: false });
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
  }, []);

  const resetForms = useCallback(() => {
    setFormData({
      newUsername: user?.user_name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setShowPassword({ current: false, new: false, confirm: false });
  }, [user]);

  useEffect(() => {
    if (user) resetForms();
  }, [user, resetForms]);

  const handleOpenModal = (type) => {
    resetForms();
    setModalType(type);
  };

  const handleCloseModal = () => setModalType(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const togglePasswordVisibility = useCallback((field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // =================================================================
  //  UPDATED USERNAME SUBMIT HANDLER
  // =================================================================
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, username: true }));
    setErrors({});

    try {
      const apiUrl = `${process.env.REACT_APP_BACKEND_API_URL}/api/user/change-username/${user.user_id}`;
      await axios.put(apiUrl, { username: formData.newUsername });

      updateUserProfile({ user_name: formData.newUsername });
      showNotification("Username updated successfully!", "success");
      handleCloseModal();

    } catch (error) {
      // **FIXED**: Safely extract the error message string from the response object.
      const errorMessage = error.response?.data?.error || error.response?.data || "An unexpected error occurred.";
      
      setErrors({ newUsername: errorMessage });
      showNotification(errorMessage, "error");

    } finally {
      setLoading(prev => ({ ...prev, username: false }));
    }
  };
  
  // =================================================================
  //  UPDATED PASSWORD SUBMIT HANDLER
  // =================================================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, password: true }));
    setErrors({});

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "New passwords do not match." });
      setLoading(prev => ({ ...prev, password: false }));
      return;
    }

    try {
      const apiUrl = `${process.env.REACT_APP_BACKEND_API_URL}/api/user/change-password/${user.user_id}`;
      await axios.put(apiUrl, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      showNotification("Password updated successfully!", "success");
      handleCloseModal();

    } catch (error) {
      // **FIXED**: Safely extract the error message string from the response object.
      const errorMessage = error.response?.data?.error || error.response?.data || "An unexpected error occurred.";

      setErrors({ currentPassword: errorMessage });
      showNotification(errorMessage, "error");

    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const renderModalContent = () => {
    if (modalType === 'username') {
      return (
        <form onSubmit={handleUsernameSubmit} noValidate>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Change Username</h2>
            <p className={styles.modalDesc}>This will be your new public display name.</p>
          </div>
          <div className={styles.modalBody}>
            <InputField
              label="New Username" icon={User} id="newUsername" name="newUsername"
              value={formData.newUsername} onChange={handleChange} error={errors.newUsername}
            />
          </div>
          <div className={styles.modalFooter}>
            <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={loading.username}>Cancel</Button>
            <Button type="submit" disabled={loading.username} className={styles.submitButton}>
              {loading.username ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
              Update Username
            </Button>
          </div>
        </form>
      );
    }

    if (modalType === 'password') {
      return (
        <form onSubmit={handlePasswordSubmit} noValidate>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Change Password</h2>
            <p className={styles.modalDesc}>Choose a strong, new password to keep your account secure.</p>
          </div>
          <div className={styles.modalBody}>
            <PasswordInput
              label="Current Password" id="currentPassword" name="currentPassword"
              value={formData.currentPassword} onChange={handleChange} error={errors.currentPassword}
              showPassword={showPassword.current} onTogglePassword={() => togglePasswordVisibility("current")}
            />
            <PasswordInput
              label="New Password" id="newPassword" name="newPassword"
              value={formData.newPassword} onChange={handleChange} error={errors.newPassword}
              showPassword={showPassword.new} onTogglePassword={() => togglePasswordVisibility("new")}
            />
            <PasswordInput
              label="Confirm New Password" id="confirmPassword" name="confirmPassword"
              value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
              showPassword={showPassword.confirm} onTogglePassword={() => togglePasswordVisibility("confirm")}
            />
          </div>
          <div className={styles.modalFooter}>
            <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={loading.password}>Cancel</Button>
            <Button type="submit" disabled={loading.password} className={styles.submitButton}>
              {loading.password ? <Loader2 size={18} className={styles.spinner} /> : <Shield size={18} />}
              Update Password
            </Button>
          </div>
        </form>
      );
    }
    return null;
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={48} className={styles.spinner} />
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <>
      <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: "" })} />
      
      <div className={styles.pageContainer}>
        <div className={styles.pageLayout}>
          <aside className={styles.leftColumn}>
            <Card>
              <CardHeader className={styles.profileHeader}>
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatar}><User size={40} /></div>
                </div>
                <CardTitle className={styles.profileName}>{user.user_name}</CardTitle>
              </CardHeader>
              <CardContent className={styles.profileContent}>
                <ProfileStats user={user} />
              </CardContent>
            </Card>
          </aside>

          <main className={styles.rightColumn}>
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your public profile and security settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoSection
                  label="Username"
                  value={user.user_name}
                  onEditClick={() => handleOpenModal("username")}
                />
                <InfoSection
                  label="Password"
                  value="••••••••••••"
                  onEditClick={() => handleOpenModal("password")}
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {modalType && (
        <div className={styles.modalBackdrop} onClick={handleCloseModal}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className={styles.closeButton} aria-label="Close modal">
              <X size={20} />
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default MyProfile;