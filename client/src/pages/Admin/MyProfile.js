import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import styles from './MyProfile.module.css'; // Keep your existing CSS module
import { User, Key, Mail, CheckCircle, XCircle, Info } from 'lucide-react'; // Added Info icon

const MyProfile = () => {
  const { user, login } = useAuth();
  const [name, setName] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <div className={styles.message}>User not logged in.</div>;
  }

  const handleNameChange = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');
    try {
      const res = await axios.patch(`${process.env.REACT_APP_API_URL}/user/update-name`, {
        user_id: user.user_id,
        new_name: name,
      });

      if (res.data.success) {
        login({ ...user, username: name }); // update context
        setMessage('Name updated successfully! 🎉');
        setMessageType('success');
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update name. 😞');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    setMessage('');
    setMessageType('');
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match. 🚫');
      setMessageType('error');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters. 🔒');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.patch(`${process.env.REACT_APP_API_URL}/user/update-password`, {
        user_id: user.user_id,
        new_password: newPassword,
      });

      if (res.data.success) {
        setMessage('Password updated successfully! ✅');
        setMessageType('success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error("Password update error:", err);
      setMessage(err.response?.data?.error || 'Failed to update password. 😔');
      setMessageType('error');
    }
    setLoading(false);
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            <span>{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className={styles.info}>
            <h2 className={styles.welcomeHeading}>Welcome, {user.username}!</h2>
            <p className={styles.roleBadge}>{user.role}</p>
            <p className={styles.detailItem}>
              <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Email: <span className={styles.detailValue}>{user.email || 'N/A'}</span> {/* Assuming 'email' is available */}
            </p>
            <p className={styles.detailItem}>
              <Info size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              User ID: <span className={styles.detailValue}>{user.user_id}</span>
            </p>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>
            <User size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Update Profile Details
          </h3>
          <div className={styles.formGroup}>
            <label htmlFor="name-input" className={styles.formLabel}>New Username:</label>
            <input
              type="text"
              id="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="Enter new username"
            />
            <button onClick={handleNameChange} className={`${styles.button} ${styles.primaryButton}`} disabled={loading}>
              {loading ? 'Updating...' : 'Update Username'}
            </button>
          </div>
        </div>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>
            <Key size={20} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            Change Password
          </h3>
          <div className={styles.formGroup}>
            <label htmlFor="new-password" className={styles.formLabel}>New Password:</label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirm-password" className={styles.formLabel}>Confirm New Password:</label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Confirm new password"
            />
            <button onClick={handlePasswordChange} className={`${styles.button} ${styles.primaryButton}`} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${messageType === 'success' ? styles.successMessage : styles.errorMessage}`}>
            {messageType === 'success' ? <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> : <XCircle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />}
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;