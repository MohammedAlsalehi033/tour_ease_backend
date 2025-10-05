import { BaseModel } from "./questionBaseModel";
import { Question, PrismaClient } from "@prisma/client";
import { prisma } from '../../utils/prismaClient';


export class PrismaQuestionModel extends BaseModel<any> {
  async getAllItems(
    page = 1,
    limit = 10,
    sort = "newest"
  ): Promise<Question[]> {
    const skip = (page - 1) * limit;

    let orderBy = {};
    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "popular":
        orderBy = { upvotes: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    return prisma.question.findMany({
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        vote: {},
        _count: {
          select: { comments: true },
        },
      },
    });
  }

  async getItemById(id: string): Promise<any> {
    console.log("activating getItemById");
    return prisma.question.findUnique({
      where: { id: typeof id === "string" ? parseInt(id) : id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        vote: true, // Include vote data so users can see their previous votes
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                mediaUrls: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  async createItem(data: any): Promise<Question> {
    return prisma.question.create({
      data: {
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        userId: data.userId,
      },
    });
  }

  async updateItem(id: number | string, data: any): Promise<Question> {
    return prisma.question.update({
      where: { id: typeof id === "string" ? parseInt(id) : id },
      data: {
        title: data.title,
        description: data.description,
        tags: data.tags || [],
      },
    });
  }

  async deleteItem(id: number | string): Promise<Question> {

    return prisma.question.delete({
      where: { id: typeof id === "string" ? parseInt(id) : id },
    });
  }

  async searchItems(query: string, page = 1, limit = 10): Promise<Question[]> {
    const skip = (page - 1) * limit;

    const result =  prisma.question.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
                       id: true,
            username: true,
            mediaUrls: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
    console.log(result)
    return result;
  }

  async createComment(data: any) {
    return prisma.comment.create({
      data: {
        content: data.content,
        questionId: data.questionId,
        userId: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async voteQuestion(id: number | string, isUpvote: boolean, userId: string) {
    const questionId = typeof id === "string" ? parseInt(id) : id;

    return await prisma.$transaction(async (tx) => {
      const existingVote = await tx.vote.findUnique({
        where: { userId_questionId: { userId, questionId } },
      });

      const desiredType = isUpvote ? "UPVOTE" : "DOWNVOTE";
      const isSameVote = existingVote?.type === desiredType;

      let upvotesChange = 0;
      let downvotesChange = 0;

      if (existingVote) {
        if (existingVote.type === "UPVOTE") upvotesChange -= 1;
        else downvotesChange -= 1;
      }

      if (!isSameVote) {
        if (desiredType === "UPVOTE") upvotesChange += 1;
        else downvotesChange += 1;
      }

      if (existingVote) {
        if (isSameVote) {
          await tx.vote.delete({ where: { id: existingVote.id } });
        } else {
          await tx.vote.update({
            where: { id: existingVote.id },
            data: { type: desiredType },
          });
        }
      } else if (!isSameVote) {
        await tx.vote.create({
          data: {
            userId,
            questionId,
            type: desiredType,
          },
        });
      }

      return tx.question.update({
        where: { id: questionId },
        data: {
          upvotes: { increment: upvotesChange },
          downvotes: { increment: downvotesChange },
        },
        include: { vote: true }, 
      });
    });
  }


  async searchQuestionsByTag(tag: string, page = 1, limit = 10): Promise<Question[]> {
    const skip = (page - 1) * limit;
    return prisma.question.findMany({
      where: { tags: { has: tag } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            mediaUrls: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
  }
  
}
