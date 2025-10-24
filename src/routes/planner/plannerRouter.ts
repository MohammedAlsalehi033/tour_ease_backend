// In your router file (e.g., routes/planRoutes.js)
import express from 'express';
import { generatePlan } from '../../controllers/planner/plannerController';


const router = express.Router();

// The user provides their trip requirements in the request body
router.post('/generate', generatePlan);

module.exports = router ;
