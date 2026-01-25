import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import logo from '../../assets/images.png';

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

import styles from './LoginForm.module.css';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ user_name: '', password: '' });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [preAuthToken, setPreAuthToken] = useState(null);

  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.user) navigate('/');
  }, [auth.user, navigate]);

  const roleMap = {
    ADMIN: 'ADMIN',
    'BATCH COORDINATOR': 'BATCH COORDINATOR',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
    INTERVIEWER: 'INTERVIEWER',
  };

  // STEP 1: Verify username & password
  const handleFirstStep = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/auth/login`,
        {
          user_name: credentials.user_name.trim(),
          password: credentials.password,
        }
      );

      const { roles: backendRoles, preAuthToken: token } = response.data;
      setPreAuthToken(token);

      if (backendRoles?.length === 1) {
        const normalizedRole =
          roleMap[backendRoles[0].toUpperCase()] || backendRoles[0];
        handleRoleSelection(normalizedRole, token);
      } else if (backendRoles?.length > 1) {
        const normalizedRoles = backendRoles.map(
          (r) => roleMap[r.toUpperCase()] || r
        );
        setRoles(normalizedRoles);
        setStep(2);
      } else {
        setError('No active roles found for this user.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Authorize role
  const handleRoleSelection = async (eOrRole, overrideToken = null) => {
    if (typeof eOrRole === 'object') eOrRole.preventDefault();

    const role = typeof eOrRole === 'string' ? eOrRole : selectedRole;
    const tokenToUse = overrideToken || preAuthToken;

    if (!tokenToUse) {
      setError('Session expired. Please login again.');
      setStep(1);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_API_URL}/api/auth/authorize-role`,
        {
          preAuthToken: tokenToUse,
          selectedRole: role,
        }
      );

      const { token, user } = response.data;
      const normalizedRole =
        roleMap[user.role_name.toUpperCase()] || user.role_name;

      auth.login({
        user_id: user.user_id,
        user_name: user.user_name,
        role: normalizedRole,
        token,
      });

      const dashboardMap = {
        ADMIN: '/admin/admin-dashboard',
        'BATCH COORDINATOR': '/coordinator/coordinator-dashboard',
        STUDENT: '/student/student-dashboard',
        TEACHER: '/teacher/teacher-dashboard',
        INTERVIEWER: '/interviewer/interviewer-dashboard',
      };

      navigate(dashboardMap[normalizedRole] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authorization failed.');
      if (err.response?.status === 401) setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginFormContainer}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <CardTitle className={styles.cardTitle}>
            Pratibha Poshak Portal
          </CardTitle>
        </CardHeader>

        <CardContent>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {step === 1 && (
            <form onSubmit={handleFirstStep} className={styles.formSpaceY4}>
              <div>
                <Label>Username</Label>
                <Input
                  value={credentials.user_name}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      user_name: e.target.value,
                    })
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      password: e.target.value,
                    })
                  }
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className={styles.button}
              >
                {isLoading ? 'Verifying...' : 'Next'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRoleSelection} className={styles.formSpaceY4}>
              <Label>Select Role</Label>

              <div className={styles.roleRadioGroup}>
                {roles.map((role) => (
                  <label key={role} className={styles.roleOption}>
                    <input
                      type="radio"
                      name="role"
                      checked={selectedRole === role}
                      onChange={() => setSelectedRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>

              <Button
                type="submit"
                disabled={!selectedRole || isLoading}
                className={styles.button}
              >
                {isLoading ? 'Signing In...' : 'Login'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
