import QuestionController from "../../controllers/question/questionController";
import { PrismaQuestionModel } from "../../models/question/questionModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";

export {};

const express = require('express');
const router = express.Router();

const questionController = new QuestionController(new PrismaQuestionModel , new FileUploaderForS3);


router.get('/questions', questionController.getAllQuestions.bind(questionController));



router.get('/questions/:id', questionController.getQuestionById.bind(questionController));
router.get('/questions/search', questionController.searchQuestions.bind(questionController));

router.post('/questions', questionController.createQuestion.bind(questionController));
router.put('/questions/:id', questionController.updateQuestion.bind(questionController));
router.delete('/questions/:id', questionController.deleteQuestion.bind(questionController));
router.post('/questions/vote', questionController.voteQuestion.bind(questionController));

module.exports = router;