import { PrismaMessageModel } from "../../models/chat/chatModel";
import { FileUploaderForS3 } from "../../utils/FileUploader";
import { Server as SocketIOServer } from "socket.io";

export class MessageController {
  private messageModel: PrismaMessageModel;
  private fileUploader: FileUploaderForS3;
  private io: SocketIOServer;
  private connectedUsers: Map<string, string>;

  constructor(
    messageModel: PrismaMessageModel, 
    fileUploader: FileUploaderForS3,
    io: SocketIOServer,
    connectedUsers: Map<string, string>
  ) {
    this.messageModel = messageModel;
    this.fileUploader = fileUploader;
    this.io = io;
    this.connectedUsers = connectedUsers;
  }

  private isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private getUserSocketId(userId: string): string | null {
    console.log(this.connectedUsers)
    return this.connectedUsers.get(userId) || null;
  }

  async getChatsForUser(req, res) {
    try {
      const userId = req.params.userId;
      const chatPartners = await this.messageModel.getChatsByUserId(userId);
      
      // Add online status and signed URLs to chat partners
      const chatPartnersWithDetails = await Promise.all(
        chatPartners.map(async (user) => {
          // Check if the user is online
          const isOnline = this.isUserConnected(user.id);
          
          // Sign media URLs if present
          if (user.mediaUrls?.length > 0) {
            const signedUrls = await Promise.all(
              user.mediaUrls.map((url) => this.fileUploader.myGetSignedUrl(url))
            );
            return { 
              ...user, 
              mediaUrls: signedUrls,
              isOnline
            };
          }
          
          return { 
            ...user,
            isOnline
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: chatPartnersWithDetails,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMessagesBetweenUsers(req, res) {
    try {
      const senderId = req.query.senderId as string;
      const receiverId = req.query.receiverId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sort = req.query.sort as string || "oldest";
      
      if (!senderId || !receiverId) {
        return res.status(400).json({
          success: false,
          message: "Both senderId and receiverId are required.",
        });
      }
      
      const messages = await this.messageModel.getMessagesBySenderAndReceiverId(
        senderId,
        receiverId,
        page,
        limit,
        sort
      );
      
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { senderId, receiverId, content } = req.body;
      if (!senderId || !receiverId || !content) {
        return res.status(400).json({
          success: false,
          message: "senderId, receiverId, and content are required.",
        });
      }
      
      const newMessage = await this.messageModel.sendMessage(
        senderId,
        receiverId,
        content
      );
      
      const receiverSocketId = this.getUserSocketId(receiverId);
      console.log(receiverSocketId)
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('new_message', newMessage);
      }
      
      res.status(201).json({
        success: true,
        data: newMessage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const message = await this.messageModel.getItemById(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }
      
      const deletedMessage = await this.messageModel.deleteItem(id);
      
      // Notify both users about the deleted message if they're connected
      const { senderId, receiverId } = message;
      
      const senderSocketId = this.getUserSocketId(senderId);
      if (senderSocketId) {
        this.io.to(senderSocketId).emit('message_deleted', { messageId: id });
      }
      
      const receiverSocketId = this.getUserSocketId(receiverId);
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('message_deleted', { messageId: id });
      }
      
      res.status(200).json({
        success: true,
        data: deletedMessage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMessageById(req, res) {
    try {
      const { id } = req.params;
      const message = await this.messageModel.getItemById(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }
      
      res.status(200).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}