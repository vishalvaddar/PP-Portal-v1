import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import login_logo from "../../assets/LOGO_PP.png";

// UI Components
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

import styles from "./LoginForm.module.css";

/* ---------------- Icons ---------------- */
const UserIcon = React.memo(() => (
  <svg
    className={styles.inputIcon}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
));

const LockIcon = React.memo(() => (
  <svg
    className={styles.inputIcon}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
));

const CaptchaIcon = React.memo(() => (
  <svg
    className={styles.inputIcon}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
));

const RefreshIcon = React.memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
  </svg>
));

/* ---------------- Component ---------------- */
const LoginForm = () => {
  const [formState, setFormState] = useState({
    credentials: { user_name: "", password: "" },
    captchaInput: "",
    step: 1,
    error: "",
    isLoading: false,
    roles: [],
    selectedRole: "",
    preAuthToken: null,
  });

  const [captchaCode, setCaptchaCode] = useState("");
  const canvasRef = useRef(null);

  const navigate = useNavigate();
  const auth = useAuth();

  const updateFormState = useCallback((updates) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  /* ---------------- CAPTCHA ---------------- */
  const drawCaptcha = useCallback((code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
      ctx.stroke();
    }

    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    [...code].forEach((char, i) => {
      ctx.save();
      ctx.translate(18 + i * 20, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, []);

  const generateCaptcha = useCallback(() => {
    const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    drawCaptcha(code);
  }, [drawCaptcha]);

  useEffect(() => {
    if (formState.step === 1) generateCaptcha();
  }, [formState.step, generateCaptcha]);

  /* ---------------- Handlers ---------------- */
  const resetForm = useCallback(() => {
    updateFormState({
      credentials: { user_name: "", password: "" },
      captchaInput: "",
      step: 1,
      error: "",
      isLoading: false,
      roles: [],
      selectedRole: "",
      preAuthToken: null,
    });
    generateCaptcha();
  }, [updateFormState, generateCaptcha]);

  const handleFirstStep = useCallback(
    async (e) => {
      e.preventDefault();
      const { user_name, password } = formState.credentials;

      if (!user_name.trim() || !password.trim()) {
        updateFormState({ error: "Please fill in all fields." });
        return;
      }

      if (formState.captchaInput.toUpperCase() !== captchaCode) {
        updateFormState({
          error: "Invalid CAPTCHA code. Please try again.",
          captchaInput: "",
        });
        generateCaptcha();
        return;
      }

      updateFormState({ error: "", isLoading: true });

      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_BACKEND_API_URL}/api/auth/login`,
          { user_name: user_name.trim(), password }
        );

        if (data.roles.length === 1) {
          await handleRoleSelection(data.roles[0], data.preAuthToken);
        } else {
          updateFormState({
            preAuthToken: data.preAuthToken,
            roles: data.roles,
            step: 2,
          });
        }
      } catch (err) {
        updateFormState({
          error:
            err.response?.data?.error ||
            "Login failed. Please check your credentials.",
          captchaInput: "",
        });
        generateCaptcha();
      } finally {
        updateFormState({ isLoading: false });
      }
    },
    [formState, captchaCode, updateFormState, generateCaptcha]
  );

  const handleRoleSelection = useCallback(
    async (role, tokenOverride) => {
      const token = tokenOverride || formState.preAuthToken;
      if (!token) return resetForm();

      updateFormState({ isLoading: true });

      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_BACKEND_API_URL}/api/auth/authorize-role`,
          { preAuthToken: token, selectedRole: role }
        );

        auth.login({
          user_id: data.user.user_id,
          user_name: data.user.user_name,
          role: data.user.role_name,
          token: data.token,
        });

        const dashboards = {
          ADMIN: "/admin/admin-dashboard",
          "BATCH COORDINATOR": "/coordinator/coordinator-dashboard",
          TEACHER: "/teacher/teacher-dashboard",
          STUDENT: "/student/student-dashboard",
          INTERVIEWER: "/interviewer/interviewer-dashboard",
        };

        navigate(dashboards[data.user.role_name] || "/");
      } catch {
        resetForm();
      } finally {
        updateFormState({ isLoading: false });
      }
    },
    [formState.preAuthToken, auth, navigate, updateFormState, resetForm]
  );

  const roleOptions = useMemo(
    () =>
      formState.roles.map((role) => (
        <label
          key={role}
          className={`${styles.roleCard} ${
            formState.selectedRole === role ? styles.activeRole : ""
          }`}
        >
          <input
            type="radio"
            className={styles.hiddenRadio}
            checked={formState.selectedRole === role}
            onChange={() => updateFormState({ selectedRole: role })}
          />
          <span>{role}</span>
        </label>
      )),
    [formState.roles, formState.selectedRole, updateFormState]
  );

  /* ---------------- JSX ---------------- */
  return (
    <div className={styles.pageBackground}>
      <Card className={styles.loginCard}>
        <div className={styles.headerSection}>
          <div className={styles.logoCircle}>
            <img src={login_logo} alt="Logo" className={styles.logoImage} />
          </div>
        </div>
        <CardContent className={styles.formSection}>
          {formState.error && (
            <div className={styles.errorBanner}>⚠ {formState.error}</div>
          )}

          {formState.step === 1 && (
            <form onSubmit={handleFirstStep} className={styles.formStack}>
              {/* Username */}
              <div className={styles.inputWrapper}>
                <Label htmlFor="username" className={styles.label}>Username</Label>
                <div className={styles.inputContainer}>
                  <UserIcon />
                  <Input
                    id="username"
                    className={styles.inputField}
                    placeholder="Enter your username"
                    value={formState.credentials.user_name}
                    onChange={(e) => updateFormState({
                        credentials: { ...formState.credentials, user_name: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.inputWrapper}>
                <Label htmlFor="password" className={styles.label}>Password</Label>
                <div className={styles.inputContainer}>
                  <LockIcon />
                  <Input
                    id="password"
                    type="password"
                    className={styles.inputField}
                    placeholder="Enter your password"
                    value={formState.credentials.password}
                    onChange={(e) => updateFormState({
                        credentials: { ...formState.credentials, password: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* --- CAPTCHA SECTION --- */}
              <div className={styles.inputWrapper}>
                <Label htmlFor="captcha" className={styles.label}>Verification Code</Label>
                <div className={styles.captchaRow}>
                    <canvas 
                        ref={canvasRef} 
                        width="140" 
                        height="48" 
                        className={styles.captchaCanvas}
                        onClick={generateCaptcha}
                        title="Click to refresh image"
                    />
                    <button type="button" onClick={generateCaptcha} className={styles.refreshBtn} title="Refresh Code">
                        <RefreshIcon />
                    </button>
                </div>
                <div className={styles.inputContainer}>
                  <CaptchaIcon />
                  <Input
                    id="captcha"
                    className={styles.inputField}
                    placeholder="Enter code shown above"
                    value={formState.captchaInput}
                    onChange={(e) => updateFormState({ captchaInput: e.target.value })}
                    required
                    maxLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={styles.continueButton}
                disabled={formState.isLoading}
              >
                {formState.isLoading ? (
                  <><span className={styles.spinner}></span> Verifying...</>
                ) : (
                  "Continue >"
                )}
              </Button>
            </form>
          )}

          {formState.step === 2 && (
            <div className={styles.formStack}>
              <div className={styles.inputWrapper}>
                <Label className={styles.label}>Select Account Role</Label>
                <div className={styles.roleContainer}>
                  {roleOptions}
                </div>
              </div>

              <Button
                className={styles.continueButton}
                disabled={!formState.selectedRole || formState.isLoading}
                onClick={() => handleRoleSelection(formState.selectedRole)}
              >
                {formState.isLoading ? (
                  <><span className={styles.spinner}></span> Logging in...</>
                ) : (
                  "Login >"
                )}
              </Button>

              <button type="button" className={styles.textLink} onClick={resetForm}>
                ← Back to Login
              </button>
            </div>
          )}

          <div className={styles.footerText}>
            © 2026 Rajalakshmi Children Foundation. All rights reserved.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
