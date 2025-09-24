import { AdminModel } from "../../models/admin/adminModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { FirebaseNotifier } from "../../utils/firebaseNotficationsManger";

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
            // Notify the affected user
            try {
                const notifier = container.resolve(FirebaseNotifier);
                await notifier.sendContextualNotification(id, 'ACCOUNT_BLOCKED', {
                    title: 'Account Temporarily Blocked',
                    body: 'Your account has been temporarily blocked by an administrator due to policy violations. Please contact our support team if you believe this action was taken in error or need assistance.',
                    priority: 'high',
                    actionRequired: true,
                    actionUrl: '/support/contact',
                    entityType: 'account_block',
                    entityId: id
                });
            } catch (notifyError) {
                console.error('Failed to send block notification:', notifyError);
            }
            res.status(200).json({ success: true, message: "User blocked successfully", data: user });
        } catch (error: any) {
             console.error("Error in AdminController blockUser:", error);
             res.status(500).json({ success: false, message: "Failed to block user" });
        }
    }

    async unblockUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ success: false, message: "User ID parameter is required" });
            }
            
            const user = await this.adminModel.unblockUser(id);
            
            // Notify the user that their account has been unblocked
            try {
                const notifier = container.resolve(FirebaseNotifier);
                await notifier.sendContextualNotification(id, 'ACCOUNT_UNBLOCKED', {
                    title: 'Account Unblocked',
                    body: 'Good news! Your account has been unblocked by an administrator. You can now access all features again. Please ensure you follow our community guidelines to avoid future issues.',
                    priority: 'high',
                    actionRequired: false,
                    actionUrl: '/guidelines',
                    entityType: 'account_unblock',
                    entityId: id
                });
            } catch (notifyError) {
                console.error('Failed to send unblock notification:', notifyError);
            }
            
            res.status(200).json({ success: true, message: "User unblocked successfully", data: user });
        } catch (error: any) {
            console.error("Error in AdminController unblockUser:", error);
            res.status(500).json({ success: false, message: "Failed to unblock user" });
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
            // Notify provider
            try {
                const notifier = container.resolve(FirebaseNotifier);
                const statusMessage = actualStatus === 'active' 
                    ? 'Congratulations! Your transportation provider application has been approved. You can now start offering transportation services on our platform.'
                    : 'Unfortunately, your transportation provider application has been rejected. Please review our provider guidelines and feel free to reapply after addressing any concerns.';
                
                await notifier.sendContextualNotification(providerId, 'PROVIDER_STATUS', {
                    title: `Transportation Provider Application ${actualStatus === 'active' ? 'Approved' : 'Rejected'}`,
                    body: statusMessage,
                    priority: 'high',
                    actionRequired: true,
                    actionUrl: actualStatus === 'active' ? '/provider/dashboard' : '/provider/guidelines',
                    entityType: 'transportation_provider',
                    entityId: providerId
                });
            } catch (notifyError) {
                console.error('Failed to notify transportation provider status change:', notifyError);
            }
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
            // Notify provider
            try {
                const notifier = container.resolve(FirebaseNotifier);
                const statusMessage = actualStatus === 'active' 
                    ? 'Congratulations! Your accommodation provider application has been approved. You can now start listing accommodations on our platform.'
                    : 'Unfortunately, your accommodation provider application has been rejected. Please review our provider guidelines and feel free to reapply after addressing any concerns.';
                
                await notifier.sendContextualNotification(providerId, 'PROVIDER_STATUS', {
                    title: `Accommodation Provider Application ${actualStatus === 'active' ? 'Approved' : 'Rejected'}`,
                    body: statusMessage,
                    priority: 'high',
                    actionRequired: true,
                    actionUrl: actualStatus === 'active' ? '/provider/dashboard' : '/provider/guidelines',
                    entityType: 'accommodation_provider',
                    entityId: providerId
                });
            } catch (notifyError) {
                console.error('Failed to notify accommodation provider status change:', notifyError);
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}