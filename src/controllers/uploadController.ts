import { Request, Response } from 'express';
import { FileUploaderForS3 } from '../utils/FileUploader';

export class UploadController {
  private fileUploader: FileUploaderForS3;

  constructor() {
    this.fileUploader = new FileUploaderForS3();
  }

  /**
   * Upload file to S3 (proxy endpoint for Flutter app)
   * Receives file from Flutter, uploads to S3, returns S3 key
   */
  async uploadToS3(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      const { userId, fileType } = req.body;

      if (!userId || !fileType) {
        return res.status(400).json({
          success: false,
          message: 'userId and fileType are required',
        });
      }

      // Upload to S3
      const uploadResult = await this.fileUploader.uploadFile(
        req.file,
        fileType,
        userId
      );

      res.status(200).json({
        success: true,
        s3Key: uploadResult.key,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading to S3:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload file',
      });
    }
  }
}
