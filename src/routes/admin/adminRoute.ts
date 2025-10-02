import express from 'express';
import { AdminController } from '../../controllers/admin/adminController';
import { AdminModel } from '../../models/admin/adminModel';
import { FileUploaderForS3 } from '../../utils/FileUploader';
import adminMiddleware from '../../middleware/adminsMiddleware';

const router = express.Router();
const adminModel = new AdminModel();
const fileUploader = new FileUploaderForS3();
const adminController = new AdminController(adminModel, fileUploader);

// User Management routes
router.get("/users/:id",adminMiddleware(["Manage Users"]), adminController.getUserById.bind(adminController));
router.put("/users/:id/block",adminMiddleware(["Manage Users"]), adminController.blockUser.bind(adminController));
router.put("/users/:id/unblock", adminMiddleware(["Manage Users"]), adminController.unblockUser.bind(adminController));

// Transportation Provider routes
router.get("/transportationProviders", adminMiddleware(["Manage Providers"]), adminController.getPendingTransportationProviders.bind(adminController));
router.get("/transportationProviders/:providerId", adminMiddleware(["Manage Providers"]), adminController.getTransportationProviderById.bind(adminController));
router.put("/transportationProviders/:providerId/status", adminMiddleware(["Manage Providers"]), adminController.updateTransportationProviderStatus.bind(adminController));

// Accommodation Provider routes
router.get("/accommodationProviders", adminMiddleware(["Manage Providers"]), adminController.getPendingAccommodationProviders.bind(adminController));
router.get("/accommodationProviders/:providerId", adminMiddleware(["Manage Providers"]), adminController.getAccommodationProviderById.bind(adminController));
router.put("/accommodationProviders/:providerId/status", adminMiddleware(["Manage Providers"]), adminController.updateAccommodationProviderStatus.bind(adminController));

module.exports = router;

//  permissions: [
//     'Manage Users',
//     'View Reports',
//     'Manage Providers',
//     'Edit Content',
//     'Delete Content',
//     'Access Analytics',
//     'Super Admin'
//   ],