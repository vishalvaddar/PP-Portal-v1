import React from "react";
import styles from "./ProfileField.module.css";

const ProfileField = ({ label, value }) => (
  <div className={styles.formGroup}>
    <label className={styles.formLabel}>{label}</label>
    <div className={styles.formValue}>{value}</div>
  </div>
);

export default ProfileField;
