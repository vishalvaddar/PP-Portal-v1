// userRolesController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");

// Get all users with their roles
exports.getUsersWithRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.user_id AS id,
        u.user_name AS username,
        u.locked_yn AS status,   -- Return 'N' or 'Y' directly
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

// Get all roles
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

    // Check if username already exists
    const userCheck = await client.query(
      `SELECT user_id FROM pp.user WHERE user_name = $1`,
      [username]
    );

    if (userCheck.rows.length > 0) {
      await client.query("ROLLBACK"); // Rollback the transaction before sending error
      return res.status(409).send("Username already exists."); // 409 Conflict
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
          `SELECT role_id FROM pp.role WHERE role_name = $1`,
          [roleName]
        );
        if (roleRes.rows.length > 0) {
          const roleId = roleRes.rows[0].role_id;
          await client.query(
            `INSERT INTO pp.user_role (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`, // Prevents inserting duplicate user-role
            [userId, roleId]
          );
        }
        // else {
        //   // Option: Handle non-existent role names here, e.g., log a warning
        //   // or return an error if all roles must exist.
        // }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: `User "${username}" created successfully`, userId });
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

  if (!username) {
    return res.status(400).send("Username is required.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if another user already has this username (excluding the current user being updated)
    const userCheck = await client.query(
      `SELECT user_id FROM pp.user WHERE user_name = $1 AND user_id != $2`,
      [username, userId]
    );

    if (userCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).send("Username already taken by another user.");
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const updateQuery = `
      UPDATE pp.user
      SET user_name = $1, enc_password = COALESCE($2, enc_password)
      WHERE user_id = $3
      RETURNING user_id;
    `;
    const result = await client.query(
      updateQuery,
      [username, hashedPassword, userId]
    );

    if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).send("User not found for update.");
    }

    // Delete existing roles for the user
    await client.query(`DELETE FROM pp.user_role WHERE user_id = $1`, [userId]);

    // Insert new roles
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
    res.status(200).json({ message: "User updated successfully" }); // Changed to 200 as body might be sent by some implementations, 204 means no content.
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
    // Delete from user_role first due to potential foreign key constraints
    await client.query(`DELETE FROM pp.user_role WHERE user_id = $1`, [userId]);
    const result = await client.query(`DELETE FROM pp.user WHERE user_id = $1 RETURNING user_id`, [userId]);

    if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).send("User not found for deletion.");
    }

    await client.query("COMMIT");
    res.status(204).send(); // 204 No Content, no body
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting user:", err);
    res.status(500).send("Failed to delete user");
  } finally {
    client.release();
  }
};

// Toggle user activation status (locked_yn)
exports.toggleUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body; // Expecting 'N' (active) or 'Y' (deactivated/locked)

  if (!status || (status !== 'N' && status !== 'Y')) {
    return res.status(400).send("Invalid status provided. Must be 'N' or 'Y'.");
  }

  try {
    const result = await pool.query(
      `UPDATE pp.user
       SET locked_yn = $1
       WHERE user_id = $2
       RETURNING user_id, user_name, locked_yn`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("User not found.");
    }

    res.status(200).json({
      message: `User status updated to ${status === 'N' ? 'Active' : 'Deactivated'}`,
      user: {
        id: result.rows[0].user_id,
        username: result.rows[0].user_name,
        status: result.rows[0].locked_yn
      }
    });
  } catch (err) {
    console.error("Error toggling user status:", err);
    res.status(500).send("Failed to update user status");
  }
};

// Assign a role to a user (This might not be directly used by your current frontend, but is a valid endpoint)
exports.assignRole = async (req, res) => {
  const { userId, roleId } = req.params;

  try {
    // Validate if userId and roleId exist before attempting insert (optional but good practice)
    const userExists = await pool.query(`SELECT 1 FROM pp.user WHERE user_id = $1`, [userId]);
    const roleExists = await pool.query(`SELECT 1 FROM pp.role WHERE role_id = $1`, [roleId]);

    if (userExists.rows.length === 0) {
      return res.status(404).send("User not found.");
    }
    if (roleExists.rows.length === 0) {
      return res.status(404).send("Role not found.");
    }

    await pool.query(
      `INSERT INTO pp.user_role (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING`, // Ensures uniqueness and prevents error if already exists
      [userId, roleId]
    );
    res.status(200).json({ message: "Role assigned successfully" });
  } catch (err) {
    console.error("Error assigning role:", err);
    res.status(500).send("Error assigning role");
  }
};

