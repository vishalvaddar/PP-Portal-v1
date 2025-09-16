const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginController = async (req, res) => {
  const { user_name, password, selectedRole } = req.body;
  console.log('Login attempt:', { user_name, selectedRole });

  // Step 1: Validate input
  if (!user_name || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Step 2: Ensure JWT_SECRET is available
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set in environment variables.");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Step 3: Query user and their roles
    const query = `
  SELECT u.user_id, u.user_name, u.enc_password, r.role_name
  FROM "pp"."user" u
  JOIN "pp"."user_role" ur ON u.user_id = ur.user_id
  JOIN "pp"."role" r ON ur.role_id = r.role_id
  WHERE LOWER(u.user_name) = LOWER($1)
    AND u.locked_yn = 'N'
    AND r.active_yn = 'Y';
`;


    const result = await pool.query(query, [user_name]);

    if (result.rows.length === 0) {
      console.log('No matching user or active roles found');
      return res.status(401).json({ error: 'Invalid username or no active roles assigned' });
    }

    // Step 4: Compare password with the hashed password
    const { enc_password, user_id, user_name: dbUserName } = result.rows[0];
    const isMatch = await bcrypt.compare(password, enc_password);
    if (!isMatch) {
      console.log('Incorrect password');
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Step 5: Extract all roles
    const roles = result.rows.map(row => row.role_name);
    console.log('Roles found:', roles);

    // Step 6: If multiple roles exist, handle role selection
    if (roles.length > 1) {
      if (!selectedRole) {
        return res.status(200).json({
          message: 'Multiple roles found. Please select a role.',
          user_id,
          user_name: dbUserName,
          roles,
        });
      }

      const matchedRole = roles.find(r => r.toLowerCase() === selectedRole.toLowerCase());
      if (!matchedRole) {
        return res.status(403).json({ error: 'Selected role is not assigned to this user' });
      }
    }

    // Step 7: Use the selected role or default to the only role
    const roleToUse = selectedRole || roles[0];
    console.log(`Login successful as ${roleToUse}`);

    // Step 8: Generate JWT token
    const tokenPayload = {
      user_id,
      user_name: dbUserName,
      role_name: roleToUse,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Step 9: Send response
    return res.status(200).json({
      message: 'Login successful',
      token,
      user_id,
      user_name: dbUserName,
      selected_role: roleToUse,
      roles,
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = loginController;
