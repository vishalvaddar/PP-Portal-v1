const express = require("express");
const router = express.Router();
const UserRolesController = require("../controllers/userRolesController");

router.get("/users", UserRolesController.getUsersWithRoles);
router.get("/roles", UserRolesController.getAllRoles);
router.post("/users", UserRolesController.createUserWithRoles);
router.put("/users/:userId", UserRolesController.updateUserWithRoles);
router.delete("/users/:userId", UserRolesController.deleteUser);
router.put("/users/:userId/status", UserRolesController.toggleUserStatus);
router.post("/users/:userId/roles/:roleId", UserRolesController.assignRole);
router.delete("/users/:userId/roles/:roleId", UserRolesController.removeRole);
router.post('/roles', UserRolesController.createRole);

module.exports = router;