// Remove a role from a user (This might not be directly used by your current frontend, but is a valid endpoint)
exports.removeRole = async (req, res) => {
  const { userId, roleId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM pp.user_role
       WHERE user_id = $1 AND role_id = $2
       RETURNING user_id`,
      [userId, roleId]
    );

    if (result.rows.length === 0) {
        return res.status(404).send("User-role assignment not found.");
    }

    res.status(200).json({ message: "Role removed successfully" });
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
      `SELECT role_id FROM pp.role WHERE UPPER(role_name) = UPPER($1)`,
      [roleName.trim()]
    );

    if (roleCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).send("Role name already exists.");
    }

    // Default status to 'N' (active) if not provided or invalid
    const defaultStatus = (status === 'N' || status === 'Y') ? status : 'N';

    const result = await client.query(
      `INSERT INTO pp.role (role_name, active_yn)
       VALUES ($1, $2)
       RETURNING role_id, role_name, active_yn`,
      [roleName.trim().toUpperCase(), defaultStatus]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: `Role "${roleName.trim().toUpperCase()}" created successfully`,
      role: result.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating role:", err);
    res.status(500).send("Failed to create role");
  } finally {
    client.release();
  }
};

// NEW: Toggle role activation status (active_yn)
exports.toggleRoleStatus = async (req, res) => {
  const { roleId } = req.params;
  const { status } = req.body; // Expecting 'N' (active) or 'Y' (deactivated)

  if (!status || (status !== 'N' && status !== 'Y')) {
    return res.status(400).send("Invalid status provided. Must be 'N' or 'Y'.");
  }

  try {
    const result = await pool.query(
      `UPDATE pp.role
       SET active_yn = $1
       WHERE role_id = $2
       RETURNING role_id, role_name, active_yn`, // Return updated data
      [status, roleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Role not found.");
    }

    res.status(200).json({
      message: `Role "${result.rows[0].role_name}" status updated to ${status === 'N' ? 'Active' : 'Deactivated'}`,
      role: {
        id: result.rows[0].role_id,
        roleName: result.rows[0].role_name,
        status: result.rows[0].active_yn
      }
    });
  } catch (err) {
    console.error("Error toggling role status:", err);
    res.status(500).send("Failed to update role status");
  }
};

exports.updateUsername = async (req, res) => {
  const { userId } = req.params;
  const username = req.body.username?.trim();

  if (!username) {
    return res.status(400).send("Username is required.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkUser = await client.query(
      "SELECT * FROM pp.user WHERE user_id = $1",
      [userId]
    );
    if (checkUser.rowCount === 0) {
      return res.status(404).send("User not found.");
    }

    const checkDuplicate = await client.query(
      "SELECT * FROM pp.user WHERE user_name = $1 AND user_id != $2",
      [username, userId]
    );
    if (checkDuplicate.rowCount > 0) {
      return res.status(409).send("Username already taken.");
    }

    await client.query(
      "UPDATE pp.user SET user_name = $1 WHERE user_id = $2",
      [username, userId]
    );

    await client.query("COMMIT");
    res.sendStatus(200);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update error:", err);
    res.status(500).send("Server error.");
  } finally {
    client.release();
  }
};


exports.updatePassword = async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) return res.status(400).json({ message: " Current and new passwords are required"});

  const client = await pool.connect();
  try {
    const userQuery = "SELECT enc_password FROM pp.user WHERE user_id = $1";
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rowCount === 0) return res.status(404).json({ message: "User not found" });
    const storedHash = userResult.rows[0].enc_password;

    const passwordMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!passwordMatch) return res.status(401).json({ message: "Current password is incorrect."});

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const updateQuery = "UPDATE pp.user SET enc_password = $1 WHERE user_id = $2";
    await client.query(updateQuery, [newHashedPassword, userId]);

    res.status(200).json({ message: "Password updated successfully." });

  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ message: "Internal server error." });
  } finally {
    client.release();
  }
};