import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import classes from "./ViewApplications.module.css";
import {
  FiChevronUp,
  FiChevronDown,
  FiFilter,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiRefreshCw,
} from "react-icons/fi";
import { MdOutlineSort } from "react-icons/md";

const ViewApplications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [nameMaps, setNameMaps] = useState({
    districts: {},
    blocks: {},
    institutes: {},
  });
  const [columnVisibility, setColumnVisibility] = useState({
    id: true,
    year: true,
    regNumber: true,
    name: true,
    aadhaar: false,
    contact1: true,
    contact2: false,
    district: true,
    block: true,
    school: true,
    medium: false,
    gmat: true,
    sat: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.results) {
      setApplications(location.state.results);
      jurisNames(location.state.results);
    } else {
      fetchApplications();
    }
  }, [location.state]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/applicants");
      setApplications(response.data);
      jurisNames(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const jurisNames = async (apps) => {
    const districtIds = [...new Set(apps.map((app) => app.district).filter(Boolean))];
    const blockIds = [...new Set(apps.map((app) => app.nmms_block).filter(Boolean))];
    const instituteIds = [...new Set(apps.map((app) => app.current_institute_dise_code).filter(Boolean))];

    try {
      const response = await axios.post("http://localhost:5000/juris-names", {
        districtIds,
        blockIds,
        instituteIds,
      });

      setNameMaps(response.data);
    } catch (error) {
      console.error("Error resolving names:", error);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleColumnToggle = (column) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications;

    const term = searchTerm.toLowerCase().trim();
    return applications.filter((app) =>
      Object.entries(app).some(([_, value]) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(term);
      })
    );
  }, [applications, searchTerm]);

  const sortedApplications = useMemo(() => {
    if (!sortConfig.key) return filteredApplications;

    return [...filteredApplications].sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return sortConfig.direction === "asc"
        ? aVal.toString().localeCompare(bVal.toString())
        : bVal.toString().localeCompare(aVal.toString());
    });
  }, [filteredApplications, sortConfig]);

  const getName = (type, id) => {
    return nameMaps[type]?.[id] || "N/A";
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <MdOutlineSort className={classes.sortIcon} />;
    return sortConfig.direction === "asc" ? (
      <FiChevronUp className={classes.sortIconActive} />
    ) : (
      <FiChevronDown className={classes.sortIconActive} />
    );
  };

  const columnLabels = {
    id: "ID",
    year: "NMMS Year",
    regNumber: "Reg Number",
    name: "Student Name",
    aadhaar: "Aadhaar",
    contact1: "Contact No 1",
    contact2: "Contact No 2",
    district: "District",
    block: "Block",
    school: "Current School",
    medium: "Medium",
    gmat: "GMAT Score",
    sat: "SAT Score",
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h2 className={classes.title}>Student Applications</h2>
        <div className={classes.actions}>
          <div className={classes.searchBox}>
            <FiSearch className={classes.searchIcon} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={classes.searchInput}
            />
          </div>
          <button
            className={classes.refreshButton}
            onClick={fetchApplications}
            disabled={isLoading}
          >
            <FiRefreshCw className={isLoading ? classes.spin : ""} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className={classes.toolbar}>
        <div className={classes.viewControls}>
          <button
            className={`${classes.toggleButton} ${showAll ? classes.active : ""}`}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <FiEyeOff /> Show Limited
              </>
            ) : (
              <>
                <FiEye /> Show All
              </>
            )}
          </button>

          <div className={classes.filterDropdown}>
            <button className={classes.filterButton}>
              <FiFilter /> Columns
            </button>
            <div className={classes.filterDropdownContent}>
              <div className={classes.filterHeader}>Visible Columns</div>
              {Object.entries(columnVisibility).map(([key, visible]) => (
                <label key={key} className={classes.filterOption}>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => handleColumnToggle(key)}
                    className={classes.filterCheckbox}
                  />
                  <span className={classes.filterLabel}>{columnLabels[key]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className={classes.resultsInfo}>
          Showing {showAll ? sortedApplications.length : Math.min(sortedApplications.length, 5)} of{" "}
          {sortedApplications.length} records
        </div>
      </div>

      <div className={classes.tableWrapper}>
        <table className={classes.applicationTable}>
          <thead>
            <tr>
              {columnVisibility.id && (
                <th onClick={() => handleSort("applicant_id")} className={classes.sortableHeader}>
                  <div className={classes.headerContent}>
                    ID
                    {getSortIcon("applicant_id")}
                  </div>
                </th>
              )}
              {columnVisibility.year && (
                <th onClick={() => handleSort("nmms_year")} className={classes.sortableHeader}>
                  <div className={classes.headerContent}>
                    NMMS Year
                    {getSortIcon("nmms_year")}
                  </div>
                </th>
              )}
              {columnVisibility.regNumber && (
                <th
                  onClick={() => handleSort("nmms_reg_number")}
                  className={classes.sortableHeader}
                >
                  <div className={classes.headerContent}>
                    Reg Number
                    {getSortIcon("nmms_reg_number")}
                  </div>
                </th>
              )}
              {columnVisibility.name && (
                <th
                  onClick={() => handleSort("student_name")}
                  className={classes.sortableHeader}
                >
                  <div className={classes.headerContent}>
                    Student Name
                    {getSortIcon("student_name")}
                  </div>
                </th>
              )}
              {columnVisibility.aadhaar && <th>Aadhaar</th>}
              {columnVisibility.contact1 && <th>Contact No 1</th>}
              {columnVisibility.contact2 && <th>Contact No 2</th>}
              {columnVisibility.district && (
                <th onClick={() => handleSort("district")} className={classes.sortableHeader}>
                  <div className={classes.headerContent}>
                    District
                    {getSortIcon("district")}
                  </div>
                </th>
              )}
              {columnVisibility.block && (
                <th onClick={() => handleSort("nmms_block")} className={classes.sortableHeader}>
                  <div className={classes.headerContent}>
                    Block
                    {getSortIcon("nmms_block")}
                  </div>
                </th>
              )}
              {columnVisibility.school && (
                <th
                  onClick={() => handleSort("current_institute_dise_code")}
                  className={classes.sortableHeader}
                >
                  <div className={classes.headerContent}>
                    Current School
                    {getSortIcon("current_institute_dise_code")}
                  </div>
                </th>
              )}
              {columnVisibility.medium && <th>Medium</th>}
              {columnVisibility.gmat && (
                <th onClick={() => handleSort("gmat_score")} className={classes.sortableHeader}>
                  <div className={classes.headerContent}>
                    GMAT Score
                    {getSortIcon("gmat_score")}
                  </div>
                </th>
              )}
              {columnVisibility.sat && (
                <th onClick={() => handleSort("sat_score")} className={classes.sortableHeader}>
                  <div className={classes.headerContent}>
                    SAT Score
                    {getSortIcon("sat_score")}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={Object.values(columnVisibility).filter((v) => v).length} className={classes.loadingCell}>
                  Loading data...
                </td>
              </tr>
            ) : sortedApplications.length === 0 ? (
              <tr>
                <td colSpan={Object.values(columnVisibility).filter((v) => v).length} className={classes.noResults}>
                  No applications found
                </td>
              </tr>
            ) : (
              (showAll ? sortedApplications : sortedApplications.slice(0, 5)).map((app) => (
                <tr key={app.applicant_id} className={classes.dataRow}>
                  {columnVisibility.id && <td>{app.applicant_id}</td>}
                  {columnVisibility.year && <td>{app.nmms_year || "N/A"}</td>}
                  {columnVisibility.regNumber && (
                    <td
                      className={classes.clickableCell}
                      onClick={() => navigate(`/edit-form/${app.nmms_reg_number}`)}
                    >
                      {app.nmms_reg_number || "N/A"}
                    </td>
                  )}
                  {columnVisibility.name && <td>{app.student_name || "N/A"}</td>}
                  {columnVisibility.aadhaar && (
                    <td>
                      {app.aadhaar
                        ? `${app.aadhaar.slice(0, 4)}****${app.aadhaar.slice(-4)}`
                        : "N/A"}
                    </td>
                  )}
                  {columnVisibility.contact1 && <td>{app.contact_no1 || "N/A"}</td>}
                  {columnVisibility.contact2 && <td>{app.contact_no2 || "N/A"}</td>}
                  {columnVisibility.district && <td>{getName("districts", app.district)}</td>}
                  {columnVisibility.block && <td>{getName("blocks", app.nmms_block)}</td>}
                  {columnVisibility.school && (
                    <td>{getName("institutes", app.current_institute_dise_code)}</td>
                  )}
                  {columnVisibility.medium && <td>{app.medium || "N/A"}</td>}
                  {columnVisibility.gmat && <td className={classes.scoreCell}>{app.gmat_score || "N/A"}</td>}
                  {columnVisibility.sat && <td className={classes.scoreCell}>{app.sat_score || "N/A"}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewApplications;
