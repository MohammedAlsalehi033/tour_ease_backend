export {};


import AuthController from "../controllers/authController";
import AuthModel from "../models/authModel";

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware'); 

const router = express.Router();

const authController = new AuthController(new AuthModel);


// Public routes
router.post('/createUser', authController.createUser.bind(authController));
router.get('/getRole', authController.getRole.bind(authController));
router.post('/updateUserRole', authController.updateRole.bind(authController));
router.get('/getUserById', authController.getUserById.bind(authController));



// router.get('/questions/:id', questionController.getQuestionById);
// router.get('/questions/search', questionController.searchQuestions);

// // Protected routes (require authentication)
// router.post('/questions', authMiddleware, questionController.createQuestion);
// router.put('/questions/:id', authMiddleware, questionController.updateQuestion);
// router.delete('/questions/:id', authMiddleware, questionController.deleteQuestion);

module.exports = router;