import { CommentController } from "../../../controllers/question/comment/commentController";
import { PrisnaCommentModel } from "../../../models/question/comment/commentModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";

export {};

const express = require('express');
const router = express.Router();

const commentController = new CommentController(new PrisnaCommentModel , new FileUploaderForS3);


router.get("/commments" ,commentController.getAllCommentsForQuestion.bind(commentController));
router.delete('/comments/:id' , commentController.deleteComment.bind(commentController))
router.post("/commments" ,commentController.createComment.bind(commentController));



module.exports = router;