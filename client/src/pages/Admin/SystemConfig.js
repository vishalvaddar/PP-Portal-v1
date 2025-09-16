import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { Loader2, Trash2, PlusCircle, Edit3, Settings } from "lucide-react";
import styles from "./SystemConfig.module.css";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const SystemConfig = () => {
  const { refetchConfig } = useSystemConfig();
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({ academicYear: "", phase: "" });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/all`
      );
      setConfigs(Array.isArray(res.data) ? res.data : []);
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
    const yearRegex = /^\d{4}-(\d{2}|\d{4})$/;
    if (!form.academicYear.trim())
      newErrors.academicYear = "Academic year is required";
    else if (!yearRegex.test(form.academicYear))
      newErrors.academicYear = "Use YYYY-YY or YYYY-YYYY format";
    if (!form.phase) newErrors.phase = "Phase is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config`,
        form
      );
      toast.success("Configuration created!");
      fetchConfigs();
      setForm({ academicYear: "", phase: "" });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create configuration"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (id) => {
    setIsSaving(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}/activate`
      );
      await refetchConfig();
      toast.success("Active configuration updated!");
      fetchConfigs();
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration?"))
      return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/system-config/${id}`
      );
      toast.success("Configuration deleted!");
      fetchConfigs();
    } catch (err) {
      toast.error("Failed to delete configuration");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <Settings className={styles.pageIcon} />
        <div>
          <h1 className={styles.header}>System Configuration</h1>
          <p className={styles.subtitle}>
            Manage academic years and operational phases for the system.
          </p>
        </div>
      </header>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Create New Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.formGroup}>
            <Label htmlFor="academicYear">Academic Year</Label>
            <Input
              id="academicYear"
              value={form.academicYear}
              onChange={(e) =>
                handleValueChange("academicYear", e.target.value)
              }
              placeholder="e.g. 2025-26"
              className={errors.academicYear ? styles.inputError : ""}
            />
            {errors.academicYear && (
              <p className={styles.errorText}>{errors.academicYear}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="phase">Phase</Label>
            <Select
              value={form.phase}
              onValueChange={(value) => handleValueChange("phase", value)}
            >
              <SelectTrigger
                id="phase"
                className={`${styles.selectTrigger} ${
                  errors.phase ? styles.inputError : ""
                }`}
              >
                <SelectValue placeholder="Choose a phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admissions in Progress">
                  Admissions in Progress
                </SelectItem>
                <SelectItem value="Classes in Progress">
                  Classes in Progress
                </SelectItem>
                <SelectItem value="Results Declared">
                  Results Declared
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.phase && (
              <p className={styles.errorText}>{errors.phase}</p>
            )}
          </div>

          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className={`${styles.spinner} lucide`} />
            ) : (
              <>
                <PlusCircle className="mr-2" /> Create Configuration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Existing Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className={`${styles.spinner} lucide`} />
          ) : configs.length === 0 ? (
            <p>No configurations found</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Phase</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((c) => (
                  <tr key={c.id}>
                    <td>{c.academic_year}</td>
                    <td>{c.phase}</td>
                    <td>
                      {c.is_active ? (
                        <span className={styles.activeBadge}>Active</span>
                      ) : (
                        <span className={styles.inactiveBadge}>Inactive</span>
                      )}
                    </td>
                    <td className={styles.actionButtons}>
                      {!c.is_active && (
                        <Button
                          size="sm"
                          className={`${styles.activateBtn}`}
                          onClick={() => handleActivate(c.id)}
                        >
                          <Edit3 className="mr-1" /> Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className={`${styles.deleteBtn}`}
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="mr-1" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfig;
