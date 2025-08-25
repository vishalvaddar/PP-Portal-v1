// routes/userRoleRoutes.js
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
router.delete("/roles/:roleId", UserRolesController.deleteRole);
router.put("/roles/:roleId/status", UserRolesController.toggleRoleStatus);

router.post("/users/:userId/roles/:roleId", UserRolesController.assignRole);
router.delete("/users/:userId/roles/:roleId", UserRolesController.removeRole);

//Username and Password update route for MyProfile Page
router.put("/user/change-username/:userId", UserRolesController.updateUsername)
router.put("/user/change-password/:userId", UserRolesController.updatePassword)



module.exports = router;