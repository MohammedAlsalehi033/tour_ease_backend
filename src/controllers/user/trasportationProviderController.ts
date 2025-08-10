import TransportationProviderModel from '../../models/user/TransportationProviderModel';
import { FileUploader, FileUploaderForS3 } from '../../utils/FileUploader';
import {UserRole} from '../../Types/myEnum';
import { da } from '@faker-js/faker/.';

export class TransportationProviderController {

    private transportationProviderModel: TransportationProviderModel;
    private fileUploader: FileUploader;

    constructor(transportationProviderModel : TransportationProviderModel , fileUploader : FileUploader) {
        this.transportationProviderModel = transportationProviderModel;
        this.fileUploader = fileUploader;
    }

    async createTransportationProvider(req, res) {
        const { id, role, seatsAvailable, vehicleType } = req.body;
        const { licenseMedia, vehicleMedia } = req.files;

        try {
        let newTransportationProvider : any = await this.transportationProviderModel.getUserById(id);
        
        if(!newTransportationProvider) {
            throw new Error(`User with id ${id} does not exist`);
        }

        const licenseMediaUploadPromises = licenseMedia.map(async (mediaFile: any) => {
            const uploadResult = await this.fileUploader.uploadFile(mediaFile, "licenseMedia", newTransportationProvider.username);
            return uploadResult.key;
          });
          const licenseMediaUrls = await Promise.all(licenseMediaUploadPromises);
        
          const vehicleMediaUploadPromises = vehicleMedia.map(async (mediaFile: any) => {
            const uploadResult = await this.fileUploader.uploadFile(mediaFile, "vehicleMedia", newTransportationProvider.username);
            return uploadResult.key;
          });
          const vehicleMediaUrls = await Promise.all(vehicleMediaUploadPromises);


          
         newTransportationProvider = await this.transportationProviderModel.createTransportationProvider(
            id,
            UserRole.TRANSPORTATION_PROVIDER,
            licenseMediaUrls,
            vehicleMediaUrls,
            seatsAvailable,
            vehicleType
        );

        return res.status(200).json({
            success: true,
            data: newTransportationProvider,})

    }catch (error : any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }   
}


    async getTransportationProviderById(req, res) {
        const { id } = req.params;
        try {
            const transportationProvider = await this.transportationProviderModel.getTransportationProviderById(id);
            if (!transportationProvider) {
                return res.status(404).json({ success: false, message: 'Transportation provider not found' });
            }
            return res.status(200).json({ success: true, data: transportationProvider });
        } catch (error : any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }


}