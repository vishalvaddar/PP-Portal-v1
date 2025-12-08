import React, { useState, useMemo } from "react";
import useResultandrankHooks from "../../../hooks/ResultandrankHooks";
import styles from "./Resultandranking.module.css";

const Resultandrank = () => {
  const {
    formData,
    divisions,
    setFormData,
    educationDistricts,
    blocks,
    exams,
    handleSearch,
    searchResults,
    handleDownload,
    filters,
    handleFilterChange,
    getUniqueValues,
    totalResults,
    filteredResultsCount,
    isLoading
  } = useResultandrankHooks();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Calculate pagination values
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return searchResults.slice(startIndex, endIndex);
  }, [searchResults, currentPage, pageSize]);

  const totalPages = Math.ceil(searchResults.length / pageSize);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) pages.push(1);
      if (startPage > 2) pages.push('...');
      
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      
      if (endPage < totalPages - 1) pages.push('...');
      if (endPage < totalPages) pages.push(totalPages);
    }
    
    return pages;
  };

  // Handle search with pagination reset
  const handleSearchWithReset = () => {
    setCurrentPage(1);
    handleSearch();
  };

  // Remove chip handler
  const removeBlock = (blockId) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(id => id !== blockId)
    }));
  };

  return (
    <div className={styles.resultContainer}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
        </div>
      )}

      {/* Search Type Selection */}
    

<div className={styles.searchTypeSelector}>
  <h3 className={styles.selectorTitle}>Select Search Type</h3>
  <div className={styles.selectorButtons}>
    <button
      className={`${styles.typeButton} ${
        formData.searchType === "blocks" ? styles.activeType : ""
      }`}
      onClick={() =>
        setFormData((prev) => ({
          ...prev,
          searchType: "blocks",
          division: "",
          education_district: "",
          blocks: [],
          exam_id: ""
        }))
      }
    >
      <div className={styles.typeIcon}>
        <span className={styles.iconText}>📊</span>
      </div>
      <div className={styles.typeContent}>
        <div className={styles.typeTitle}>Search by Blocks</div>
        <div className={styles.typeDescription}>
          Filter results by division, district, and blocks
        </div>
      </div>
      <div className={styles.typeIndicator}>
        {formData.searchType === "blocks" ? "✓" : "→"}
      </div>
    </button>

    <button
      className={`${styles.typeButton} ${
        formData.searchType === "exam" ? styles.activeType : ""
      }`}
      onClick={() =>
        setFormData((prev) => ({
          ...prev,
          searchType: "exam",
          division: "",
          education_district: "",
          blocks: [],
          exam_id: ""
        }))
      }
    >
      <div className={styles.typeIcon}>
        <span className={styles.iconText}>📝</span>
      </div>
      <div className={styles.typeContent}>
        <div className={styles.typeTitle}>Search by Exam</div>
        <div className={styles.typeDescription}>
          Select a specific exam to view results
        </div>
      </div>
      <div className={styles.typeIndicator}>
        {formData.searchType === "exam" ? "✓" : "→"}
      </div>
    </button>
  </div>
