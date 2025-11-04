import adminMiddleware from '../../../middleware/adminsMiddleware';
import { SuperAdminController } from './../../../controllers/admin/superAdmin/superAdminController';
import express from 'express';

const router = express.Router();
const superAdminController = new SuperAdminController();

// User Management routes
router.get("/admins",adminMiddleware(["Super Admin"]), superAdminController.getAllAdmins.bind(superAdminController));
router.post("/admins", adminMiddleware(["Super Admin"]), superAdminController.addNewAdmin.bind(superAdminController));
router.delete("/admins/:id", adminMiddleware(["Super Admin"]), superAdminController.removeAdmin.bind(superAdminController));
router.put("/admins/:id/status", adminMiddleware(["Super Admin"]), superAdminController.toggleUserStatus.bind(superAdminController));
router.put("/admins/:id/permissions", adminMiddleware(["Super Admin"]), superAdminController.changeAdminPermissions.bind(superAdminController));

module.exports = router;