import { Request, Response } from 'express'; // Assuming you use Express for types
import { SuperAdminModel } from "../../../models/admin/superAdmin/superAdminModel";
import { User } from '@prisma/client';
import { container } from 'tsyringe';
import { FirebaseNotifier } from "../../../utils/firebaseNotficationsManger";

export class SuperAdminController {
    private superAdminModel: SuperAdminModel;

    constructor() {
        this.superAdminModel = new SuperAdminModel();
    }

    /**
     * Handles the request to get all admin users.
     */
    getAllAdmins = async (req: Request, res: Response): Promise<void> => {
        try {
            const admins = await this.superAdminModel.getAllAdmins();
            console.log("myAdmin", req.user);
            res.status(200).json(admins);
        } catch (error) {
            console.error("Error fetching admins:", error);
            res.status(500).json({ error: "Failed to fetch admins" });
        }
    }

    /**
     * Handles the request to add a new admin.
     * Expects a `userId` in the request parameters.
     */
    addNewAdmin = async (req: Request, res: Response): Promise<void> => {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        try {
            const newAdmin = await this.superAdminModel.addAdmin(userId);
            res.status(201).json({ message: "Admin added successfully", data: newAdmin });
            // Notify user of role change
            try {
                const notifier = container.resolve(FirebaseNotifier);
                await notifier.sendContextualNotification(userId, 'ADMIN_ROLE', {
                    title: 'Administrator Privileges Granted',
                    body: 'Congratulations! You have been granted administrator privileges. You now have access to admin features and can manage users and content.',
                    priority: 'high',
                    actionRequired: true,
                    actionUrl: '/admin/dashboard',
                    entityType: 'admin_role',
                    entityId: userId
                });
            } catch (notifyError) {
                console.error('Failed to send admin add notification:', notifyError);
            }
        } catch (error) {
            console.error("Error adding new admin:", error);
            // Provide more specific feedback to the client based on the error from the model
            if (error instanceof Error) {
                if (error.message.includes("not found")) {
                    res.status(404).json({ error: error.message });
                    return;
                }
                if (error.message.includes("already an admin")) {
                    res.status(409).json({ error: error.message }); // 409 Conflict
                    return;
                }
            }
            res.status(500).json({ error: "Failed to add new admin" });
        }
    }

    /**
     * Handles the request to remove an admin role from a user.
     * Expects a `userId` in the request parameters.
     */
    removeAdmin = async (req: Request, res: Response): Promise<void> => {
        console.log("removeAdmin called with params:", req.params);
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        if( id === req.user?.id) {
            res.status(400).json({ error: "You cannot remove the super admin (very very important user)" });
            return;
        }

        try {
            const updatedUser = await this.superAdminModel.removeAdmin(id);
            res.status(200).json({ message: "Admin role removed successfully", data: updatedUser });
            // Notify user of role removal
            try {
                const notifier = container.resolve(FirebaseNotifier);
                await notifier.sendContextualNotification(id, 'ADMIN_ROLE', {
                    title: 'Administrator Privileges Removed',
                    body: 'Your administrator privileges have been removed. You will no longer have access to admin features. Contact support if you believe this is an error.',
                    priority: 'high',
                    actionRequired: true,
                    entityType: 'admin_role',
                    entityId: id
                });
            } catch (notifyError) {
                console.error('Failed to send admin removal notification:', notifyError);
            }
        } catch (error) {
            console.error("Error removing admin:", error);
            if (error instanceof Error && error.message.includes("not an admin")) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Failed to remove admin" });
        }
    }

    /**
     * Handles the request to toggle a user's account status.
     * Expects a `userId` in the request parameters.
     */
    toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        try {
            const updatedUser = await this.superAdminModel.toggleUserStatus(id);
            res.status(200).json({ message: `User status changed to ${updatedUser.accountStatus}`, data: updatedUser });
            // Notify user about status change
            try {
                const notifier = container.resolve(FirebaseNotifier);
                const statusMessage = updatedUser.accountStatus === 'active' 
                    ? 'Your account has been reactivated and you can now access all features.'
                    : `Your account has been set to ${updatedUser.accountStatus}. Some features may be restricted. Contact support for assistance.`;
                
                await notifier.sendContextualNotification(id, 'ACCOUNT_STATUS', {
                    title: 'Account Status Updated',
                    body: statusMessage,
                    priority: 'high',
                    actionRequired: updatedUser.accountStatus !== 'active',
                    entityType: 'account_status',
                    entityId: id
                });
            } catch (notifyError) {
                console.error('Failed to send account status change notification:', notifyError);
            }
        } catch (error) {
            console.error("Error toggling user status:", error);
            if (error instanceof Error && error.message.includes("not found")) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Failed to toggle user status" });
        }
    }

    /**
     * Handles the request to change an admin's permissions.
     * Expects `adminId` in parameters and `permissions` in the request body.
     */
    changeAdminPermissions = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!id) {
            res.status(400).json({ error: "Admin ID is required" });
            return;
        }

        if (!permissions || !Array.isArray(permissions)) {
            res.status(400).json({ error: "Permissions must be an array of strings" });
            return;
        }

        if (permissions.includes("Super Admin")) {
            res.status(400).json({ error: "Cannot remove superAdmin permission good try tho" });
            return;
        }

        try {
            const updatedAdmin = await this.superAdminModel.changeAdminPermissions(id, permissions);
            
            // Notify admin about permissions change
            try {
                const notifier = container.resolve(FirebaseNotifier);
                await notifier.sendContextualNotification(id, 'ADMIN_PERMISSIONS', {
                    title: 'Admin Permissions Updated',
                    body: `Your administrator permissions have been updated. New permissions: ${permissions.join(', ')}. Please review the changes and contact support if you have questions.`,
                    priority: 'high',
                    actionRequired: true,
                    actionUrl: '/admin/permissions',
                    entityType: 'admin_permissions',
                    entityId: id
                });
            } catch (notifyError) {
                console.error('Failed to send permissions change notification:', notifyError);
            }
            
            res.status(200).json({ message: "Permissions updated successfully", data: updatedAdmin });
        } catch (error) {
            console.error("Error changing admin permissions:", error);
            if (error instanceof Error && error.message.includes("not found")) {
                res.status(404).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: "Failed to change admin permissions" });
        }
    }
}