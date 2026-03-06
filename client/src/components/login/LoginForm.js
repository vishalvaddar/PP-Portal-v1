import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha";
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

/* ---------------- Component ---------------- */
const LoginForm = () => {
  const [formState, setFormState] = useState({
    credentials: { user_name: "", password: "" },
    step: 1,
    error: "",
    isLoading: false,
    roles: [],
    selectedRole: "",
    preAuthToken: null,
  });

  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const navigate = useNavigate();
  const auth = useAuth();

  const updateFormState = useCallback((updates) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  /* ---------------- Handlers ---------------- */
  const resetForm = useCallback(() => {
    updateFormState({
      credentials: { user_name: "", password: "" },
      step: 1,
      error: "",
      isLoading: false,
      roles: [],
      selectedRole: "",
      preAuthToken: null,
    });
    setCaptchaToken(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  }, [updateFormState]);

  const handleFirstStep = useCallback(
    async (e) => {
      e.preventDefault();
      const { user_name, password } = formState.credentials;

      if (!user_name.trim() || !password.trim()) {
        updateFormState({ error: "Please fill in all fields." });
        return;
      }

      if (!captchaToken) {
        updateFormState({ error: "Please complete the CAPTCHA verification." });
        return;
      }

      updateFormState({ error: "", isLoading: true });

      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_BACKEND_API_URL}/api/auth/login`,
          { 
            user_name: user_name.trim(), 
            password,
            captchaToken // Sent to your backend for verification
          }
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
        });
        // Reset the CAPTCHA widget on a failed login attempt
        setCaptchaToken(null);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      } finally {
        updateFormState({ isLoading: false });
      }
    },
    [formState, captchaToken, updateFormState]
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

              {/* reCAPTCHA */}
              <div className={styles.inputWrapper} style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
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