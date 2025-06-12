const pool = require('../config/db');
const bcrypt = require('bcrypt');

const loginController = async (req, res) => {
  const { user_name, password } = req.body;

  console.log('Login attempt:', { user_name });

  try {
    const query = `
      SELECT u.user_id, u.user_name, u.enc_password, r.role_name
      FROM pp.user u
      JOIN pp.user_role ur ON u.user_id = ur.user_id
      JOIN pp.role r ON ur.role_id = r.role_id
      WHERE LOWER(u.user_name) = LOWER($1)
        AND u.locked_yn = 'N'
        AND r.active_yn = 'Y';
    `;

    const result = await pool.query(query, [user_name]);

    if (result.rows.length === 0) {
      console.log('No matching user or roles');
      return res.status(401).json({ error: 'Invalid username or no active roles assigned' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.enc_password);

    if (!isMatch) {
      console.log('Incorrect password');
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const roles = result.rows.map((row) => row.role_name);

    console.log('Login successful. Roles:', roles);

    // Respond with the list of roles
    res.status(200).json({
      user_id: user.user_id,
      user_name: user.user_name,
      roles,
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = loginController;
