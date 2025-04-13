import React, { useState } from 'react';
import axios from "axios";
import "./CreateCriteria.css"; 

const CreateCriteria = () => {
  const [criteriaName, setCriteriaName] = useState('');

  const handleChange = (e) => {
    setCriteriaName(e.target.value);
  };

  return (
    <div className="createcriteria">
      <h1>Create Criteria</h1>
      <input
        type="text"
        className="input-box"
        placeholder="Enter criteria name"
        value={criteriaName}
        onChange={handleChange}
      />
    
      <button className="submit-btn">Submit</button>
    </div>
  );
};

export default CreateCriteria;
