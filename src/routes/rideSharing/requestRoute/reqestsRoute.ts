import { Router } from "express";
import RequestController from "../../../controllers/rideSharing/requestController/requestController";
import RequestModel from "../../../models/rideSharing/requestModel";
import authMiddleware from "../../../middleware/authMiddleware";

const router = Router();

const requestController = new RequestController(new RequestModel());

router.post("/createRideSharingRequest",authMiddleware(),requestController.createRequest.bind(requestController));
router.get("/searchForNearByRequests",authMiddleware(), requestController.findNearbyRequests.bind(requestController));


module.exports = router;