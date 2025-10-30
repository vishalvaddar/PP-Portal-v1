const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger utility for tracking user activities and system events
 */
class Logger {
  constructor() {
    this.logFilePath = path.join(logsDir, `activity-${format(new Date(), 'yyyy-MM-dd')}.log`);
  }

  /**
   * Log user login activity
   * @param {Object} data - Login data
   * @param {string} data.user_name - Username
   * @param {string} data.user_id - User ID
   * @param {string} data.role_name - Role name
   * @param {string} data.status - Login status (success/failed)
   * @param {string} data.ip - IP address
   */
  logLogin(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'LOGIN',
      ...data
    };
    this.writeLog(logEntry);
  }

  /**
   * Log user actions
   * @param {Object} data - Action data
   * @param {string} data.user_id - User ID
   * @param {string} data.user_name - Username
   * @param {string} data.role_name - Role name
   * @param {string} data.action - Action performed
   * @param {string} data.resource - Resource affected
   * @param {Object} data.details - Additional details
   * @param {string} data.ip - IP address
   */
  logAction(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ACTION',
      ...data
    };
    this.writeLog(logEntry);
  }

  /**
   * Write log entry to file
   * @param {Object} logEntry - Log entry object
   */
  writeLog(logEntry) {
    try {
      const logString = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this.logFilePath, logString);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Get client IP address from request
   * @param {Object} req - Express request object
   * @returns {string} IP address
   */
  static getClientIp(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
  }
}

module.exports = new Logger();