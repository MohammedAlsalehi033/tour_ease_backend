import { Request, Response } from 'express'; // Assuming you use Express for types
import { SuperAdminModel } from "../../../models/admin/superAdmin/superAdminModel";

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
        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        try {
            const updatedUser = await this.superAdminModel.removeAdmin(userId);
            res.status(200).json({ message: "Admin role removed successfully", data: updatedUser });
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
        const { userId } = req.params;

        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        try {
            const updatedUser = await this.superAdminModel.toggleUserStatus(userId);
            res.status(200).json({ message: `User status changed to ${updatedUser.accountStatus}`, data: updatedUser });
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
        const { adminId } = req.params;
        const { permissions } = req.body;

        if (!adminId) {
            res.status(400).json({ error: "Admin ID is required" });
            return;
        }

        if (!permissions || !Array.isArray(permissions)) {
            res.status(400).json({ error: "Permissions must be an array of strings" });
            return;
        }

        try {
            const updatedAdmin = await this.superAdminModel.changeAdminPermissions(adminId, permissions);
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