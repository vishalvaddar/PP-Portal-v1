import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2, Trash2, PlusCircle, Edit3, Settings, X, MoreHorizontal } from "lucide-react";
import styles from "./SystemConfig.module.css";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

// --- Edit Modal Component (Unchanged) ---
const EditConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const [editedYear, setEditedYear] = useState(config?.academic_year || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedYear(config?.academic_year || "");
  }, [config]);

  if (!isOpen) return null;

  const handleSaveChanges = async () => {
    const yearRegex = /^\d{4}-\d{4}$/;
    if (!yearRegex.test(editedYear)) {
      toast.error("Please use YYYY-YYYY format (e.g., 2025-2026)");
      return;
    }
    setIsSaving(true);
    await onSave(config.id, { academic_year: editedYear });
    setIsSaving(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Configuration</h3>
          <button onClick={onClose} className={styles.closeButton}><X size={20} /></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <Label htmlFor="editAcademicYear">Academic Year</Label>
            <Input
              id="editAcademicYear"
              value={editedYear}
              onChange={(e) => setEditedYear(e.target.value)}
              placeholder="e.g., 2025-2026"
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className={styles.spinner} /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- New ActionMenu Component for the dropdown ---
const ActionMenu = ({ config, onEdit, onActivate, onDelete, openMenuId, setOpenMenuId }) => {
  const isMenuOpen = openMenuId === config.id;

  const handleAction = (action) => {
    action();
    setOpenMenuId(null); // Close menu after action
  };

  return (
    <div className={styles.actionsCell}>
      <Button variant="ghost" size="icon" onClick={() => setOpenMenuId(isMenuOpen ? null : config.id)}>
        <MoreHorizontal size={20} />
      </Button>
      {isMenuOpen && (
        <div className={styles.dropdownMenu}>
          <button className={styles.menuItem} onClick={() => handleAction(() => onEdit(config))}>
            <Edit3 size={16} /> Edit Year
          </button>
          {!config.is_active && (
            <button className={styles.menuItem} onClick={() => handleAction(() => onActivate(config.id))}>
              Activate
            </button>
          )}
          <button className={`${styles.menuItem} ${styles.deleteItem}`} onClick={() => handleAction(() => onDelete(config.id))}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main SystemConfig Component ---
const SystemConfig = () => {
  const { refetchConfig } = useSystemConfig();
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({ academicYear: "", phase: "" });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

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

  const handleValueChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
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

  const handleCreate = async (e) => {
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
      setForm({ academicYear: "", phase: "" });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}/activate`
      );
      await refetchConfig();
      await fetchConfigs();
      toast.success("Active configuration updated!");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
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

  const handleOpenEditModal = (config) => {
    setEditingConfig(config);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}`, updatedData);
      toast.success("Configuration updated!");
      await fetchConfigs();
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update configuration");
    }
  };

  const handlePhaseUpdate = async (id, newPhase) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}`, { phase: newPhase });
      toast.success("Phase updated!");
      await fetchConfigs();
    } catch (err) {
      toast.error("Failed to update phase");
    }
  };

  return (
    <>
      <EditConfigModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        config={editingConfig}
        onSave={handleUpdate}
      />
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
                    <Input id="academicYear" value={form.academicYear} onChange={(e) => handleValueChange("academicYear", e.target.value)} placeholder="e.g., 2025-2026" className={errors.academicYear ? styles.inputError : ""}/>
                    {errors.academicYear && <p className={styles.errorText}>{errors.academicYear}</p>}
                  </div>
                  <div className={styles.formGroup}>
                    <Label htmlFor="phase">Initial Phase</Label>
                    <select id="phase" name="phase" value={form.phase} onChange={(e) => handleValueChange("phase", e.target.value)} className={`${styles.nativeSelect} ${errors.phase ? styles.inputError : ""}`}>
                      <option value="" disabled>Choose a phase...</option>
                      <option value="Admissions in Progress">Admissions in Progress</option>
                      <option value="Classes in Progress">Classes in Progress</option>
                      <option value="Results Declared">Results Declared</option>
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
                {isLoading ? ( <div className={styles.loaderContainer}><Loader2 className={styles.spinner} /></div>
                ) : configs.length === 0 ? ( <div className={styles.emptyState}>No configurations found.</div>
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
                        {configs.map((c) => (
                          <tr key={c.id}>
                            <td>{c.academic_year}</td>
                            <td>
                              {c.is_active ? (<span>{c.phase}</span>) : (
                                <select value={c.phase} onChange={(e) => handlePhaseUpdate(c.id, e.target.value)} className={styles.phaseSelect}>
                                  <option value="Admissions in Progress">Admissions in Progress</option>
                                  <option value="Classes in Progress">Classes in Progress</option>
                                  <option value="Results Declared">Results Declared</option>
                                </select>
                              )}
                            </td>
                            <td>
                              {c.is_active ? <span className={styles.activeBadge}>Active</span> : <span className={styles.inactiveBadge}>Inactive</span>}
                            </td>
                            {/* --- Updated Actions Column --- */}
                            <td className={styles.actionsCellWrapper}>
                              <ActionMenu
                                config={c}
                                openMenuId={openActionMenuId}
                                setOpenMenuId={setOpenActionMenuId}
                                onEdit={handleOpenEditModal}
                                onActivate={handleActivate}
                                onDelete={handleDelete}
                              />
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
    </>
  );
};

export default SystemConfig;