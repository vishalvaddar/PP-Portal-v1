// controllers/coordinator/cohortController.js
const { getCohortsByUser } = require("../../models/coordinator/cohortModel");

const fetchCohorts = async (req, res) => {
  try {
    // user info should be injected by your JWT auth middleware
    const userId = req.user.user_id;

    const cohorts = await getCohortsByUser(userId);
    res.json(cohorts);
  } catch (err) {
    console.error("Error fetching cohorts:", err);
    res.status(500).json({ error: "Failed to fetch cohorts" });
  }
};

module.exports = { fetchCohorts };
