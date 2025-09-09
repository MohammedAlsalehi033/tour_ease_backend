import { PrismaClient } from '@prisma/client';

export class ReportModel {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new report
  async createReport(data: {
    reporterId: string;
    reportableType: string;
    reportReason: string;
    description: string;
    reportedUserId?: string;
    transportationListingId?: number;
    accommodationId?: number;
    roomId?: number;
    questionId?: number;
    commentId?: number;
    messageId?: number;
    offerId?: number;
    transportationBookingId?: number;
    accommodationBookingId?: number;
  }) {
    return await this.prisma.report.create({
      data: {
        ...data,
        status: 'pending',
        updatedAt: new Date(),
      },
      include: {
        User_Report_reporterIdToUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        User_Report_reportedUserIdToUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        TransportationListing: {
          select: {
            id: true,
            startLocationText: true,
            endLocationText: true,
            departureTime: true,
          },
        },
        Accommodation: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        Room: {
          select: {
            id: true,
            roomType: true,
            pricePerNight: true,
          },
        },
        Question: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        Comment: {
          select: {
            id: true,
            content: true,
          },
        },
        Message: {
          select: {
            id: true,
            content: true,
            sentAt: true,
          },
        },
        Offer: {
          select: {
            id: true,
            pricePerSeat: true,
            message: true,
          },
        },
        TransportationBooking: {
          select: {
            id: true,
            seatsBooked: true,
            totalPrice: true,
          },
        },
        AccommodationBooking: {
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            totalPrice: true,
          },
        },
      },
    });
  }

  // Get all reports with pagination and filtering
  async getAllReports(
    page: number = 1,
    limit: number = 10,
    status?: string,
    reportableType?: string,
    reporterId?: string
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) where.status = status;
    if (reportableType) where.reportableType = reportableType;
    if (reporterId) where.reporterId = reporterId;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User_Report_reporterIdToUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          User_Report_reportedUserIdToUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          Admin: {
            select: {
              adminId: true,
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get a specific report by ID
  async getReportById(id: number) {
    return await this.prisma.report.findUnique({
      where: { id },
      include: {
        User_Report_reporterIdToUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        User_Report_reportedUserIdToUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        Admin: {
          select: {
            adminId: true,
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        TransportationListing: {
          select: {
            id: true,
            startLocationText: true,
            endLocationText: true,
            departureTime: true,
            provider: {
              select: {
                user: {
                  select: {
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        Accommodation: {
          select: {
            id: true,
            name: true,
            location: true,
            provider: {
              select: {
                user: {
                  select: {
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        Room: {
          select: {
            id: true,
            roomType: true,
            pricePerNight: true,
            accommodation: {
              select: {
                name: true,
                location: true,
              },
            },
          },
        },
        Question: {
          select: {
            id: true,
            title: true,
            description: true,
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        Comment: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
                email: true,
              },
            },
            question: {
              select: {
                title: true,
              },
            },
          },
        },
        Message: {
          select: {
            id: true,
            content: true,
            sentAt: true,
            sender: {
              select: {
                username: true,
                email: true,
              },
            },
            receiver: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        Offer: {
          select: {
            id: true,
            pricePerSeat: true,
            message: true,
            sender: {
              select: {
                username: true,
                email: true,
              },
            },
            recipient: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        TransportationBooking: {
          select: {
            id: true,
            seatsBooked: true,
            totalPrice: true,
            traveler: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
        AccommodationBooking: {
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            totalPrice: true,
            traveler: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Update report status (admin only)
  async updateReportStatus(
    id: number,
    status: string,
    resolvedBy: string,
    resolutionNotes?: string
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
      resolvedBy,
    };

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolvedAt = new Date();
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }
    }

    return await this.prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        User_Report_reporterIdToUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        User_Report_reportedUserIdToUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        Admin: {
          select: {
            adminId: true,
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Get reports by reporter ID
  async getReportsByReporter(reporterId: string, page: number = 1, limit: number = 10) {
    return await this.getAllReports(page, limit, undefined, undefined, reporterId);
  }

  // Get reports by reported user ID
  async getReportsByReportedUser(reportedUserId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { reportedUserId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User_Report_reporterIdToUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          User_Report_reportedUserIdToUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          Admin: {
            select: {
              adminId: true,
              user: {
                select: {
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.report.count({ where: { reportedUserId } }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get report statistics for admin dashboard
  async getReportStatistics() {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByType,
      reportsByStatus,
    ] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'resolved' } }),
      this.prisma.report.count({ where: { status: 'dismissed' } }),
      this.prisma.report.groupBy({
        by: ['reportableType'],
        _count: { id: true },
      }),
      this.prisma.report.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByType: reportsByType.map(item => ({
        type: item.reportableType,
        count: item._count.id,
      })),
      reportsByStatus: reportsByStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
    };
  }

  // Delete a report (admin only)
  async deleteReport(id: number) {
    return await this.prisma.report.delete({
      where: { id },
    });
  }

  // Check if user has already reported the same item
  async checkDuplicateReport(
    reporterId: string,
    reportableType: string,
    reportableId: number
  ) {
    const whereClause: any = {
      reporterId,
      reportableType,
    };

    // Set the appropriate ID field based on reportableType
    switch (reportableType) {
      case 'USER':
        whereClause.reportedUserId = reportableId.toString();
        break;
      case 'TRANSPORTATION_LISTING':
        whereClause.transportationListingId = reportableId;
        break;
      case 'ACCOMMODATION':
        whereClause.accommodationId = reportableId;
        break;
      case 'ROOM':
        whereClause.roomId = reportableId;
        break;
      case 'QUESTION':
        whereClause.questionId = reportableId;
        break;
      case 'COMMENT':
        whereClause.commentId = reportableId;
        break;
      case 'MESSAGE':
        whereClause.messageId = reportableId;
        break;
      case 'OFFER':
        whereClause.offerId = reportableId;
        break;
      case 'TRANSPORTATION_BOOKING':
        whereClause.transportationBookingId = reportableId;
        break;
      case 'ACCOMMODATION_BOOKING':
        whereClause.accommodationBookingId = reportableId;
        break;
    }

    const existingReport = await this.prisma.report.findFirst({
      where: whereClause,
    });

    return existingReport;
  }
}
