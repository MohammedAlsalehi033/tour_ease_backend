// 1. Correct the import statement for the Google Gemini SDK
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { FileUploaderForS3 } from "../../utils/FileUploader";

// Note: There is no need to import 'OpenAI' if you are using Gemini.

class QuestionController {
  private questionModel;
  private fileUploader: FileUploaderForS3;
  private model: any; 

  constructor(questionModel, fileUploader: FileUploaderForS3) {
    this.questionModel = questionModel;
    this.fileUploader = fileUploader;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
     this.model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are a travel expert. Your role is to provide a mid-to-long and informative answer to travel-related questions.
        Do not answer if the question is not related to travel.
        IMPORTANT: You must format your entire response as a single, valid JSON object. Do not add any text before or after the JSON.
        The JSON object must follow this exact schema:
        {
          "title": "A main headline for the travel question.",
          "introduction": "A 1-3 sentence summary of the answer.",
          "sections": [
            {
              "cardTitle": "The title for a specific section or card.",
              "cardContent": "The detailed content for this section. Use '\\n' for line breaks."
            }
          ]
        }
        Create as many sections as needed to answer the question thoroughly.`,
    });
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

  async askTheAI(req, res) {
    try {
      const { title, description, tags } = req.body;

      // Validate that all required fields are present.
      if (!title || !description) {
        return res.status(400).json({ error: 'Title, description, and a non-empty array of tags are required.' });
      }

   const prompt = `Create an answer for the following question: "${title} - ${description}"`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let generatedText = response.text();


    const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        generatedText = jsonMatch[1];
    }

    let jsonData;
    try {
      jsonData = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('AI did not return valid JSON after cleaning:', generatedText);
      return res.status(500).json({ error: 'Failed to process AI response as JSON.', rawData: generatedText });
    }

    res.status(200).json({
      success: true,
      data: jsonData 
    });

  } catch (error) {
    console.error('Error asking the AI:', error);
    res.status(500).json({ error: `Failed to get AI response ${error.message}` });
  }
}

}


export default QuestionController;