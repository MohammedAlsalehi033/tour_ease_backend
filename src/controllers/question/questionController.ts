import { FileUploaderForS3 } from "../../utils/FileUploader";
class QuestionController {
  private questionModel;
  private fileUploader: FileUploaderForS3;
    
  constructor(questionModel, fileUploader: FileUploaderForS3) {
    this.questionModel = questionModel;
    this.fileUploader = fileUploader;
  }

  async getAllQuestions(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || 'newest';
        
        const questions = await this.questionModel.getAllItems(page, limit, sort);

        const questionsWithSignedUrls = await Promise.all(
          questions.map(async (question) => {
            if (question.user?.mediaUrls?.length > 0) {
                const signedUrls = await Promise.all(

                    question.user.mediaUrls.map(  (url)=>{
                      console.log(url)
                      return this.fileUploader.myGetSignedUrl(url)

                    }
                    )
                );
                
                const userWithSignedUrls = {
                    ...question.user,
                    mediaUrls: signedUrls
                };
                
                return {
                    ...question,
                    user: userWithSignedUrls
                };
            }
            return question;
        }));

        res.status(200).json({
            success: true,
            data: questionsWithSignedUrls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

  async getQuestionById(req, res) {
    try {
      const questionId = req.params.id;
      const question = await this.questionModel.getItemById(questionId);
      
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: question
      });
    } catch (error) {
      res.status(error.message === 'Question not found' ? 404 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createQuestion(req, res) {
    try {
      const { title, description, tags , userId} = req.body;
      
      const newQuestion = await this.questionModel.createItem({
        title,
        description,
        tags,
        userId
      });
      
      res.status(201).json({
        success: true,
        data: newQuestion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateQuestion(req, res) {
    try {
      const questionId = req.params.id;
      const { title, description, tags, userId } = req.body;
      // const userId = req.user.id;
      
      const question = await this.questionModel.getItemById(questionId);
      
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
      if (question.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only update your own questions'
        });
      }
      
      const updatedQuestion = await this.questionModel.updateItem(questionId, {
        title,
        description,
        tags
      });
      
      res.status(200).json({
        success: true,
        data: updatedQuestion
      });
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else if (error.message === 'Question not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
  }

  async deleteQuestion(req, res) {
    try {
      const questionId = req.params.id;
      
      const question = await this.questionModel.getItemById(questionId);
      
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }
      
   
      
      await this.questionModel.deleteItem(questionId);
      
      res.status(200).json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        res.status(403).json({
          success: false,
          message: error.message
        });
      } else if (error.message === 'Question not found') {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
  }

  async searchQuestions(req, res) {
    try {
      const { query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const questions = await this.questionModel.searchItems(query, page, limit);
      
      res.status(200).json({
        success: true,
        data: questions
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  async voteQuestion(req, res) {
    try {
      const { id , userId , isUpvote } = req.body;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updatedQuestion = await this.questionModel.voteQuestion(
        Number(id),
        isUpvote,
        userId
      );

      res.status(200).json({
        success: true,
        data: updatedQuestion
      });
    } catch (error) {
      console.error('Error voting on question:', error);
      res.status(500).json({ error: 'Failed to process vote' });
    }
  }
}


export default QuestionController;