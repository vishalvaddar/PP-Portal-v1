const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Get all users with their roles
exports.getUsersWithRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id AS id,
        u.user_name AS username,
        u.locked_yn AS status,  -- Return 'N' or 'Y' directly
        ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles
      FROM pp.user u
      LEFT JOIN pp.user_role ur ON u.user_id = ur.user_id
      LEFT JOIN pp.role r ON ur.role_id = r.role_id
      GROUP BY u.user_id
      ORDER BY u.user_id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users with roles:", err);
    res.status(500).send("Error fetching users with roles");
  }
};

// Get all active roles
exports.getAllRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT role_id AS id, role_name, active_yn AS status
      FROM pp.role
      ORDER BY role_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).send("Error fetching roles");
  }
};

// Create new user with roles
exports.createUserWithRoles = async (req, res) => {
  const { username, password, roles } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const hashedPassword = await bcrypt.hash(password, 10);

    const userInsert = await client.query(
      `INSERT INTO pp.user (user_name, enc_password, locked_yn)
       VALUES ($1, $2, 'N')
       RETURNING user_id`,
      [username, hashedPassword]
    );

    const userId = userInsert.rows[0].user_id;

    if (Array.isArray(roles) && roles.length > 0) {
      const uniqueRoles = [...new Set(roles.map(r => r.trim()))];

      for (const roleName of uniqueRoles) {
        const roleRes = await client.query(
          `SELECT role_id FROM pp.role WHERE role_name = $1`,
          [roleName]
        );
        if (roleRes.rows.length > 0) {
          const roleId = roleRes.rows[0].role_id;
          await client.query(
            `INSERT INTO pp.user_role (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, roleId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: `User "${username}" created successfully` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating user with roles:", err);
    res.status(500).send("Failed to create user");
  } finally {
    client.release();
  }
};

// Update user info and roles
exports.updateUserWithRoles = async (req, res) => {
  const { userId } = req.params;
  const { username, password, roles } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    await client.query(
      `UPDATE pp.user
       SET user_name = $1, enc_password = COALESCE($2, enc_password)
       WHERE user_id = $3`,
      [username, hashedPassword, userId]
    );

    await client.query(`DELETE FROM pp.user_role WHERE user_id = $1`, [userId]);

    if (Array.isArray(roles) && roles.length > 0) {
      const uniqueRoles = [...new Set(roles.map(r => r.trim()))];

      for (const roleName of uniqueRoles) {
        const roleRes = await client.query(
          `SELECT role_id FROM pp.role WHERE role_name = $1`,
          [roleName]
        );
        if (roleRes.rows.length > 0) {
          const roleId = roleRes.rows[0].role_id;
          await client.query(
            `INSERT INTO pp.user_role (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [userId, roleId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.status(204).send("User updated successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating user:", err);
    res.status(500).send("Failed to update user");
  } finally {
    client.release();
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM pp.user_role WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM pp.user WHERE user_id = $1`, [userId]);
    await client.query("COMMIT");
    res.status(204).send("User deleted successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting user:", err);
    res.status(500).send("Failed to delete user");
  } finally {
    client.release();
  }
};

// Toggle user activation status
exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE pp.user
       SET locked_yn = $1
       WHERE user_id = $2
       RETURNING locked_yn`,
      [status, userId]
    );

    res.status(200).json({
      message: `User status updated to ${status === 'N' ? 'Active' : 'Deactivated'}`,
    });
  } catch (err) {
    console.error("Error toggling user status:", err);
    res.status(500).send("Failed to update user status");
  }
};

// Assign a role to a user
exports.assignRole = async (req, res) => {
  const { userId, roleId } = req.params;

  try {
    await pool.query(
      `INSERT INTO pp.user_role (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, roleId]
    );
    res.status(204).send("Role assigned successfully");
  } catch (err) {
    console.error("Error assigning role:", err);
    res.status(500).send("Error assigning role");
  }
};

// Remove a role from a user
exports.removeRole = async (req, res) => {
  const { userId, roleId } = req.params;

  try {
    await pool.query(
      `DELETE FROM pp.user_role
       WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );
    res.status(204).send("Role removed successfully");
  } catch (err) {
    console.error("Error removing role:", err);
    res.status(500).send("Error removing role");
  }
};

// Create a new role
exports.createRole = async (req, res) => {
  const { roleName, status } = req.body;

  if (!roleName || !roleName.trim()) {
    return res.status(400).send("Role name is required.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const roleCheck = await client.query(
      `SELECT role_name FROM pp.role WHERE role_name = $1`,
      [roleName]
    );

    if (roleCheck.rows.length > 0) {
      return res.status(400).send("Role already exists.");
    }

    await client.query(
      `INSERT INTO pp.role (role_name, active_yn) VALUES ($1, $2)`,
      [roleName.toUpperCase(), status || 'Y']
    );

    await client.query("COMMIT");
    res.status(201).json({ message: `Role "${roleName}" created successfully` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating role:", err);
    res.status(500).send("Failed to create role");
  } finally {
    client.release();
  }
};
