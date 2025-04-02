import { Router } from "express";
import RequestController from "../../../controllers/rideSharing/requestController/requestController";
import RequestModel from "../../../models/rideSharing/requestModel";

const router = Router();

const requestController = new RequestController(new RequestModel());

router.post("/createRideSharingRequest", requestController.createRequest.bind(requestController));
router.get("/searchForNearByRequests", requestController.findNearbyRequests.bind(requestController));


module.exports = router;