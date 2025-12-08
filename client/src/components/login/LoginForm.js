import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import logo from '../../assets/images.png';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ user_name: '', password: '' });
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    if (auth.user) {
      navigate('/');
    }
  }, [auth.user, navigate]);

  // Map backend roles to normalized frontend keys
  const roleMap = {
    ADMIN: 'admin',
    'BATCH COORDINATOR': 'BATCH COORDINATOR',
    TEACHER: 'teacher',
    STUDENT: 'student',
    INTERVIEWER: 'interviewer',
  };

  const handleFirstStep = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/auth/login`, {
        user_name: credentials.user_name,
        password: credentials.password,
      });

      const { roles: backendRoles, user_name } = response.data;

      if (backendRoles?.length === 1) {
        // If only one role, auto-select and proceed to next step
        const normalizedRole = roleMap[backendRoles[0].toUpperCase()] || backendRoles[0].toLowerCase();
        setSelectedRole(normalizedRole);
        handleRoleSelection(normalizedRole, user_name);
      } else if (backendRoles?.length > 1) {
        // Normalize all roles for selection
        const normalizedRoles = backendRoles.map(
          (r) => roleMap[r.toUpperCase()] || r.toLowerCase()
        );
        setRoles(normalizedRoles);
        setStep(2);
      } else {
        setError('No roles assigned to this user.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleRoleSelection = async (eOrRole, overrideUsername = null) => {
    if (typeof eOrRole === 'object') eOrRole.preventDefault();

    const role = typeof eOrRole === 'string' ? eOrRole : selectedRole;
    const username = overrideUsername || credentials.user_name;

    if (!role) {
      setError('Please select a role.');
      return;
    }

    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/auth/authorize-role`, {
        user_name: username,
        role_name: role,
      });

      const { token, user } = response.data;
      const { user_id, user_name: dbUserName, role_name } = user;

      // Normalize role for frontend use
      const normalizedRole = roleMap[role_name.toUpperCase()] || role_name.toLowerCase();

      const userData = {
        user_id,
        user_name: dbUserName,
        role: normalizedRole,
        token,
      };

      auth.login(userData);

      // Navigate based on normalized role
      switch (normalizedRole) {
        case 'admin':
          navigate('/admin/admin-dashboard');
          break;
        case 'BATCH COORDINATOR':
          navigate('/coordinator/coordinator-dashboard');
          break;
        case 'student':
          navigate('/student/student-dashboard');
          break;
        case 'teacher':
          navigate('/teacher/teacher-dashboard');
          break;
        case 'interviewer':
          navigate('/interviewer/interviewer-dashboard');
          break;
        default:
          navigate('/');
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authorization failed');
    }
  };

  return (
    <div className={styles.loginFormContainer}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <img src={logo} alt="Logo" className={styles.logo} />
          <CardTitle className={styles.cardTitle}>PP Portal</CardTitle>
          <CardDescription className={styles.cardDescription}>
            {step === 1 ? 'Sign in to your account' : 'Select a role'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && <div className={styles.errorMessage}>{error}</div>}

          {step === 1 && (
            <form onSubmit={handleFirstStep} className={styles.formSpaceY4}>
              <div>
                <Label htmlFor="username" className={styles.label}>Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.user_name}
                  onChange={(e) =>
                    setCredentials({ ...credentials, user_name: e.target.value })
                  }
                  required
                  className={styles.inputField}
                />
              </div>

              <div>
                <Label htmlFor="password" className={styles.label}>Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  required
                  className={styles.inputField}
                />
              </div>

              <Button type="submit" className={styles.button}>Next</Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRoleSelection} className={styles.formSpaceY4}>
              <div>
                <Label htmlFor="role" className={styles.label}>Select Role</Label>
                <div className={styles.roleRadioGroup}>
                  {roles.map((role) => (
                    <label
                      key={role}
                      className={styles.roleOption}
                      htmlFor={role}
                      data-checked={selectedRole === role}
                    >
                      <input
                        type="radio"
                        name="role"
                        id={role}
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        className={styles.roleRadioGroupItem}
                      />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className={styles.button} disabled={!selectedRole}>
                Continue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
