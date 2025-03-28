import UserModel from "../models/userModel";
import { UserRole } from "../Types/myEnum";
import { FileUploaderForS3 } from "../utils/FileUploader";
export default class UserController {
    private model: UserModel;

    constructor(model: UserModel) {
        this.model = model;
    }




    async getUserById(req, res) {
        try {
            const { id } = req.query;

            const user = await this.model.getUserById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            res.json({
                success: true,
                data: user,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    async createUser(req, res) {
        try {
            const { id, username, email, password } = req.body;
            const newUser = await this.model.createUser(id, username, email, "", UserRole.TRAVELER);
            res.status(201).json({
                success: true,
                data: newUser
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getRole(req: any, res: any) {
        try {
            const { id } = req.body;
            const role = await this.model.getRoles(id);
            res.json({
                success: true,
                data: role
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateRole(req, res) {
        const { id, role } = req.body;
        try {
            const updatedRole = await this.model.updateUserRole(id, role);
            res.json({
                success: true,
                data: "role updated"
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }


    async updateProfilePicture(req, res) {
        try {
            const userId = req.params.id;
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded',
                });
            }
            
            const updatedUser = await this.model.updateProfilePicture(userId, req.file);
            
          
            const fileUploader = new FileUploaderForS3();
            const key = updatedUser.mediaUrls[0];
            const signedUrl = await fileUploader.myGetSignedUrl(key);

            
            res.json({
                success: true,
                message: 'Profile picture updated successfully',
                data: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    mediaUrls: signedUrl,
                },
            });
        } catch (error) {
            console.error('Error updating profile picture:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update profile picture',
            });
        }
    }
}