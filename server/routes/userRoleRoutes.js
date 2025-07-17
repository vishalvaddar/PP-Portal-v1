// routes/userRoles.js
const express = require("express");
const router = express.Router();
const UserRolesController = require("../controllers/userRolesController"); // Corrected path if needed

// User Routes
router.get("/users", UserRolesController.getUsersWithRoles);
router.post("/users", UserRolesController.createUserWithRoles);
router.put("/users/:userId", UserRolesController.updateUserWithRoles);
router.delete("/users/:userId", UserRolesController.deleteUser);
router.put("/users/:userId/status", UserRolesController.toggleUserStatus);

// Role Routes
router.get("/roles", UserRolesController.getAllRoles);
router.post("/roles", UserRolesController.createRole);
router.put("/roles/:roleId/status", UserRolesController.toggleRoleStatus); // ADDED: Route for toggling role status

// These might not be directly used by your current frontend, but are valid for granular control
router.post("/users/:userId/roles/:roleId", UserRolesController.assignRole);
router.delete("/users/:userId/roles/:roleId", UserRolesController.removeRole);


module.exports = router;