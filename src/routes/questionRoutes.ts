import QuestionController from "../controllers/questionController";
import { PrismaQuestionModel } from "../models/question/questionModel";

export {};

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware'); 

const router = express.Router();

const questionController = new QuestionController(new PrismaQuestionModel);


// Public routes
router.get('/questions', questionController.getAllQuestions.bind(questionController));



// router.get('/questions/:id', questionController.getQuestionById);
// router.get('/questions/search', questionController.searchQuestions);

// // Protected routes (require authentication)
// router.post('/questions', authMiddleware, questionController.createQuestion);
// router.put('/questions/:id', authMiddleware, questionController.updateQuestion);
// router.delete('/questions/:id', authMiddleware, questionController.deleteQuestion);

module.exports = router;