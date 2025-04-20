import { AdminModel } from "../../models/admin/adminModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";

export class AdminController {
    private adminModel: AdminModel;
    private fileUploader: FileUploaderForS3;

    constructor(adminModel: AdminModel, fileUploader: FileUploaderForS3) {
        this.adminModel = adminModel;
        this.fileUploader = fileUploader;
    }

    /**
     * Get all transportation providers with pending status
     */
    async getPendingTransportationProviders(req, res) {
        try {
            const status = req.query.status || "pending";
            const providers = await this.adminModel.getTransportationProvidersByStatus(status);
            
            // Generate signed URLs for license and vehicle media
            const providersWithSignedUrls = await Promise.all(
                providers.map(async (provider) => {
                    const licenseSignedUrls = await Promise.all(
                        provider.licenseMmediaUrls.map(url => 
                            this.fileUploader.myGetSignedUrl(url)
                        )
                    );
                    
                    const vehicleSignedUrls = await Promise.all(
                        provider.vehicleMediaUrls.map(url => 
                            this.fileUploader.myGetSignedUrl(url)
                        )
                    );
                    
                    return {
                        ...provider,
                        licenseMmediaUrls: licenseSignedUrls,
                        vehicleMediaUrls: vehicleSignedUrls
                    };
                })
            );
            
            res.status(200).json({
                success: true,
                data: providersWithSignedUrls
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get a specific transportation provider by ID
     */
    async getTransportationProviderById(req, res) {
        try {
            const { providerId } = req.params;
            const provider = await this.adminModel.getTransportationProviderById(providerId);
            
            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: "Transportation provider not found"
                });
            }
            
            // Generate signed URLs for license and vehicle media
            const licenseSignedUrls = await Promise.all(
                provider.licenseMmediaUrls.map(url => 
                    this.fileUploader.myGetSignedUrl(url)
                )
            );
            
            const vehicleSignedUrls = await Promise.all(
                provider.vehicleMediaUrls.map(url => 
                    this.fileUploader.myGetSignedUrl(url)
                )
            );
            
            const providerWithSignedUrls = {
                ...provider,
                licenseMmediaUrls: licenseSignedUrls,
                vehicleMediaUrls: vehicleSignedUrls
            };
            
            res.status(200).json({
                success: true,
                data: providerWithSignedUrls
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Update the status of a transportation provider (accept/reject)
     */
    async updateTransportationProviderStatus(req, res) {
        try {
            const { providerId } = req.params;
            const { status } = req.body;
            
            if (!status || !['accepted', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be 'accepted' or 'rejected'"
                });
            }
            
            const updatedProvider = await this.adminModel.updateTransportationProviderStatus(providerId, status);
            
            res.status(200).json({
                success: true,
                message: `Transportation provider ${status}`,
                data: updatedProvider
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get all accommodation providers with pending status
     */
    async getPendingAccommodationProviders(req, res) {
        try {
            const providers = await this.adminModel.getPendingAccommodationProviders();
            
            // Generate signed URLs for accommodation media
            const providersWithSignedUrls = await Promise.all(
                providers.map(async (provider) => {
                    const mediaSignedUrls = await Promise.all(
                        provider.mediaUrls.map(url => 
                            this.fileUploader.myGetSignedUrl(url)
                        )
                    );
                    
                    return {
                        ...provider,
                        mediaUrls: mediaSignedUrls
                    };
                })
            );
            
            res.status(200).json({
                success: true,
                data: providersWithSignedUrls
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Get a specific accommodation provider by ID
     */
    async getAccommodationProviderById(req, res) {
        try {
            const { providerId } = req.params;
            const provider = await this.adminModel.getAccommodationProviderById(providerId);
            
            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: "Accommodation provider not found"
                });
            }
            
            // Generate signed URLs for accommodation media
            const mediaSignedUrls = await Promise.all(
                provider.mediaUrls.map(url => 
                    this.fileUploader.myGetSignedUrl(url)
                )
            );
            
            const providerWithSignedUrls = {
                ...provider,
                mediaUrls: mediaSignedUrls
            };
            
            res.status(200).json({
                success: true,
                data: providerWithSignedUrls
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Update the status of an accommodation provider (accept/reject)
     */
    async updateAccommodationProviderStatus(req, res) {
        try {
            const { providerId } = req.params;
            const { status } = req.body;
            
            if (!status || !['accepted', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be 'accepted' or 'rejected'"
                });
            }
            
            const updatedUser = await this.adminModel.updateAccommodationProviderStatus(providerId, status);
            
            res.status(200).json({
                success: true,
                message: `Accommodation provider ${status}`,
                data: updatedUser
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}