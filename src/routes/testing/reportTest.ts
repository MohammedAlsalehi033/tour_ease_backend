import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Test route to create sample data for testing reports
router.post('/create-sample-data', async (req, res) => {
  try {
    // Create sample users
    const user1 = await prisma.user.upsert({
      where: { email: 'testuser1@example.com' },
      update: {},
      create: {
        id: 'test-user-1',
        username: 'testuser1',
        email: 'testuser1@example.com',
        passwordHash: 'hashedpassword1',
        mediaUrls: [],
      },
    });

    const user2 = await prisma.user.upsert({
      where: { email: 'testuser2@example.com' },
      update: {},
      create: {
        id: 'test-user-2',
        username: 'testuser2',
        email: 'testuser2@example.com',
        passwordHash: 'hashedpassword2',
        mediaUrls: [],
      },
    });

    // Create sample admin
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        id: 'admin-user-1',
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: 'hashedadminpassword',
        mediaUrls: [],
      },
    });

    await prisma.admin.upsert({
      where: { adminId: adminUser.id },
      update: {},
      create: {
        adminId: adminUser.id,
        permissions: ['manage_reports', 'manage_users'],
      },
    });

    // Create sample transportation provider
    const transportProvider = await prisma.transportationProvider.upsert({
      where: { providerId: user1.id },
      update: {},
      create: {
        providerId: user1.id,
        licenseMmediaUrls: [],
        vehicleMediaUrls: [],
        vehicleType: 'car',
        seatsAvailable: 4,
      },
    });

    // Create sample transportation listing
    const transportListing = await prisma.transportationListing.create({
      data: {
        providerId: transportProvider.providerId,
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        pricePerSeat: 25.00,
        seatsAvailable: 3,
        startLocationText: 'New York, NY',
        endLocationText: 'Boston, MA',
        startLocationLat: 40.7128,
        startLocationLng: -74.0060,
        endLocationLat: 42.3601,
        endLocationLng: -71.0589,
        mediaUrls: [],
      },
    });

    // Create sample question
    const question = await prisma.question.create({
      data: {
        userId: user2.id,
        title: 'Best places to visit in New York?',
        description: 'I am planning a trip to New York next month. What are the must-visit places?',
        tags: ['travel', 'new-york', 'tourism'],
      },
    });

    // Create sample comment
    const comment = await prisma.comment.create({
      data: {
        userId: user1.id,
        questionId: question.id,
        content: 'You should definitely visit Central Park and Times Square!',
      },
    });

    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        users: [user1, user2, adminUser],
        transportListing,
        question,
        comment,
      },
    });
  } catch (error) {
    console.error('Error creating sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample data',
      error: error.message,
    });
  }
});

// Test route to create sample reports
router.post('/create-sample-reports', async (req, res) => {
  try {
    // Create sample reports
    const reports = [];

    // Report 1: User reports another user
    const report1 = await prisma.report.create({
      data: {
        reporterId: 'test-user-1',
        reportableType: 'USER',
        reportReason: 'Inappropriate behavior',
        description: 'This user sent me inappropriate messages and made me feel uncomfortable.',
        reportedUserId: 'test-user-2',
        status: 'pending',
        updatedAt: new Date(),
      },
    });
    reports.push(report1);

    // Report 2: User reports a transportation listing
    const transportListing = await prisma.transportationListing.findFirst();
    if (transportListing) {
      const report2 = await prisma.report.create({
        data: {
          reporterId: 'test-user-2',
          reportableType: 'TRANSPORTATION_LISTING',
          reportReason: 'Fake listing',
          description: 'This transportation listing appears to be fake. The provider is not responding to messages.',
          transportationListingId: transportListing.id,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
      reports.push(report2);
    }

    // Report 3: User reports a question
    const question = await prisma.question.findFirst();
    if (question) {
      const report3 = await prisma.report.create({
        data: {
          reporterId: 'test-user-1',
          reportableType: 'QUESTION',
          reportReason: 'Spam',
          description: 'This question is spam and not related to travel.',
          questionId: question.id,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
      reports.push(report3);
    }

    // Report 4: User reports a comment
    const comment = await prisma.comment.findFirst();
    if (comment) {
      const report4 = await prisma.report.create({
        data: {
          reporterId: 'test-user-2',
          reportableType: 'COMMENT',
          reportReason: 'Inappropriate content',
          description: 'This comment contains inappropriate language and should be removed.',
          commentId: comment.id,
          status: 'pending',
          updatedAt: new Date(),
        },
      });
      reports.push(report4);
    }

    res.json({
      success: true,
      message: 'Sample reports created successfully',
      data: reports,
    });
  } catch (error) {
    console.error('Error creating sample reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample reports',
      error: error.message,
    });
  }
});

// Test route to get report statistics
router.get('/statistics', async (req, res) => {
  try {
    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      reportsByType,
      reportsByStatus,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.report.count({ where: { status: 'resolved' } }),
      prisma.report.count({ where: { status: 'dismissed' } }),
      prisma.report.groupBy({
        by: ['reportableType'],
        _count: { id: true },
      }),
      prisma.report.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message,
    });
  }
});

// Test route to clean up sample data
router.delete('/cleanup', async (req, res) => {
  try {
    // Delete reports first (due to foreign key constraints)
    await prisma.report.deleteMany({
      where: {
        reporterId: {
          in: ['test-user-1', 'test-user-2', 'admin-user-1'],
        },
      },
    });

    // Delete other sample data
    await prisma.comment.deleteMany({
      where: {
        userId: {
          in: ['test-user-1', 'test-user-2'],
        },
      },
    });

    await prisma.question.deleteMany({
      where: {
        userId: {
          in: ['test-user-1', 'test-user-2'],
        },
      },
    });

    await prisma.transportationListing.deleteMany({
      where: {
        providerId: {
          in: ['test-user-1', 'test-user-2'],
        },
      },
    });

    await prisma.transportationProvider.deleteMany({
      where: {
        providerId: {
          in: ['test-user-1', 'test-user-2'],
        },
      },
    });

    await prisma.admin.deleteMany({
      where: {
        adminId: 'admin-user-1',
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: ['test-user-1', 'test-user-2', 'admin-user-1'],
        },
      },
    });

    res.json({
      success: true,
      message: 'Sample data cleaned up successfully',
    });
  } catch (error) {
    console.error('Error cleaning up sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning up sample data',
      error: error.message,
    });
  }
});

export default router;
