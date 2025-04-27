import { PrisnaCommentModel } from "../../../models/question/comment/commentModel";
import { FileUploaderForS3 } from "../../../utils/FileUploader";

 export class CommentController {
    private commentModel: PrisnaCommentModel;
    private fileUploader: FileUploaderForS3;
    constructor(commentModel: any, fileUploader: FileUploaderForS3) {
        this.commentModel = commentModel;
        this.fileUploader = fileUploader;
    }

    async getAllCommentsForQuestion(req, res) {
        try {
            const page = parseInt(req.body.page) || 1;
            const limit = parseInt(req.body.limit) || 10;
            const sort = req.body.sort || 'newest';
            const questionId = parseInt(req.query.id);

            const comments = await this.commentModel.getAllItems(page, limit, sort,questionId );

            const commentsWithSignedUrls = await Promise.all(
                comments.map(async (comment) => {
                    if (comment.user?.mediaUrls?.length > 0) {
                        const signedUrls = await Promise.all(
                            comment.user.mediaUrls.map(url =>
                                this.fileUploader.myGetSignedUrl(url)
                            )
                        );

                        const userWithSignedUrls = {
                            ...comment.user,
                            mediaUrls: signedUrls
                        };

                        return {
                            ...comment,
                            user: userWithSignedUrls
                        };
                    }
                    return comment;
                }));

            res.status(200).json({
                success: true,
                data: commentsWithSignedUrls
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createComment(req, res) {
        try {
            const {userId , questionId , content} = req.body;
            const newComment = await this.commentModel.createItem(userId , questionId , content);
            res.status(201).json({
                success: true,
                data: newComment
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async deleteComment (req, res){
        try{
            const {id} = req.params
            const response = await this.commentModel.deleteItem(id)
            res.status(201).json({
                success: true,
                data: response
            });
        }
        
        catch(error){
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}