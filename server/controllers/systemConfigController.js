const systemConfigModel = require("../models/systemConfigModel");

/* ==============================
   GET all configurations
============================== */
exports.getAllConfigs = async (req, res) => {
  try {
    const configs = await systemConfigModel.getAllConfigs();
    res.json(configs);
  } catch (err) {
    console.error("❌ Error fetching configs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* ==============================
   CREATE configuration
============================== */
exports.createConfig = async (req, res) => {
  try {
    const config = await systemConfigModel.createConfig(req.body);
    res.json(config);
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: `Academic year already exists.` });
    }
    console.error("❌ Error creating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* ==============================
   UPDATE configuration
============================== */
exports.editConfig = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "Invalid or missing config ID" });
  }

  try {
    const updated = await systemConfigModel.updateConfig(id, req.body);

    if (!updated) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    res.json(updated);
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: `Academic year already exists.` });
    }
    console.error("❌ Error updating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* ==============================
   DELETE configuration
============================== */
exports.deleteConfig = async (req, res) => {
  try {
    const deleted = await systemConfigModel.deleteConfig(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    res.json({ message: "Configuration deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* ==============================
   ACTIVATE configuration
============================== */
exports.activateConfig = async (req, res) => {
  try {
    const activated = await systemConfigModel.activateConfig(req.params.id);

    if (!activated) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    res.json(activated);
  } catch (err) {
    console.error("❌ Error activating config:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/* ==============================
   GET active configurations
============================== */
exports.getActiveConfigs = async (req, res) => {
  try {
    const configs = await systemConfigModel.getActiveConfigs();
    res.json(configs);
  } catch (err) {
    console.error("❌ Error fetching active configs:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
