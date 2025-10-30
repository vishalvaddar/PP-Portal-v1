// middleware/loggingMiddleware.js
const logger = require('../utils/logger');

/**
 * Middleware to log user actions
 * @param {Object} options - Configuration options
 * @param {boolean} options.logBody - Whether to log request body
 * @param {boolean} options.logQuery - Whether to log query parameters
 * @param {Array} options.excludePaths - Paths to exclude from logging
 */
const actionLogger = (options = {}) => {
  const {
    logBody = false,
    logQuery = false,
    excludePaths = ['/auth/login', '/auth/authorize-role'] // Already logged in controllers
  } = options;

  return (req, res, next) => {
    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Skip logging for GET requests to static files
    if (req.method === 'GET' && (
      req.path.endsWith('.js') || 
      req.path.endsWith('.css') || 
      req.path.endsWith('.png') || 
      req.path.endsWith('.jpg') || 
      req.path.endsWith('.svg')
    )) {
      return next();
    }

    const clientIp = logger.constructor.getClientIp(req);
    
    // Try to get user from session if not in request
    let user = req.user;
    
    // Check for JWT token in Authorization header if no user in request
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
          // Invalid token or other error, continue with anonymous
        }
      }
    }
    
    // Use empty object if still no user
    user = user || {};
    
    // Prepare log data
    const logData = {
      user_id: user.user_id || 'anonymous',
      user_name: user.user_name || 'anonymous',
      role_name: user.role_name || 'anonymous',
      method: req.method,
      path: req.path,
      action: `${req.method} ${req.path}`,
      ip: clientIp
    };

    // Add request body if enabled and exists
    if (logBody && req.body && Object.keys(req.body).length > 0) {
      // Filter out sensitive data
      const filteredBody = { ...req.body };
      if (filteredBody.password) filteredBody.password = '[FILTERED]';
      if (filteredBody.enc_password) filteredBody.enc_password = '[FILTERED]';
      
      logData.details = { body: filteredBody };
    }

    // Add query parameters if enabled and exists
    if (logQuery && req.query && Object.keys(req.query).length > 0) {
      logData.details = { 
        ...logData.details,
        query: req.query 
      };
    }

    // Log the action
    logger.logAction(logData);

    // Capture response data
    const originalSend = res.send;
    res.send = function(body) {
      // Log response status
      logData.status = res.statusCode;
      
      // For error responses, log more details
      if (res.statusCode >= 400) {
        try {
          const parsedBody = JSON.parse(body);
          logData.error = parsedBody.error || parsedBody.message;
        } catch (e) {
          // If body is not JSON, ignore
        }
        
        // Log the error
        logger.logAction({
          ...logData,
          status: 'error',
          details: {
            ...logData.details,
            statusCode: res.statusCode
          }
        });
      }
      
      originalSend.call(this, body);
      return this;
    };

    next();
  };
};

module.exports = actionLogger;