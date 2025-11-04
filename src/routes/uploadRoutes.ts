import express from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/uploadController';

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const uploadController = new UploadController();

// Upload file to S3 endpoint
router.post(
  '/upload-to-s3',
  upload.single('file'),
  uploadController.uploadToS3.bind(uploadController)
);

module.exports = router;
