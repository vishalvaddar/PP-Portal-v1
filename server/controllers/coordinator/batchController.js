// const { getBatchesByCohort } = require("../../models/coordinator/batchModel");

// const fetchBatches = async (req, res) => {
//   try {
//     if (!req.user || !req.user.user_id) {
//       return res.status(401).json({ error: "Unauthorized: User not found in request" });
//     }

//     const { cohort_number } = req.query;
//     const coordinator_id = req.user.user_id; // set by authenticate middleware
//     let batches = [];

//     if (cohort_number) {
//       batches = await getBatchesByCohort(cohort_number, coordinator_id);
//     }

//     res.json(batches);
//   } catch (err) {
//     console.error("Error fetching batches:", err);
//     res.status(500).json({ error: "Failed to fetch batches", details: err.message });
//   }
// };

// module.exports = { fetchBatches };



const { 
  getBatchesByCohort,
  getAllBatchesForCoordinator 
} = require("../../models/coordinator/batchModel");

const fetchBatches = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "Unauthorized: User not found in request" });
    }

    const { cohort_number } = req.query;
    const coordinator_id = req.user.user_id;

    let batches = [];

    if (cohort_number) {
      // OLD BEHAVIOR → used in Student Management filtering
      console.log("Fetching batches by cohort:", cohort_number);
      batches = await getBatchesByCohort(cohort_number, coordinator_id);
    } else {
      // NEW BEHAVIOR → Used in Dashboard UpcomingClasses
      console.log("Fetching ALL batches assigned to coordinator:", coordinator_id);
      batches = await getAllBatchesForCoordinator(coordinator_id);
    }

    res.json(batches);

  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ 
      error: "Failed to fetch batches", 
      details: err.message 
    });
  }
};

module.exports = { fetchBatches };
