import { SuperAdminController } from './../../../controllers/admin/superAdmin/superAdminController';
import express from 'express';

const router = express.Router();
const superAdminController = new SuperAdminController();

// User Management routes
router.get("/admins", superAdminController.getAllAdmins.bind(superAdminController));
router.post("/admins", superAdminController.addNewAdmin.bind(superAdminController));
router.delete("/admins/:id", superAdminController.removeAdmin.bind(superAdminController));
router.put("/admins/:id/status", superAdminController.toggleUserStatus.bind(superAdminController));
router.put("/admins/:id/permissions", superAdminController.changeAdminPermissions.bind(superAdminController));

module.exports = router;