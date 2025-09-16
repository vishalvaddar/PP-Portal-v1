import React from "react";
import classes from "./ProfileField.module.css";

const ProfileField = ({ label, value }) => (
  <div className={classes.formGroup}>
    <label className={classes.formLabel}>{label}</label>
    <div className={classes.formValue}>{value}</div>
  </div>
);

export default ProfileField;