</div>

      {/* Conditional Form based on Search Type */}
      {formData.searchType === "blocks" ? (
        <>
          {/* Division Dropdown */}
          <div className={styles.formGroup}>
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
              <option value="">-- Select Division (Optional) --</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

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
                <option value="">-- Select Education District (Optional) --</option>
                {educationDistricts.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Blocks Dropdown */}
          {blocks?.length > 0 && (
            <div className={styles.blockContainer}>
              <div className={styles.formGroup}>
                <label>Select Blocks (Optional)</label>
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
                <h4>Selected Blocks ({formData.blocks.length})</h4>
                {formData.blocks.length === 0 ? (
                  <p className={styles.noSelected}>No blocks selected (showing all blocks)</p>
                ) : (
                  <div className={styles.chipWrapper}>
                    {formData.blocks.map((blockId) => {
                      const block = blocks.find((b) => b.id == blockId);
                      return (
                        <span 
                          key={blockId} 
                          className={styles.chip}
                          onClick={() => removeBlock(blockId)}
                          title="Click to remove"
                        >
                          {block?.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Exam Selection */
        <div className={styles.formGroup}>
          <label>Select Exam</label>
          <select
            value={formData.exam_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                exam_id: e.target.value,
              }))
            }
          >
            <option value="">-- Select Exam --</option>
            {exams.map((exam) => (
              <option key={exam.exam_id} value={exam.exam_id}>
                {exam.exam_name} - {new Date(exam.exam_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.buttonGroup}>
        <button className={styles.searchBtn} onClick={handleSearchWithReset}>
          Search
        </button>
        <button className={styles.downloadBtn} onClick={handleDownload}>
          Download Results (XLS)
        </button>
      </div>

      {/* Statistics Bar - Removed Filter Match */}
      {searchResults.length > 0 && (
        <div className={styles.statsBar}>
          <div className={styles.statsItem}>
            <div className={styles.statsValue}>{totalResults}</div>
            <div className={styles.statsLabel}>Total Results</div>
          </div>
          <div className={styles.statsItem}>
            <div className={styles.statsValue}>{filteredResultsCount}</div>
            <div className={styles.statsLabel}>Filtered Results</div>
          </div>
          <div className={styles.statsItem}>
            <div className={styles.statsValue}>{pageSize}</div>
            <div className={styles.statsLabel}>Page Size</div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      {searchResults.length > 0 && (
        <div className={styles.filterSection}>
          <h3>Filter Results</h3>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>PP Exam Cleared:</label>
              <select 
                value={filters.ppExamCleared} 
                onChange={(e) => handleFilterChange('ppExamCleared', e.target.value)}
              >
                <option value="all">All</option>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Interview Status:</label>
              <select 
                value={filters.interviewStatus} 
                onChange={(e) => handleFilterChange('interviewStatus', e.target.value)}
              >
                <option value="all">All</option>
                {getUniqueValues('interview_status').map((status, index) => (
                  <option key={index} value={status}>{status || 'Not Set'}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Interview Result:</label>
              <select 
                value={filters.interviewResult} 
                onChange={(e) => handleFilterChange('interviewResult', e.target.value)}
              >
                <option value="all">All</option>
                {getUniqueValues('interview_result').map((result, index) => (
                  <option key={index} value={result}>{result || 'Not Set'}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Home Verification Status:</label>
              <select 
                value={filters.verificationStatus} 
                onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}
              >
                <option value="all">All</option>
                {getUniqueValues('verification_status').map((status, index) => (
                  <option key={index} value={status}>{status || 'Not Set'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Display Table */}
      {searchResults.length > 0 ? (
        <>
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, searchResults.length)} of {searchResults.length} records
            </div>
            
            <div className={styles.pageSizeSelector}>
              <label>Show:</label>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Applicant ID</th>
                <th>Student Name</th>
                <th>GMAT</th>
                <th>SAT</th>
                {/* <th>Total</th> */}
                <th>PP Exam Score</th>
                <th>PP Exam Cleared</th>
                <th>Interview Status</th>
                <th>Interview Result</th>
                <th>Home Verification</th>
                <th>Contact</th>
                <th>School</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((r, index) => {
                const gmat = Number(r.gmat_score || r["GMAT Score"] || 0);
                const sat = Number(r.sat_score || r["SAT Score"] || 0);
                // const total = gmat + sat;
                const marks = Number(r.pp_exam_score || r["Marks"] || 0);
                const globalIndex = (currentPage - 1) * pageSize + index + 1;

                return (
                  <tr key={`${r.applicant_id}_${index}`}>
                    <td>{globalIndex}</td>
                    <td>{r.applicant_id || r["Applicant ID"]}</td>
                    <td>{r.student_name || r["Student Name"]}</td>
                    <td>{gmat}</td>
                    <td>{sat}</td>
                    {/* <td>{total}</td> */}
                    <td>{marks}</td>
                    <td>
                      <span style={{
                        color: r.pp_exam_cleared === 'Y' ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {r.pp_exam_cleared || r["PP Exam Cleared"]}
                      </span>
                    </td>
                    <td>{r.interview_status || r["Interview Status"]}</td>
                    <td>{r.interview_result || r["Interview Result"]}</td>
                    <td>
                      <span style={{
                        color: r.verification_status === 'Completed' ? '#10b981' : 
                               r.verification_status === 'Pending' ? '#f59e0b' : '#6b7280'
                      }}>
                        {r.verification_status || r["Verification Status"]}
                      </span>
                    </td>
                    <td>{r.contact_no1 || r["Contact Number"]}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div>{r.school_name || r["School Name"]}</div>
                        <div style={{ color: '#6b7280' }}>
                          {r.block_name || r["Block"]}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`dots-${index}`} className={styles.paginationDots}>...</span>
                ) : (
                  <button
                    key={page}
                    className={`${styles.paginationButton} ${currentPage === page ? styles.active : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              
              <button
                className={styles.paginationButton}
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
              
              <div className={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className={styles.noResults}>
          {isLoading ? 'Loading...' : 'No results found. Use the search form above to find records.'}
        </p>
      )}
    </div>
  );
};

export default Resultandrank;