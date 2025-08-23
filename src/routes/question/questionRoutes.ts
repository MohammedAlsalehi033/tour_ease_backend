import QuestionController from "../../controllers/question/questionController";
import authMiddleware from "../../middleware/authMiddleware";
import { PrismaQuestionModel } from "../../models/question/questionModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";

export {};

const express = require('express');
const router = express.Router();

const questionController = new QuestionController(new PrismaQuestionModel , new FileUploaderForS3);


router.get('/questions', questionController.getAllQuestions.bind(questionController));



router.get('/questions/search', questionController.searchQuestions.bind(questionController));
router.get('/questions/:id', questionController.getQuestionById.bind(questionController));

router.post('/questions',authMiddleware(["traveler"]), questionController.createQuestion.bind(questionController));
router.put('/questions/:id',authMiddleware(["traveler"]), questionController.updateQuestion.bind(questionController));
router.delete('/questions/:id',authMiddleware(["traveler"]), questionController.deleteQuestion.bind(questionController));
router.post('/questions/vote',authMiddleware(["traveler"]), questionController.voteQuestion.bind(questionController));
router.post('/questions/ai', questionController.askTheAI.bind(questionController));

module.exports = router;