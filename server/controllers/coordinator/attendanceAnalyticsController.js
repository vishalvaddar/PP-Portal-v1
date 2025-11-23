const pool = require("../../config/db");
const attendanceModel = require("../../models/coordinator/attendanceModel");

// ---------------------------------------------
// Weekly Batch Average Attendance (Previous Week)
// ---------------------------------------------
exports.getBatchWeeklyAverage = async (req, res) => {
  try {
    const coordinator_id = req.user.user_id;

    // 1️⃣ Fetch batches assigned to this coordinator
    const batchQuery = `
      SELECT 
        b.batch_id,
        b.batch_name,
        c.cohort_name
      FROM pp.batch b
      JOIN pp.cohort c ON b.cohort_number = c.cohort_number
      JOIN pp.batch_coordinator_batches bcb 
        ON b.batch_id = bcb.batch_id
      WHERE bcb.user_id = $1;
    `;

    const { rows: batches } = await pool.query(batchQuery, [coordinator_id]);

    // 2️⃣ Compute previous week's Monday → Sunday
    const today = new Date();
    const day = today.getDay(); // Sunday = 0

    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - day);

    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);

    const fromDate = lastMonday.toISOString().split("T")[0];
    const toDate = lastSunday.toISOString().split("T")[0];

    const results = [];

    // 3️⃣ For each batch → fetch avg attendance
    for (const b of batches) {
      const avg = await attendanceModel.getWeeklyBatchAverage(
        b.batch_id,
        fromDate,
        toDate
      );

      results.push({
        batch_id: b.batch_id,
        batch_name: b.batch_name,
        cohort_name: b.cohort_name,
        avg_attendance: avg
      });
    }

    return res.json(results);

  } catch (err) {
    console.error("getBatchWeeklyAverage ERROR:", err);
    return res.status(500).json({ error: "Failed to load weekly attendance" });
  }
};
