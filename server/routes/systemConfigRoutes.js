const express = require("express");
const router = express.Router();
const SystemConfigController = require("../controllers/systemConfigController");

// Get all configs
router.get("/all", SystemConfigController.getAllConfigs);

// Create a config
router.post("/", SystemConfigController.createConfig);

// Activate a config
router.put("/:id/activate", SystemConfigController.activateConfig);

// Edit ALL config fields (new route)
router.put("/:id", SystemConfigController.editConfig);

// Delete a config
router.delete("/:id", SystemConfigController.deleteConfig);

// Get the currently active config
router.get("/active", SystemConfigController.getActiveConfig);

module.exports = router;
