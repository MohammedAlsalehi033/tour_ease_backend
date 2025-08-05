import { Router } from "express";
import multer from 'multer';
import express from 'express';
import TransportationProviderModel from "../../models/user/TransportationProviderModel";
import { TransportationProviderController } from '../../controllers/user/trasportationProviderController';
import { FileUploaderForS3 } from "../../utils/FileUploader";
import UserController from "../../controllers/userController";
import UserModel from "../../models/userModel";

const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    console.log(file.mimetype);
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('application/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});


 const router = express.Router();
const fileUploaderForS3 = new FileUploaderForS3(); 
const userModel = new UserController(new UserModel , fileUploaderForS3);
const transportationProviderController = new TransportationProviderController(new TransportationProviderModel, fileUploaderForS3);

router.post('/createTransportationProvider', upload.fields([
  { name: 'licenseMedia', maxCount: 10 }, 
  { name: 'vehicleMedia', maxCount: 10 }  
]), transportationProviderController.createTransportationProvider.bind(transportationProviderController));


router.get('/getTransportationProvider/:id', transportationProviderController.getTransportationProviderById.bind(transportationProviderController));

module.exports = router;