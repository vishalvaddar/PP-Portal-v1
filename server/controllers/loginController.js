const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// If using Node < 18 → uncomment below
// const fetch = require("node-fetch");

const loginController = async (req, res) => {
  const { user_name, password, captchaToken } = req.body;
  const clientIp = logger.constructor.getClientIp(req);

  // ✅ Basic Validation
  if (!user_name || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!captchaToken) {
    return res.status(400).json({ error: 'CAPTCHA token is missing' });
  }

  try {
    // ======================================================
    // ✅ CAPTCHA VERIFICATION (FIXED)
    // ======================================================
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET_KEY);
    params.append("response", captchaToken);

    const captchaVerifyRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      }
    );

    const captchaData = await captchaVerifyRes.json();

    // 🔥 DEBUG LOG (REMOVE IN PROD)
    console.log("CAPTCHA DEBUG:", captchaData);

    if (!captchaData.success) {
      logger.logLogin({
        user_name,
        status: 'failed',
        reason: `captcha_failed: ${JSON.stringify(captchaData)}`,
        ip: clientIp
      });

      return res.status(400).json({
        error: 'CAPTCHA verification failed. Please try again.',
      });
    }

    // Optional (extra strict check)
    // if (captchaData.score && captchaData.score < 0.3) {
    //   return res.status(400).json({ error: 'Low CAPTCHA score' });
    // }

    // ======================================================
    // ✅ FETCH USER & ROLES
    // ======================================================
    const query = `
      SELECT u.user_id, u.user_name, u.enc_password, u.locked_yn, r.role_name
      FROM pp.user u
      JOIN pp.user_role ur ON u.user_id = ur.user_id
      JOIN pp.role r ON ur.role_id = r.role_id
      WHERE LOWER(u.user_name) = LOWER($1) AND r.active_yn = 'Y';
    `;

    const result = await pool.query(query, [user_name]);

    // Prevent enumeration
    if (result.rows.length === 0) {
      logger.logLogin({
        user_name,
        status: 'failed',
        reason: 'user_not_found',
        ip: clientIp
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // ======================================================
    // ✅ ACCOUNT LOCK CHECK
    // ======================================================
    if (user.locked_yn === 'Y') {
      return res.status(403).json({ error: 'Account is locked. Contact support.' });
    }

    // ======================================================
    // ✅ PASSWORD VERIFY
    // ======================================================
    const isMatch = await bcrypt.compare(password, user.enc_password);

    if (!isMatch) {
      logger.logLogin({
        user_name,
        status: 'failed',
        reason: 'bad_password',
        ip: clientIp
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ======================================================
    // ✅ EXTRACT ROLES
    // ======================================================
    const roles = result.rows.map(row => row.role_name);

    // ======================================================
    // ✅ PRE-AUTH TOKEN
    // ======================================================
    const preAuthToken = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        type: 'PRE_AUTH_ROLE_SELECT',
        allowed_roles: roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    logger.logLogin({
      user_name,
      status: 'success_pre_auth',
      ip: clientIp
    });

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