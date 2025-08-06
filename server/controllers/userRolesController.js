// userRolesController.js

const pool = require("../config/db");
const bcrypt = require("bcrypt");

/**
 * @description Get all users with their assigned roles.
 * @route GET /api/users
 */
exports.getUsersWithRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id AS id,
        u.user_name AS username,
        u.locked_yn AS status, -- 'N' for active, 'Y' for locked/deactivated
        ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles
      FROM pp.user u
      LEFT JOIN pp.user_role ur ON u.user_id = ur.user_id
      LEFT JOIN pp.role r ON ur.role_id = r.role_id
      GROUP BY u.user_id
      ORDER BY u.user_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users with roles:", err);
    res.status(500).json({ message: "Error fetching users with roles" });
  }
};

/**
 * @description Get all available roles.
 * @route GET /api/roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT role_id AS id, role_name, active_yn AS status
      FROM pp.role
      ORDER BY role_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ message: "Error fetching roles" });
  }
};

/**
 * @description Create a new user and assign roles.
 * @route POST /api/users
 */
exports.createUserWithRoles = async (req, res) => {
  const { username, password, roles } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userCheck = await client.query(
      `SELECT user_id FROM pp.user WHERE user_name = $1`,
      [username]
    );

    if (userCheck.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userInsert = await client.query(
      `INSERT INTO pp.user (user_name, enc_password, locked_yn)
       VALUES ($1, $2, 'N') -- 'N' for active by default
       RETURNING user_id`,
      [username, hashedPassword]
    );
    const userId = userInsert.rows[0].user_id;

    if (Array.isArray(roles) && roles.length > 0) {
      const uniqueRoles = [...new Set(roles.map(r => r.trim()))];
      for (const roleName of uniqueRoles) {
        const roleRes = await client.query(
          `SELECT role_id FROM pp.role WHERE role_name = $1 AND active_yn = 'Y'`,
          [roleName]
        );
        if (roleRes.rowCount > 0) {
          const roleId = roleRes.rows[0].role_id;
          await client.query(
            `INSERT INTO pp.user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, roleId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: `User "${username}" created successfully`, userId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating user with roles:", err);
    res.status(500).json({ message: "Failed to create user" });
  } finally {
    client.release();
  }
};

/**
 * @description Update a user's username, password (optional), and roles.
 * @route PUT /api/users/:userId
 */
exports.updateUserWithRoles = async (req, res) => {
  const { userId } = req.params;
  const { username, password, roles } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userCheck = await client.query(
      `SELECT user_id FROM pp.user WHERE user_name = $1 AND user_id != $2`,
      [username, userId]
    );

    if (userCheck.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Username already taken by another user." });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    await client.query(
      `UPDATE pp.user SET user_name = $1, enc_password = COALESCE($2, enc_password) WHERE user_id = $3`,
      [username, hashedPassword, userId]
    );

    await client.query(`DELETE FROM pp.user_role WHERE user_id = $1`, [userId]);
    if (Array.isArray(roles) && roles.length > 0) {
      const uniqueRoles = [...new Set(roles.map(r => r.trim()))];
      for (const roleName of uniqueRoles) {
        const roleRes = await client.query(
          `SELECT role_id FROM pp.role WHERE role_name = $1 AND active_yn = 'Y'`,
          [roleName]
        );
        if (roleRes.rowCount > 0) {
          const roleId = roleRes.rows[0].role_id;
          await client.query(
            `INSERT INTO pp.user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [userId, roleId]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Failed to update user" });
  } finally {
    client.release();
  }
};

/**
 * @description Delete a user.
 * @route DELETE /api/users/:userId
 */
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM pp.user_role WHERE user_id = $1`, [userId]);
    const result = await client.query(`DELETE FROM pp.user WHERE user_id = $1`, [userId]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found." });
    }

    await client.query("COMMIT");
    res.status(204).send();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Failed to delete user" });
  } finally {
    client.release();
  }
};

/**
 * @description Toggle a user's status between 'N' (active) and 'Y' (deactivated).
 * @route PUT /api/users/:userId/status
 */
exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || !['Y', 'N'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be 'Y' or 'N'." });
  }

  try {
    const result = await pool.query(
      `UPDATE pp.user SET locked_yn = $1 WHERE user_id = $2 RETURNING *`,
      [status, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: `User status updated successfully.`,
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Error toggling user status:", err);
    res.status(500).json({ message: "Failed to update user status" });
  }
};

/**
 * @description Create a new role.
 * @route POST /api/roles
 */
exports.createRole = async (req, res) => {
  const { roleName } = req.body;

  if (!roleName || !roleName.trim()) {
    return res.status(400).json({ message: "Role name is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const formattedRoleName = roleName.trim().toUpperCase();
    const roleCheck = await client.query(
      `SELECT role_id FROM pp.role WHERE role_name = $1`,
      [formattedRoleName]
    );

    if (roleCheck.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Role name already exists." });
    }

    const result = await client.query(
      `INSERT INTO pp.role (role_name, active_yn) VALUES ($1, 'Y') RETURNING *`,
      [formattedRoleName]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: `Role "${formattedRoleName}" created successfully`,
      role: result.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating role:", err);
    res.status(500).json({ message: "Failed to create role" });
  } finally {
    client.release();
  }
};

/**
 * @description Delete a role if it is not in use.
 * @route DELETE /api/roles/:roleId
 */
exports.deleteRole = async (req, res) => {
  const { roleId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usageCheck = await client.query('SELECT 1 FROM pp.user_role WHERE role_id = $1 LIMIT 1', [roleId]);
    if (usageCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Cannot delete role: It is currently assigned to one or more users." });
    }
    
    const deleteResult = await client.query('DELETE FROM pp.role WHERE role_id = $1', [roleId]);
    if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: "Role not found." });
    }

    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error deleting role:", err);
    res.status(500).json({ message: "Server error while deleting the role" });
  } finally {
    client.release();
  }
};

/**
 * @description Toggle a role's status between 'Y' (active) and 'N' (deactivated).
 * @route PUT /api/roles/:roleId/status
 */
exports.toggleRoleStatus = async (req, res) => {
    const { roleId } = req.params;
    const { status } = req.body;
  
    if (!status || !['Y', 'N'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'Y' or 'N'." });
    }
  
    try {
      const result = await pool.query(
        `UPDATE pp.role SET active_yn = $1 WHERE role_id = $2 RETURNING *`,
        [status, roleId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Role not found." });
      }
  
      res.status(200).json({
        message: `Role status updated successfully.`,
        role: result.rows[0]
      });
    } catch (err) {
      console.error("Error toggling role status:", err);
      res.status(500).json({ message: "Failed to update role status" });
    }
  };

/**
 * @description Assign a role to a user.
 * @route POST /api/users/:userId/roles/:roleId
 */
exports.assignRole = async (req, res) => {
  const { userId, roleId } = req.params;
  try {
    // Optional: Check if user and role exist before assigning
    const userExists = await pool.query(`SELECT 1 FROM pp.user WHERE user_id = $1`, [userId]);
    if (userExists.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    const roleExists = await pool.query(`SELECT 1 FROM pp.role WHERE role_id = $1`, [roleId]);
    if (roleExists.rowCount === 0) {
      return res.status(404).json({ message: "Role not found." });
    }

    // Insert the user-role relationship, ignoring if it already exists
    await pool.query(
      `INSERT INTO pp.user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );
    res.status(200).json({ message: "Role assigned successfully." });
  } catch (err) {
    console.error("Error assigning role:", err);
    res.status(500).json({ message: "Server error while assigning role." });
  }
};

/**
 * @description Remove a role from a user.
 * @route DELETE /api/users/:userId/roles/:roleId
 */
exports.removeRole = async (req, res) => {
  const { userId, roleId } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM pp.user_role WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User-role assignment not found." });
    }
    res.status(200).json({ message: "Role removed successfully." });
  } catch (err) {
    console.error("Error removing role:", err);
    res.status(500).json({ message: "Server error while removing role." });
  }
};

