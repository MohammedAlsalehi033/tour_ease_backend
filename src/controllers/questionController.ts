import { Question } from "@prisma/client";
import { BaseModel } from "../models/question/questionBaseModel";

class QuestionController {
  private questionModel: BaseModel<Question>;
    
  constructor(questionModel: BaseModel<Question>) {
    this.questionModel = questionModel;
  }

  async getAllQuestions(req, res) {
    try {

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sort = req.query.sort || 'newest';
      
      const questions = await this.questionModel.getAllItems(page, limit, sort);
      
      res.status(200).json({
        success: true,
        data: questions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // async getQuestionById(req, res) {
  //   try {
  //     const questionId = req.params.id;
  //     const question = await this.questionModel.getItemById(questionId);
      
  //     if (!question) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Question not found'
  //       });
  //     }
      
  //     res.status(200).json({
  //       success: true,
  //       data: question
  //     });
  //   } catch (error) {
  //     res.status(error.message === 'Question not found' ? 404 : 500).json({
  //       success: false,
  //       message: error.message
  //     });
  //   }
  // }

  // async createQuestion(req, res) {
  //   try {
  //     const { title, description, tags } = req.body;
  //     // Assuming you have authentication middleware that sets req.user
  //     const userId = req.user.id;
      
  //     const newQuestion = await this.questionModel.createItem({
  //       title,
  //       description,
  //       tags,
  //       userId
  //     });
      
  //     res.status(201).json({
  //       success: true,
  //       data: newQuestion
  //     });
  //   } catch (error) {
  //     res.status(400).json({
  //       success: false,
  //       message: error.message
  //     });
  //   }
  // }

  // async updateQuestion(req, res) {
  //   try {
  //     const questionId = req.params.id;
  //     const { title, description, tags } = req.body;
  //     const userId = req.user.id;
      
  //     const question = await this.questionModel.getItemById(questionId);
      
  //     if (!question) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Question not found'
  //       });
  //     }
      
  //     if (question.userId !== userId) {
  //       return res.status(403).json({
  //         success: false,
  //         message: 'Unauthorized: You can only update your own questions'
  //       });
  //     }
      
  //     const updatedQuestion = await this.questionModel.updateItem(questionId, {
  //       title,
  //       description,
  //       tags
  //     });
      
  //     res.status(200).json({
  //       success: true,
  //       data: updatedQuestion
  //     });
  //   } catch (error) {
  //     if (error.message.includes('Unauthorized')) {
  //       res.status(403).json({
  //         success: false,
  //         message: error.message
  //       });
  //     } else if (error.message === 'Question not found') {
  //       res.status(404).json({
  //         success: false,
  //         message: error.message
  //       });
  //     } else {
  //       res.status(400).json({
  //         success: false,
  //         message: error.message
  //       });
  //     }
  //   }
  // }

  // async deleteQuestion(req, res) {
  //   try {
  //     const questionId = req.params.id;
  //     const userId = req.user.id;
      
  //     // First check if question exists and if user is authorized
  //     const question = await this.questionModel.getItemById(questionId);
      
  //     if (!question) {
  //       return res.status(404).json({
  //         success: false,
  //         message: 'Question not found'
  //       });
  //     }
      
  //     if (question.userId !== userId) {
  //       return res.status(403).json({
  //         success: false,
  //         message: 'Unauthorized: You can only delete your own questions'
  //       });
  //     }
      
  //     await this.questionModel.deleteItem(questionId);
      
  //     res.status(200).json({
  //       success: true,
  //       message: 'Question deleted successfully'
  //     });
  //   } catch (error) {
  //     if (error.message.includes('Unauthorized')) {
  //       res.status(403).json({
  //         success: false,
  //         message: error.message
  //       });
  //     } else if (error.message === 'Question not found') {
  //       res.status(404).json({
  //         success: false,
  //         message: error.message
  //       });
  //     } else {
  //       res.status(400).json({
  //         success: false,
  //         message: error.message
  //       });
  //     }
  //   }
  // }

  // async searchQuestions(req, res) {
  //   try {
  //     const { query } = req.query;
  //     const page = parseInt(req.query.page) || 1;
  //     const limit = parseInt(req.query.limit) || 10;
      
  //     const questions = await this.questionModel.searchItems(query, page, limit);
      
  //     res.status(200).json({
  //       success: true,
  //       data: questions
  //     });
  //   } catch (error) {
  //     res.status(400).json({
  //       success: false,
  //       message: error.message
  //     });
  //   }
  // }
  

}

export default QuestionController;