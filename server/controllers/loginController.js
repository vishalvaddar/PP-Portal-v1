const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const loginController = async (req, res) => {
  const { user_name, password } = req.body;
  const clientIp = logger.constructor.getClientIp(req);

  // 1. Basic Validation
  if (!user_name || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // 2. Fetch User & Roles
    const query = `
      SELECT u.user_id, u.user_name, u.enc_password, u.locked_yn, r.role_name
      FROM pp.user u
      JOIN pp.user_role ur ON u.user_id = ur.user_id
      JOIN pp.role r ON ur.role_id = r.role_id
      WHERE LOWER(u.user_name) = LOWER($1) AND r.active_yn = 'Y';
    `;

    const result = await pool.query(query, [user_name]);

    // 3. Prevent Enumeration (Generic Error)
    if (result.rows.length === 0) {
      logger.logLogin({ user_name, status: 'failed', reason: 'user_not_found', ip: clientIp });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 4. Check Lock Status
    if (user.locked_yn === 'Y') {
      return res.status(403).json({ error: 'Account is locked. Contact support.' });
    }

    // 5. Verify Password
    const isMatch = await bcrypt.compare(password, user.enc_password);
    if (!isMatch) {
      logger.logLogin({ user_name, status: 'failed', reason: 'bad_password', ip: clientIp });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 6. Extract Roles
    const roles = result.rows.map(row => row.role_name);

    // 7. Generate PRE-AUTH TOKEN
    // This token is ONLY valid for role selection, NOT for API access.
    const preAuthToken = jwt.sign(
      { 
        user_id: user.user_id, 
        user_name: user.user_name, 
        type: 'PRE_AUTH_ROLE_SELECT', // Specific type claim
        allowed_roles: roles // Embed roles so we don't need another DB query
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } // Expire quickly (5 mins)
    );

    logger.logLogin({ user_name, status: 'success_pre_auth', ip: clientIp });

    return res.status(200).json({
      message: 'Credentials verified',
      user_name: user.user_name,
      roles: roles,
      preAuthToken: preAuthToken 
    });

  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = loginController;