const express = require("express");
const router = express.Router();
const controller = require("../controllers/userRolesController");

// Get all users with their roles
router.get("/users", controller.getUsersWithRoles);

// Get all available roles
router.get("/roles", controller.getAllRoles);

// Create a new user (used in handleSubmit)
router.post("/users", controller.createUserWithRoles);

// Update a user and roles (used in handleSaveEdit)
router.put("/users/:userId", controller.updateUserWithRoles);

// Delete a user (used in handleDelete)
router.delete("/users/:userId", controller.deleteUser);

module.exports = router;
