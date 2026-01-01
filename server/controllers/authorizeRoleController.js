const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authorizeRoleController = async (req, res) => {
  const { preAuthToken, selectedRole } = req.body;
  const clientIp = logger.constructor.getClientIp(req);

  if (!preAuthToken || !selectedRole) {
    return res.status(400).json({ error: 'Missing session token or role selection' });
  }

  try {
    // 1. Verify the Pre-Auth Token
    const decoded = jwt.verify(preAuthToken, process.env.JWT_SECRET);

    // 2. Ensure token type is correct (Security Check)
    if (decoded.type !== 'PRE_AUTH_ROLE_SELECT') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // 3. Verify the user actually has the requested role
    const allowedRoles = decoded.allowed_roles || [];
    const roleExists = allowedRoles.some(r => r.toUpperCase() === selectedRole.toUpperCase());

    if (!roleExists) {
      logger.logAction({
        user_name: decoded.user_name,
        action: 'role_auth',
        status: 'failed_unauthorized_role',
        ip: clientIp
      });
      return res.status(403).json({ error: 'You are not authorized for this role' });
    }

    // 4. Generate FINAL Access Token
    const finalToken = jwt.sign(
      {
        user_id: decoded.user_id,
        user_name: decoded.user_name,
        role_name: selectedRole
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    logger.logAction({
        user_name: decoded.user_name,
        role: selectedRole,
        action: 'login_complete',
        status: 'success',
        ip: clientIp
    });

    return res.status(200).json({
      message: 'Login complete',
      token: finalToken,
      user: {
        user_id: decoded.user_id,
        user_name: decoded.user_name,
        role_name: selectedRole
      }
    });

  } catch (err) {
    console.error('Auth Role Error:', err.message);
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }
};

module.exports = authorizeRoleController;