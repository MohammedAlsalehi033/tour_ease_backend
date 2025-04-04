import { prisma } from "../../../utils/prismaClient";

export class PrisnaCommentModel {
  getAllItems(
    page = 1,
    limit = 10,
    sort = 'newest',
    questionId: number
  ): Promise<
    {
      id: number;
      userId: string;
      questionId: number;
      content: string;
      createdAt: Date;
    }[]
  > {
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
    return prisma.comment.findMany({
        skip,
        take: limit,
        orderBy,
        where: {
          questionId: questionId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              mediaUrls: true,
            },
          },
              },
      });

  }
  getItemById(
    id: number | string
  ): Promise<{
    id: number;
    userId: string;
    questionId: number;
    content: string;
    createdAt: Date;
  } | null> {
    throw new Error("Method not implemented.");
  }


  createItem(
    userId : string, questionId : number, content : string
  ): Promise<{
    id: number;
    userId: string;
    questionId: number;
    content: string;
    createdAt: Date;
  }> {
    return prisma.comment.create({
      data: {
        userId,
        questionId,
        content}
  });
  }





  updateItem(
    id: number | string,
    data: any
  ): Promise<{
    id: number;
    userId: string;
    questionId: number;
    content: string;
    createdAt: Date;
  }> {
    throw new Error("Method not implemented.");
  }
  deleteItem(
    id: number | string
  ): Promise<{
    id: number;
    userId: string;
    questionId: number;
    content: string;
    createdAt: Date;
  }> {
    throw new Error("Method not implemented.");
  }
  searchItems(
    query: string,
    page?: number,
    limit?: number
  ): Promise<
    {
      id: number;
      userId: string;
      questionId: number;
      content: string;
      createdAt: Date;
    }[]
  > {
    throw new Error("Method not implemented.");
  }
}
