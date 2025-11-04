import { MessageController } from "../../controllers/chat/chatController";
import { PrismaMessageModel } from "../../models/chat/chatModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";
import { Server as SocketIOServer } from "socket.io";
import express from 'express';
import authMiddleware from "../../middleware/authMiddleware";
import UserModel from "../../models/userModel";
import { auth } from "firebase-admin";

// Export a function that takes the io instance and connectedUsers Map and returns the router
export const createChatRouter = (io, connectedUsers) => {
  const router = express.Router();
  
  const messageController = new MessageController(
    new PrismaMessageModel(), 
    new FileUploaderForS3(),
    io,
    connectedUsers,
    new UserModel()

  );
  
  // Get all unique chat partners for a user
  router.get("/chats/:userId",authMiddleware(["traveler"]) ,messageController.getChatsForUser.bind(messageController));
  
  // Get messages between two specific users (with pagination and sorting)
  router.get("/messages",authMiddleware(["traveler"]), messageController.getMessagesBetweenUsers.bind(messageController));
  
  // Send a new message
  router.post("/messages",authMiddleware(["traveler"]), messageController.sendMessage.bind(messageController));
  
  // Delete a specific message by ID
  router.delete("/messages/:id", messageController.deleteMessage.bind(messageController));
  
  // Get a specific message by ID
  router.get("/messages/:id", messageController.getMessageById.bind(messageController));
  
  return router;
};

// For CommonJS compatibility
module.exports = {
  createChatRouter
};