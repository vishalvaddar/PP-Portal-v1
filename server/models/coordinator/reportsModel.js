// server/models/coordinator/reportsModel.js
const pool = require("../../config/db"); // adjust path to your actual db file

const ReportsModel = {
  async query(sql, params) {
    return pool.query(sql, params);
  },
};

module.exports = { ReportsModel };
