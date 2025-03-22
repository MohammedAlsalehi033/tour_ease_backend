// BaseModel.ts - Abstract class defining the interface


  import { BaseModel } from './questionBaseModel';
  import { Question, PrismaClient } from '@prisma/client';
  
  const prisma = new PrismaClient();
  
  export class PrismaQuestionModel extends BaseModel<Question> {
    async getAllItems(page = 1, limit = 10, sort = 'newest'): Promise<Question[]> {
      const skip = (page - 1) * limit;
      
      let orderBy = {};
      switch (sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'popular':
          orderBy = { upvotes: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
      
      return prisma.question.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
            }
          },
          _count: {
            select: { comments: true }
          }
        }
      });
    }
  
    async getItemById(id: number | string): Promise<Question | null> {
      return prisma.question.findUnique({
        where: { id: typeof id === 'string' ? parseInt(id) : id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
    }
  
    async createItem(data: any): Promise<Question> {
      return prisma.question.create({
        data: {
          title: data.title,
          description: data.description,
          tags: data.tags || [],
          userId: data.userId
        }
      });
    }
  
    async updateItem(id: number | string, data: any): Promise<Question> {
      return prisma.question.update({
        where: { id: typeof id === 'string' ? parseInt(id) : id },
        data: {
          title: data.title,
          description: data.description,
          tags: data.tags || []
        }
      });
    }
  
    async deleteItem(id: number | string): Promise<Question> {
      return prisma.question.delete({
        where: { id: typeof id === 'string' ? parseInt(id) : id }
      });
    }
  
    async searchItems(query: string, page = 1, limit = 10): Promise<Question[]> {
      const skip = (page - 1) * limit;
      
      return prisma.question.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } }
          ]
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
            }
          },
          _count: {
            select: { comments: true }
          }
        }
      });
    }
  
    async createComment(data: any) {
      return prisma.comment.create({
        data: {
          content: data.content,
          questionId: data.questionId,
          userId: data.userId
        },
        include: {
          user: {
            select: {
              id: true,

            }
          }
        }
      });
    }
  
    async voteQuestion(id: number | string, isUpvote: boolean) {
      const question = await prisma.question.findUnique({
        where: { id: typeof id === 'string' ? parseInt(id) : id }
      });
  
      if (!question) {
        throw new Error('Question not found');
      }
  
      return prisma.question.update({
        where: { id: typeof id === 'string' ? parseInt(id) : id },
        data: {
          upvotes: isUpvote ? question.upvotes + 1 : question.upvotes,
          downvotes: !isUpvote ? question.downvotes + 1 : question.downvotes
        }
      });
    }
  }



 
  
