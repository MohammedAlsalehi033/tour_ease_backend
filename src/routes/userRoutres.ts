export {};
import UserController from "../controllers/userController";
import UserModel from "../models/userModel";
import multer from 'multer';

import express from 'express';
const router = express.Router();
import { FileUploaderForS3 } from "../utils/FileUploader";
import adminMiddleware from "../middleware/adminsMiddleware";
const fileUploaderForS3 = new FileUploaderForS3();
const userController = new UserController(new UserModel, fileUploaderForS3);


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
// Exact match routes first (no parameters)
router.post('/createUser', userController.createUser.bind(userController));
router.get('/getRole', userController.getRole.bind(userController));
router.post('/updateUserRole', userController.updateRole.bind(userController));
router.get("/getAllUsers", adminMiddleware(["Manage Users"  ]) ,userController.getAllUsers.bind(userController));
router.get('/getUserById', userController.getUserById.bind(userController));

// Routes with parameters
router.post('/FCMToken/:id', userController.addFCMTokenToUser.bind(userController));
// NEW ROUTE: Get accommodation ID for user - moved before generic :id route
router.get('/accommodation-id/:id', userController.getAccommodationIdByUserId.bind(userController));
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