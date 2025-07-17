const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const authorizeRoleController = async (req, res) => {
  const { user_name, role_name } = req.body;

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
      return res.status(401).json({ error: 'Role not authorized for user' });
    }

    const user = result.rows[0];

    // ✅ Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        role_name: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.status(200).json({
      token, // 🛡️ include token in response
      user_id: user.user_id,
      user_name: user.user_name,
      role_name: user.role_name
    });

  } catch (error) {
    console.error('Authorize role error:', error.message);
    res.status(500).json({ error: 'Server error during role authorization' });
  }
};

module.exports = authorizeRoleController;
