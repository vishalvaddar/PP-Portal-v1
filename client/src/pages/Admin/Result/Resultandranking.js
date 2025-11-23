import React from "react";
import useResultandrankHooks from "../../../hooks/ResultandrankHooks";
import styles from "./Resultandranking.module.css";

const Resultandrank = () => {
  const {
    formData,
    divisions,
    setFormData,
    educationDistricts,
    blocks,
    handleSearch,
    searchResults,
    handleDownload,
  } = useResultandrankHooks();


  // PercentRank.INC implementation
function calcPercentRank(list, value) {
  const arr = [...list].sort((a, b) => a - b);
  const n = arr.length;

  if (value <= arr[0]) return 0;
  if (value >= arr[n - 1]) return 100;

  let index = arr.findIndex(v => v >= value);

  const lowerValue = arr[index - 1];
  const upperValue = arr[index];

  const fraction = (value - lowerValue) / (upperValue - lowerValue);

  return ((index - 1 + fraction) / (n - 1)) * 100;
}





  return (
    <div className={styles.resultContainer}>
      <div className={styles.formGroup}>
        {/* Division Dropdown */}
        <label>Division</label>
        <select
          value={formData.division}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              division: e.target.value,
              education_district: "",
              blocks: [],
            }))
          }
        >
          <option value="">-- Select Division --</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Education District Dropdown */}
        {educationDistricts?.length > 0 && (
          <div className={styles.formGroup}>
            <label>Education District</label>
            <select
              value={formData.education_district}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  education_district: e.target.value,
                  blocks: [],
                }))
              }
            >
              <option value="">-- Select Education District --</option>
              {educationDistricts.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Blocks Dropdown */}
        {/* Blocks Dropdown */}
{blocks?.length > 0 && (
  <div className={styles.blockContainer}>
    <div className={styles.formGroup}>
      <label>Select Blocks</label>
      <select
        multiple
        value={formData.blocks}
        onChange={(e) => {
          const selectedBlocks = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          setFormData((prev) => ({
            ...prev,
            blocks: selectedBlocks,
          }));
        }}
      >
        {blocks.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>

    {/* Selected Blocks Box */}
    <div className={styles.selectedBox}>
      <h4>Selected Blocks</h4>

      {formData.blocks.length === 0 ? (
        <p className={styles.noSelected}>No blocks selected</p>
      ) : (
        <div className={styles.chipWrapper}>
          {formData.blocks.map((blockId) => {
            const block = blocks.find((b) => b.id == blockId);
            return (
              <span key={blockId} className={styles.chip}>
                {block?.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}


        {/* Search Button */}
        <button className={styles.searchBtn} onClick={handleSearch}>
          Search
        </button>

        <button className={styles.downloadBtn} onClick={handleDownload}>
  Download Results (XLS)
</button>
      </div>

      {/* Display Table */}
   
   {searchResults && searchResults.length > 0 ? (
  <table className={styles.resultsTable}>
    <thead>
      <tr>
        <th>NMMS Number</th>
        <th>Student Name</th>
        <th>Father Name</th>

        <th>GMAT</th>
        <th>SAT</th>
        <th>Total</th>
        <th>WC Score</th>
        <th>Percent Rank</th>

        <th>Marks</th>
        <th>Contact Number</th>
        <th>School DISE Code</th>
        <th>Medium</th>
        <th>School Name</th>
      </tr>
    </thead>

    <tbody>
      {searchResults.map((r, i) => {
        const gmat = Number(r["GMAT Score"]);
        const sat = Number(r["SAT Score"]);
        const total = gmat + sat;
        const wcScore = (gmat * 0.7 + sat * 0.3);

        const percentRank = calcPercentRank(
          searchResults.map(x => Number(x["Marks"])),
          Number(r["Marks"])
        );

        return (
          <tr key={i}>
            <td>{r["NMMS Number"]}</td>
            <td>{r["Student Name"]}</td>
            <td>{r["Father Name"]}</td>

            <td>{gmat}</td>
            <td>{sat}</td>
            <td>{total}</td>
            <td>{wcScore.toFixed(2)}</td>
            <td>{percentRank.toFixed(2)}</td>

            <td>{r["Marks"]}</td>
            <td>{r["Contact Number"]}</td>
            <td>{r["School DISE Code"]}</td>
            <td>{r["Medium"]}</td>
            <td>{r["School Name"]}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
) : (
  <p className={styles.noResults}>No results found.</p>
)}


    </div>
  );
};

export default Resultandrank;
