import { Request, Response } from 'express';
import { ReportModel } from '../../models/report/reportModel';
import { PrismaClient } from '@prisma/client';
import { container } from 'tsyringe';
import { FirebaseNotifier } from '../../utils/firebaseNotficationsManger';

const prisma = new PrismaClient();
const reportModel = new ReportModel(prisma);

export class ReportController {
  // Create a new report
  async createReport(req: Request, res: Response) {
    console.log("createReport");
    try {
      const {
        reportableType,
        reportReason,
        description,
        reportedUserId,
        transportationListingId,
        accommodationId,
        roomId,
        questionId,
        commentId,
        messageId,
        offerId,
        transportationBookingId,
        accommodationBookingId,
      } = req.body;

      const reporterId = req.user.id;
console.log(reporterId);
      // Validate required fields
      if (!reportableType || !reportReason || !description) {
        return res.status(400).json({
          success: false,
          message: 'reportableType, reportReason, and description are required',
        });
      }

      // Check for duplicate report
      let reportableId: number | undefined;
      if (reportedUserId) reportableId = parseInt(reportedUserId);
      else if (transportationListingId) reportableId = transportationListingId;
      else if (accommodationId) reportableId = accommodationId;
      else if (roomId) reportableId = roomId;
      else if (questionId) reportableId = questionId;
      else if (commentId) reportableId = commentId;
      else if (messageId) reportableId = messageId;
      else if (offerId) reportableId = offerId;
      else if (transportationBookingId) reportableId = transportationBookingId;
      else if (accommodationBookingId) reportableId = accommodationBookingId;

      if (reportableId) {
        const duplicateReport = await reportModel.checkDuplicateReport(
          reporterId,
          reportableType,
          reportableId
        );

        if (duplicateReport) {
          return res.status(400).json({
            success: false,
            message: 'You have already reported this item',
          });
        }
      }

      // Validate reportableType
      const validTypes = [
        'USER',
        'TRANSPORTATION_LISTING',
        'ACCOMMODATION',
        'ROOM',
        'QUESTION',
        'COMMENT',
        'MESSAGE',
        'OFFER',
        'TRANSPORTATION_BOOKING',
        'ACCOMMODATION_BOOKING',
      ];

      if (!validTypes.includes(reportableType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reportableType',
        });
      }

      // Validate that at least one reportable ID is provided
      const reportableIds = [
        reportedUserId,
        transportationListingId,
        accommodationId,
        roomId,
        questionId,
        commentId,
        messageId,
        offerId,
        transportationBookingId,
        accommodationBookingId,
      ];

      if (!reportableIds.some(id => id !== undefined)) {
        return res.status(400).json({
          success: false,
          message: 'At least one reportable ID must be provided',
        });
      }

      const report = await reportModel.createReport({
        reporterId,
        reportableType,
        reportReason,
        description,
        reportedUserId,
        transportationListingId,
        accommodationId,
        roomId,
        questionId,
        commentId,
        messageId,
        offerId,
        transportationBookingId,
        accommodationBookingId,
      });

      // Notify reporter that report was submitted successfully
      try {
        const notifier = container.resolve(FirebaseNotifier);
        await notifier.sendContextualNotification(reporterId, 'REPORT_SUBMITTED', {
          title: 'Report Submitted Successfully',
          body: `Thank you for reporting the ${reportableType.toLowerCase().replace('_', ' ')}. Our team will review your report and take appropriate action if needed.`,
          priority: 'normal',
          actionRequired: false,
          actionUrl: '/reports/my-reports',
          entityType: 'report',
          entityId: report.id
        });
      } catch (notifyError) {
        console.error('Failed to send report submission notification:', notifyError);
      }

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: report,
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get all reports (admin only)
  async getAllReports(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        reportableType,
        reporterId,
      } = req.query;

      const reports = await reportModel.getAllReports(
        parseInt(page as string),
        parseInt(limit as string),
        status as string,
        reportableType as string,
        reporterId as string
      );

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get a specific report by ID
  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reportId = parseInt(id);

      if (isNaN(reportId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report ID',
        });
      }

      const report = await reportModel.getReportById(reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Update report status (admin only)
  async updateReportStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;
      const resolvedBy = req.user.id;

      const reportId = parseInt(id);

      if (isNaN(reportId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report ID',
        });
      }

      // Validate status
      const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, investigating, resolved, dismissed',
        });
      }

      // Check if report exists
      const existingReport = await reportModel.getReportById(reportId);
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      const updatedReport = await reportModel.updateReportStatus(
        reportId,
        status,
        resolvedBy,
        resolutionNotes
      );

      // Notify the reporter about the status update
      try {
        const notifier = container.resolve(FirebaseNotifier);
        let statusMessage = '';
        let actionUrl = '/reports/my-reports';
        let actionRequired = false;
        
        switch(status) {
          case 'investigating':
            statusMessage = 'Thank you for your report. Our team is now investigating the issue and will take appropriate action if needed.';
            break;
          case 'resolved':
            statusMessage = 'Your report has been reviewed and resolved. Thank you for helping us maintain a safe community.';
            actionRequired = false;
            break;
          case 'dismissed':
            statusMessage = 'Your report has been reviewed. After investigation, no action was required at this time. Thank you for your vigilance.';
            break;
          default:
            statusMessage = `Your report status has been updated to ${status}.`;
        }

        await notifier.sendContextualNotification(existingReport.reporterId, 'REPORT_UPDATE', {
          title: `Report Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          body: statusMessage,
          priority: 'normal',
          actionRequired: actionRequired,
          actionUrl: actionUrl,
          entityType: 'report',
          entityId: reportId
        });
      } catch (notifyError) {
        console.error('Failed to send report status notification:', notifyError);
      }

      res.status(200).json({
        success: true,
        message: 'Report status updated successfully',
        data: updatedReport,
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get reports by reporter ID
  async getReportsByReporter(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const reporterId = req.user.id;

      const reports = await reportModel.getReportsByReporter(
        reporterId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching user reports:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get reports by reported user ID
  async getReportsByReportedUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const reports = await reportModel.getReportsByReportedUser(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports for user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get report statistics (admin only)
  async getReportStatistics(req: Request, res: Response) {
    try {
      const statistics = await reportModel.getReportStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Delete a report (admin only)
  async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reportId = parseInt(id);

      if (isNaN(reportId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report ID',
        });
      }

      // Check if report exists
      const existingReport = await reportModel.getReportById(reportId);
      if (!existingReport) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      await reportModel.deleteReport(reportId);

      res.status(200).json({
        success: true,
        message: 'Report deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }

  // Get reports by specific type
  async getReportsByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const validTypes = [
        'USER',
        'TRANSPORTATION_LISTING',
        'ACCOMMODATION',
        'ROOM',
        'QUESTION',
        'COMMENT',
        'MESSAGE',
        'OFFER',
        'TRANSPORTATION_BOOKING',
        'ACCOMMODATION_BOOKING',
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type',
        });
      }

      const reports = await reportModel.getAllReports(
        parseInt(page as string),
        parseInt(limit as string),
        status as string,
        type
      );

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  }
}