/**
 * @description Update a user's username.
 * @route PUT /api/user/change-username/:userId
 */
exports.updateUsername = async (req, res) => {
    const { userId } = req.params;
    const { username } = req.body;

    if (!username || !username.trim()) {
        return res.status(400).json({ message: "Username is required." });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const checkDuplicate = await client.query(
            "SELECT user_id FROM pp.user WHERE user_name = $1 AND user_id != $2",
            [username.trim(), userId]
        );

        if (checkDuplicate.rowCount > 0) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "Username already taken." });
        }

        const result = await client.query(
            "UPDATE pp.user SET user_name = $1 WHERE user_id = $2 RETURNING user_id",
            [username.trim(), userId]
        );

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "User not found." });
        }

        await client.query("COMMIT");
        res.status(200).json({ message: "Username updated successfully." });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error updating username:", err);
        res.status(500).json({ message: "Server error while updating username." });
    } finally {
        client.release();
    }
};

/**
 * @description Update a user's password after verifying the current one.
 * @route PUT /api/user/change-password/:userId
 */
exports.updatePassword = async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required." });
    }

    const client = await pool.connect();
    try {
        const userResult = await client.query("SELECT enc_password FROM pp.user WHERE user_id = $1", [userId]);

        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const storedHash = userResult.rows[0].enc_password;
        const passwordMatch = await bcrypt.compare(currentPassword, storedHash);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Current password is not correct." });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await client.query("UPDATE pp.user SET enc_password = $1 WHERE user_id = $2", [newHashedPassword, userId]);

        res.status(200).json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Error updating password:", err);
        res.status(500).json({ message: "Server error while updating password." });
    } finally {
        client.release();
    }
};
