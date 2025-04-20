export {};
import UserController from "../controllers/userController";
import UserModel from "../models/userModel";
import multer from 'multer';

import express from 'express';
const router = express.Router();
const userController = new UserController(new UserModel);


const upload = multer({ 
    dest: 'uploads/temp/',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });


// Public routes
router.post('/createUser', userController.createUser.bind(userController));
router.get('/getRole', userController.getRole.bind(userController));
router.post('/updateUserRole', userController.updateRole.bind(userController));
router.get('/getUserById', userController.getUserById.bind(userController));
router.get("/getAllUsers", userController.getAllUsers.bind(userController))
router.post(
    '/profile-picture/:id?', 
    upload.single('profilePicture'), 
    userController.updateProfilePicture.bind(userController)
  );

// router.get('/questions/:id', questionController.getQuestionById);
// router.get('/questions/search', questionController.searchQuestions);

// // Protected routes (require authentication)
// router.post('/questions', authMiddleware, questionController.createQuestion);
// router.put('/questions/:id', authMiddleware, questionController.updateQuestion);
// router.delete('/questions/:id', authMiddleware, questionController.deleteQuestion);

module.exports = router;