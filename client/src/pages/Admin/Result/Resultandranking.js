// src/pages/.../Resultandrank.js
import React, { useState } from "react";
import {
  useFetchStates,
  useFetchDistricts,
  useFetchBlocks,
} from "../../../hooks/ResultandrankHooks";
// import "./Resultandrank.css";




const Resultandrank = () => {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [formData, setFormData] = useState({
    app_state: "",
    district: "",
    nmms_block: [], // multiple blocks allowed
  });

  // fetch states, districts, blocks
  useFetchStates(setStates);
  useFetchDistricts(formData.app_state, setDistricts);
  useFetchBlocks(formData.district, setBlocks);

  const handleChange = (e) => {
    const { name, value, options } = e.target;

    if (name === "app_state") {
      setFormData({
        app_state: value,
        district: "",
        nmms_block: [],
      });
      setDistricts([]);
      setBlocks([]);
    } else if (name === "district") {
      setFormData((prev) => ({
        ...prev,
        district: value,
        nmms_block: [],
      }));
      setBlocks([]);
    } else if (name === "nmms_block") {
      // handle multiple selection
      const selectedValues = Array.from(options)
        .filter((o) => o.selected)
        .map((o) => o.value);

      setFormData((prev) => ({
        ...prev,
        nmms_block: selectedValues,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div class="result-form">
      <h2>Exam Results</h2>

      {/* State Select */}
      <div className="formField">
        <label className="required">
          State: <span className="required">*</span>
        </label>
        <select
          name="app_state"
          value={formData.app_state}
          onChange={handleChange}
          required
        >
          <option value="">Select State</option>
          {states.map((state, index) => (
            <option key={state.id || index} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* District Select */}
      <div className="formField">
        <label className="required">
          Education District: <span className="required">*</span>
        </label>
        <select
          name="district"
          value={formData.district}
          onChange={handleChange}
          required
        >
          <option value="">Select District</option>
          {districts.map((district, index) => (
            <option key={district.id || index} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* Blocks Multi Select */}
      <div className="formField">
        <label className="required">
          NMMS Block: <span className="required">*</span>
        </label>
        <select
          name="nmms_block"
          multiple
          onChange={handleChange}
          value={formData.nmms_block}
          required
        >
          {blocks.map((block, index) => (
            <option key={block.id || index} value={block.id}>
              {block.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Resultandrank;
