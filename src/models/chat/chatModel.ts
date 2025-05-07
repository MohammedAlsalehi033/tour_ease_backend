import { Message } from "@prisma/client";
import { prisma } from "../../utils/prismaClient";

export class PrismaMessageModel {
  async getChatsByUserId(userId: string): Promise<
  {
    userId: string;
    partnerId: string;
    userName: string;
    lastMessage: string;
    timestamp: string;
    avatarUrl: string;
    isUnread: boolean;
  }[]
> {
  try {
    // First, get the latest message with each unique conversation partner
    const chats = await prisma.$queryRaw<
      {
        userId: string;
        partnerId: string;
        userName: string;
        lastMessage: string;
        timestamp: string;
        avatarUrl: string;
        isUnread: boolean;
      }[]
    >`
      WITH LastMessages AS (
        SELECT 
          ${userId} AS userId,
          CASE
            WHEN m."senderId" = ${userId} THEN m."receiverId"
            ELSE m."senderId"
          END AS partnerId,
          m.content AS message_content,
          m."sentAt" AS message_timestamp,
          m."senderId" AS sender_id,
          ROW_NUMBER() OVER (
            PARTITION BY 
              CASE
                WHEN m."senderId" = ${userId} THEN m."receiverId"
                ELSE m."senderId"
              END
            ORDER BY m."sentAt" DESC
          ) AS rn
        FROM "Message" m
        WHERE m."senderId" = ${userId} OR m."receiverId" = ${userId}
      )
      SELECT 
        lm.userId AS "userId",
        lm.partnerId AS "partnerId",
        u.username AS "userName",
        lm.message_content AS "lastMessage",
        lm.message_timestamp::text AS "timestamp",
        (
          CASE 
            WHEN array_length(u."mediaUrls", 1) > 0 
            THEN u."mediaUrls"[1] 
            ELSE '' 
          END
        ) AS "avatarUrl",
        CASE
          -- Since there's no isRead field, we'll consider messages sent TO the user as potentially unread
          -- You might want to adjust this logic based on your application's needs
          WHEN lm.sender_id != ${userId} THEN true
          ELSE false
        END AS "isUnread"
      FROM LastMessages lm
      JOIN "User" u ON lm.partnerId = u.id
      WHERE lm.rn = 1
      ORDER BY lm.message_timestamp DESC
    `;
    
    return chats;
  } catch (error) {
    console.error("Error fetching user chats:", error);
    return [];
  }
}

  async getMessagesBySenderAndReceiverId(
    senderId: string,
    receiverId: string,
    page = 1,
    limit = 20,
    sort = "oldest"
  ): Promise<
    {
      id: number;
      senderId: string;
      receiverId: string;
      content: string;
      sentAt: Date;
    }[]
  > {
    const skip = (page - 1) * limit;
    let orderBy = {};
    switch (sort) {
      case "newest":
        orderBy = { sentAt: "desc" };
        break;
      case "oldest":
        orderBy = { sentAt: "asc" };
        break;
      default:
        orderBy = { sentAt: "asc" };
    }

    return prisma.message.findMany({
      // skip,
      // take: limit,
      orderBy,
      where: {
        OR: [
          {
            senderId: senderId,
            receiverId: receiverId,
          },
          {
            senderId: receiverId,
            receiverId: senderId,
          },
        ],
      },
    });
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<{
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    sentAt: Date;
  }> {
    return prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });
  }

  getItemById(id: number | string): Promise<Message | null> {
    let messageId: number;

    if (typeof id === "string") {
      messageId = parseInt(id, 10);
      if (isNaN(messageId)) {
        throw new Error(
          "Invalid ID format. ID must be a number or a numeric string."
        );
      }
    } else {
      messageId = id;
    }

    return prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });
  }

  async deleteItem(id: number | string): Promise<Message> {
    let messageId: number;

    if (typeof id === "string") {
      messageId = parseInt(id, 10);
      if (isNaN(messageId)) {
        throw new Error(
          "Invalid ID format. ID must be a number or a numeric string."
        );
      }
    } else {
      messageId = id;
    }

    try {
      const deletedMessage = await prisma.message.delete({
        where: {
          id: messageId,
        },
      });
      return deletedMessage;
    } catch (error: any) {
      if (error.code === "P2025") {
        // Prisma error code for record not found
        throw new Error(`Message with ID ${messageId} not found.`);
      }
      console.error(`Error deleting message with ID ${messageId}:`, error);
      throw new Error(`Could not delete message: ${error.message}`);
    }
  }
}