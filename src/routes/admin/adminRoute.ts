import express from 'express';
import { AdminController } from '../../controllers/admin/adminController';
import { AdminModel } from '../../models/admin/adminModel';
import { FileUploaderForS3 } from '../../utils/FileUploader';

const router = express.Router();
const adminModel = new AdminModel();
const fileUploader = new FileUploaderForS3();
const adminController = new AdminController(adminModel, fileUploader);

// User Management routes
router.get("/users/:id", adminController.getUserById.bind(adminController));
router.put("/users/:id/block", adminController.blockUser.bind(adminController));

// Transportation Provider routes
router.get("/transportationProviders", adminController.getPendingTransportationProviders.bind(adminController));
router.get("/transportationProviders/:providerId", adminController.getTransportationProviderById.bind(adminController));
router.put("/transportationProviders/:providerId/status", adminController.updateTransportationProviderStatus.bind(adminController));

// Accommodation Provider routes
router.get("/accommodationProviders", adminController.getPendingAccommodationProviders.bind(adminController));
router.get("/accommodationProviders/:providerId", adminController.getAccommodationProviderById.bind(adminController));
router.put("/accommodationProviders/:providerId/status", adminController.updateAccommodationProviderStatus.bind(adminController));

module.exports = router;