import express from 'express';
import { AdminController } from '../../controllers/admin/adminController';
import { AdminModel } from '../../models/admin/adminModel';
import { FileUploaderForS3 } from '../../utils/FileUploader';

const router = express.Router();
const adminController = new AdminController(new AdminModel(), new FileUploaderForS3());

// Transportation Provider routes
router.get("/transportationProviders", adminController.getPendingTransportationProviders.bind(adminController));
router.get("/transportationProviders/:providerId", adminController.getTransportationProviderById.bind(adminController));
router.put("/transportationProviders/:providerId/status", adminController.updateTransportationProviderStatus.bind(adminController));

// Accommodation Provider routes
router.get("/accommodationProviders", adminController.getPendingAccommodationProviders.bind(adminController));
router.get("/accommodationProviders/:providerId", adminController.getAccommodationProviderById.bind(adminController));
router.put("/accommodationProviders/:providerId/status", adminController.updateAccommodationProviderStatus.bind(adminController));

module.exports = router;