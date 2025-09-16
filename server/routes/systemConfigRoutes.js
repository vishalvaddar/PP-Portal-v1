const express = require("express");
const router = express.Router();
const SystemConfigController = require("../controllers/systemConfigController");

router.get("/all", SystemConfigController.getAllConfigs);

router.post("/", SystemConfigController.createConfig);

router.put("/:id/activate", SystemConfigController.activateConfig);

router.delete("/:id", SystemConfigController.deleteConfig);

router.get("/active", SystemConfigController.getActiveConfig);

module.exports = router;
