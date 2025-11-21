import React from "react";
import classes from "./ProfileSection.module.css";

const ProfileSection = ({ section, expanded, toggle, renderField }) => {
  return (
    <div key={section.key}>
      <div
        className={`${classes.sectionHeader} ${expanded ? classes.expanded : ""}`}
        onClick={() => toggle(section.key)}
      >
        <div className={classes.sectionTitle}>
          <span className={classes.sectionIcon}>{section.icon}</span>
          <h3>{section.title}</h3>
        </div>
        <div className={classes.sectionToggle}>
          {expanded ? "−" : "+"}
        </div>
      </div>

      <div className={`${classes.sectionContent} ${expanded ? classes.visible : ""}`}>
        <div className={classes.formGrid}>
          {section.fields.map(field => renderField(field))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;