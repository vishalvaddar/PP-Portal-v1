const express = require("express");
const router = express.Router();
const SystemConfigController = require("../controllers/systemConfigController");

// Get all configs
router.get("/all", SystemConfigController.getAllConfigs);

// Create a config
router.post("/", SystemConfigController.createConfig);

// Activate a config (optional)
router.put("/:id/activate", SystemConfigController.activateConfig);

// Edit ALL config fields
router.put("/:id", SystemConfigController.editConfig);

// Delete a config
router.delete("/:id", SystemConfigController.deleteConfig);

// Get all active configs
router.get("/active", SystemConfigController.getActiveConfigs);

module.exports = router;
