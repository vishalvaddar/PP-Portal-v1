import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Import UI components
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../components/ui/select";

// Import the CSS module
import styles from "./SystemConfig.module.css";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

const SystemConfig = () => {
    const { config, setConfig } = useSystemConfig();
    const [form, setForm] = useState({
        academicYear: "",
        phase: "",
    });

    useEffect(() => {
        if (config) {
            setForm({
                academicYear: config.academicYear || "",
                phase: config.phase || "",
            });
        }
    }, [config]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/system/config`, form);
            setConfig(form); // Update global context
            toast.success("Configuration updated successfully!");
        } catch (err) {
            toast.error("Failed to update configuration");
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>
                System Configuration
            </h1>

            <Card className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                    <CardTitle className={styles.cardTitle}>Academic Year</CardTitle>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                    <Label>Current Academic Year</Label>
                    <Input
                        name="academicYear"
                        value={form.academicYear}
                        onChange={handleChange}
                        placeholder="e.g. 2025-26"
                    />
                </CardContent>
            </Card>

            <Card className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                    <CardTitle className={styles.cardTitle}>Phase</CardTitle>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                    <Select
                        value={form.phase}
                        onValueChange={(value) => setForm({ ...form, phase: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select phase" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admissions in Progress">Admissions in Progress</SelectItem>
                            <SelectItem value="Classes in Progress">Classes in Progress</SelectItem>
                            <SelectItem value="Results Declared">Results Declared</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Button className={styles.saveButton} onClick={handleSave}>
                Save Configuration
            </Button>
        </div>
    );
};

export default SystemConfig;