import { AdminModel } from "../../models/admin/adminModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";
import { Request, Response } from 'express';

export class AdminController {
    private adminModel: AdminModel;
    private fileUploader: FileUploaderForS3;

    constructor(adminModel: AdminModel, fileUploader: FileUploaderForS3) {
        this.adminModel = adminModel;
        this.fileUploader = fileUploader;
    }

    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                 return res.status(400).json({ success: false, message: "User ID parameter is required" });
            }
            const user = await this.adminModel.getUserById(id);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }

            res.status(200).json({ success: true, data: user });
        } catch (error: any) {
             console.error("Error in AdminController getUserById:", error);
             res.status(500).json({ success: false, message: "Failed to get user details" });
        }
    }

    async blockUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
             if (!id) {
                 return res.status(400).json({ success: false, message: "User ID parameter is required" });
            }
            const user = await this.adminModel.blockUser(id);
            res.status(200).json({ success: true, message: "User blocked successfully", data: user });
        } catch (error: any) {
             console.error("Error in AdminController blockUser:", error);
             res.status(500).json({ success: false, message: "Failed to block user" });
        }
    }


    async getPendingTransportationProviders(req: Request, res: Response) {
        try {
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
            const pageSize = typeof req.query.pageSize === 'string' ? parseInt(req.query.pageSize) : 10;

            const providers = await this.adminModel.getTransportationProvidersByStatus(status , page, pageSize);

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
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async getTransportationProviderById(req: Request, res: Response) {
        try {
            const { providerId } = req.params;
            const provider = await this.adminModel.getTransportationProviderById(providerId);

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: "Transportation provider not found"
                });
            }

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
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async updateTransportationProviderStatus(req: Request, res: Response) {
        try {
            const { providerId } = req.params;
            const { status } = req.body;

            if (!status || !['accepted', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be 'accepted' or 'rejected'"
                });
            }

            const actualStatus = status === 'accepted' ? 'active' : 'rejected';

            const updatedProvider = await this.adminModel.updateTransportationProviderStatus(providerId, actualStatus);

            res.status(200).json({
                success: true,
                message: `Transportation provider status updated to ${actualStatus}`,
                data: updatedProvider
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async getPendingAccommodationProviders(req: Request, res: Response) {
        try {
            const providers = await this.adminModel.getPendingAccommodationProviders();

            const providersWithSignedUrls = await Promise.all(
                providers.map(async (provider) => {
                     if (!provider.mediaUrls || provider.mediaUrls.length === 0) {
                         return { ...provider, mediaUrls: [] };
                     }
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
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async getAccommodationProviderById(req: Request, res: Response) {
        try {
            const { providerId } = req.params;
            const provider = await this.adminModel.getAccommodationProviderById(providerId);

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: "Accommodation provider not found"
                });
            }
             if (!provider.mediaUrls || provider.mediaUrls.length === 0) {
                 return res.status(200).json({ success: true, data: { ...provider, mediaUrls: [] } });
             }

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
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async updateAccommodationProviderStatus(req: Request, res: Response) {
        try {
            const { providerId } = req.params;
            const { status } = req.body;

            if (!status || !['accepted', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be 'accepted' or 'rejected'"
                });
            }

            const actualStatus = status === 'accepted' ? 'active' : 'rejected';


            const updatedUser = await this.adminModel.updateAccommodationProviderStatus(providerId, actualStatus);

            res.status(200).json({
                success: true,
                message: `Accommodation provider status updated to ${actualStatus}`,
                data: updatedUser
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}