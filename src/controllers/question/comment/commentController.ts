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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sort = req.query.sort || 'newest';
            const questionId = parseInt(req.query.id);

            const comments : any = await this.commentModel.getAllItems(page, limit, sort,questionId );

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
        } catch (error : any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createComment(req, res) {
        try {
                  const userId = req.user.id;

            const { questionId , content} = req.body;
            const newComment = await this.commentModel.createItem(userId , questionId , content);
            res.status(201).json({
                success: true,
                data: newComment
            });
        } catch (error : any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
            
        }
    }


    async deleteComment (req, res){
        try{
            const {id} = req.params
            const userId = req.user.id;
            const comment = await this.commentModel.getItemById(id);
            
            if(!comment){
                return res.status(404).json({
                    success: false,
                    message: "Comment not found"
                });
            }

            // Check if user is admin
            const userRoleNames = req.user.roles.map(userRole => userRole.role.roleName);
            const isAdmin = userRoleNames.includes('Admin');

            // Check if user is the comment owner or admin
            if(comment.userId !== userId && !isAdmin){
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to delete this comment"
                });
            }

            const response = await this.commentModel.deleteItem(id)
            res.status(200).json({
                success: true,
                data: response
            });
        }
        
        catch(error : any){
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}