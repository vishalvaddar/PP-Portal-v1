const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const authorizeRoleController = async (req, res) => {
  const { user_name, role_name } = req.body;

  console.log('Authorization attempt:', { user_name, role_name });

  // Validate input
  if (!user_name || !role_name) {
    return res.status(400).json({ error: 'Username and role are required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiry = process.env.JWT_EXPIRES_IN || '1d';

  if (!jwtSecret) {
    console.error("❌ JWT_SECRET not found in environment variables.");
    return res.status(500).json({ error: 'JWT configuration error' });
  }

  try {
    const query = `
      SELECT u.user_id, u.user_name, r.role_name
      FROM pp.user u
      JOIN pp.user_role ur ON u.user_id = ur.user_id
      JOIN pp.role r ON ur.role_id = r.role_id
      WHERE LOWER(u.user_name) = LOWER($1)
        AND UPPER(r.role_name) = UPPER($2)
        AND u.locked_yn = 'N'
        AND r.active_yn = 'Y'
      LIMIT 1;
    `;

    const result = await pool.query(query, [user_name, role_name]);

    if (result.rows.length === 0) {
      console.warn(`❌ Unauthorized access: No matching user-role found for ${user_name} as ${role_name}`);
      return res.status(401).json({ error: 'Unauthorized: Invalid role for user' });
    }

    const user = result.rows[0];
    const payload = {
      user_id: user.user_id,
      user_name: user.user_name,
      role_name: user.role_name
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiry });

    return res.status(200).json({
      message: 'Authorization successful',
      token,
      user: payload
    });

  } catch (error) {
    console.error('🔥 Error in authorizeRoleController:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = authorizeRoleController;
