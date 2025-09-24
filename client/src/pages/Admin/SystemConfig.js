import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2, Trash2, PlusCircle, Edit3, Settings } from "lucide-react";
import styles from "./SystemConfig.module.css";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const statusOptions = [
  { value: true, label: "Active" },
  { value: false, label: "Inactive" }
];
const phaseOptions = [
  "Admissions in Progress",
  "Classes in Progress",
  "Results Declared"
];

const SystemConfig = () => {
  const { refetchConfig } = useSystemConfig();
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({ academicYear: "", phase: "", is_active: false });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowValues, setEditRowValues] = useState({
    academic_year: "",
    phase: "",
    is_active: false
  });

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/all`
      );
      const sortedConfigs = (Array.isArray(res.data) ? res.data : []).sort((a, b) =>
        b.academic_year.localeCompare(a.academic_year)
      );
      setConfigs(sortedConfigs);
    } catch (err) {
      toast.error("Failed to fetch configurations");
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Inline value change handlers
  const handleRowEditValueChange = (name, value) => {
    setEditRowValues(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = config => {
    setEditRowId(config.id);
    setEditRowValues({
      academic_year: config.academic_year,
      phase: config.phase,
      is_active: config.is_active
    });
  };

  const handleSave = async id => {
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(editRowValues.academic_year)) {
      toast.error("Please use YYYY-YYYY format (e.g., 2025-2026)");
      return;
    }
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}`,
        {
          academic_year: editRowValues.academic_year,
          phase: editRowValues.phase,
          is_active: editRowValues.is_active
        }
      );
      toast.success("Configuration updated!");
      setEditRowId(null);
      await fetchConfigs();
      await refetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update configuration");
    }
  };

  const handleDelete = async id => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}`
      );
      toast.success("Configuration deleted!");
      await fetchConfigs();
    } catch (err) {
      toast.error("Failed to delete configuration");
    }
  };

  // New configuration form handlers
  const handleValueChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const yearRegex = /^\d{4}-\d{4}$/;
    if (configs.some(c => c.academic_year === form.academicYear.trim())) {
      newErrors.academicYear = "This academic year already exists.";
    }
    if (!form.academicYear.trim()) {
      newErrors.academicYear = "Academic year is required";
    } else if (!yearRegex.test(form.academicYear)) {
      newErrors.academicYear = "Please use YYYY-YYYY format (e.g., 2025-2026)";
    }
    if (!form.phase) {
      newErrors.phase = "Phase is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config`,
        { academic_year: form.academicYear, phase: form.phase }
      );
      toast.success(`Configuration for ${form.academicYear} created!`);
      await fetchConfigs();
      setForm({ academicYear: "", phase: "", is_active: false });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <Settings className={styles.pageIcon} />
        <div>
          <h1 className={styles.pageTitle}>System Configuration</h1>
        </div>
      </header>
      <div className={styles.mainLayout}>
        <div className={styles.formColumn}>
          <Card className={styles.card}>
            <CardHeader>
              <CardTitle>Create New Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={form.academicYear}
                    onChange={e => handleValueChange("academicYear", e.target.value)}
                    placeholder="e.g., 2025-2026"
                    className={errors.academicYear ? styles.inputError : ""}
                  />
                  {errors.academicYear && <p className={styles.errorText}>{errors.academicYear}</p>}
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="phase">Initial Phase</Label>
                  <select
                    id="phase"
                    name="phase"
                    value={form.phase}
                    onChange={e => handleValueChange("phase", e.target.value)}
                    className={`${styles.nativeSelect} ${errors.phase ? styles.inputError : ""}`}
                  >
                    <option value="" disabled>Choose a phase...</option>
                    {phaseOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.phase && <p className={styles.errorText}>{errors.phase}</p>}
                </div>
                <Button type="submit" disabled={isSaving} className={styles.createButton}>
                  {isSaving ? <Loader2 className={styles.spinner} /> : <><PlusCircle size={16} /> Create Configuration</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className={styles.tableColumn}>
          <Card className={styles.card}>
            <CardHeader>
              <CardTitle>Existing Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className={styles.loaderContainer}><Loader2 className={styles.spinner} /></div>
              ) : configs.length === 0 ? (
                <div className={styles.emptyState}>No configurations found.</div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Academic Year</th>
                        <th>Phase</th>
                        <th>Status</th>
                        <th className={styles.actionsHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map(c => (
                        <tr key={c.id}>
                          <td>
                            {editRowId === c.id ? (
                              <Input
                                value={editRowValues.academic_year}
                                onChange={e => handleRowEditValueChange("academic_year", e.target.value)}
                              />
                            ) : (
                              c.academic_year
                            )}
                          </td>
                          <td>
                            {editRowId === c.id ? (
                              <select
                                value={editRowValues.phase}
                                onChange={e => handleRowEditValueChange("phase", e.target.value)}
                                className={styles.phaseSelect}
                              >
                                {phaseOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              c.phase
                            )}
                          </td>
                          <td>
                            {editRowId === c.id ? (
                              <select
                                value={editRowValues.is_active}
                                onChange={e => handleRowEditValueChange("is_active", e.target.value === "true")}
                                className={styles.statusSelect}
                              >
                                {statusOptions.map(option => (
                                  <option key={option.label} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              c.is_active ? (
                                <span className={styles.activeBadge}>Active</span>
                              ) : (
                                <span className={styles.inactiveBadge}>Inactive</span>
                              )
                            )}
                          </td>
                          <td>
                            {editRowId === c.id ? (
                              <>
                                <Button onClick={() => handleSave(c.id)} className={styles.saveButton}>Save</Button>
                                <Button variant="ghost" onClick={() => setEditRowId(null)} className={styles.cancelButton}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button onClick={() => handleEdit(c)} className={styles.editButton}><Edit3 size={16} /></Button>
                                <Button variant="ghost" onClick={() => handleDelete(c.id)} className={styles.deleteButton}>
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
