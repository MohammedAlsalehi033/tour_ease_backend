import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
require('dotenv').config();

export interface FileUploadResult {
  url: string;
  key: string;
}

export abstract class FileUploader {
  abstract uploadFile(
    file: any,
    fileType: string,
    userName: string
  ): Promise<FileUploadResult>;

  abstract myGetSignedUrl(key: string, expiresIn: number): Promise<string>;
  abstract deleteFile(key: string): Promise<void>;
}

export class FileUploaderForS3 extends FileUploader {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    super();
    this.region = process.env.AWS_REGION || "us-east-1";
    this.bucket = process.env.S3_BUCKET_NAME || "";
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  async uploadFile(
    file: any,
    fileType: string,
    userName: string
  ): Promise<FileUploadResult> {
    const extension = file.originalname.split(".").pop();
    const key = `uploads/${userName}/${Date.now()}-${fileType}.${extension}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
    });
    await this.s3Client.send(uploadCommand);
    fs.unlinkSync(file.path);
    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    //images/mohammed/profilepic.png
    const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: 3600,
    });
    return {
      url: signedUrl,
      key: key,
    };
  }

  async myGetSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }
}
