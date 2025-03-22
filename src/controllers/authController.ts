import AuthModel from "../models/authModel";
import { UserRole } from "../Types/myEnum";
class AuthController {
    private model: AuthModel;

    constructor(model: AuthModel) {
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
            const {id, username , email, password} = req.body;
            const newUser = await this.model.createUser(id   ,username, email, "", UserRole.TRAVELER);
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

    async getRole(req : any, res : any) {
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
}
export default AuthController;