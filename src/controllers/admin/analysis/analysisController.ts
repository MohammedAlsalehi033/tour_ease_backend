import { Request, Response } from 'express';
import { AnalyticsFilters, AnalyticsModel } from '../../../models/admin/analtics/analysis';

export class AnalyticsController {
    private analyticsModel: AnalyticsModel;

    constructor(analyticsModel: AnalyticsModel) {
        this.analyticsModel = analyticsModel;
        this.getAnalyticsOverview = this.getAnalyticsOverview.bind(this);
        this.getUserAnalytics = this.getUserAnalytics.bind(this);
        this.getTransportationBookingAnalytics = this.getTransportationBookingAnalytics.bind(this);
        this.getAccommodationBookingAnalytics = this.getAccommodationBookingAnalytics.bind(this);
        this.getContentAnalytics = this.getContentAnalytics.bind(this);
        this.getRatingAnalytics = this.getRatingAnalytics.bind(this);
        this.getProviderAnalytics = this.getProviderAnalytics.bind(this);
        this.exportAnalytics = this.exportAnalytics.bind(this);
    }

    private parseAnalyticsFilters(query: Request['query']): AnalyticsFilters {
        const filters: AnalyticsFilters = {};
        if (query.startDate && typeof query.startDate === 'string') {
            filters.startDate = new Date(query.startDate);
        }
        if (query.endDate && typeof query.endDate === 'string') {
            filters.endDate = new Date(query.endDate);
            filters.endDate.setHours(23, 59, 59, 999);
        }
        if (query.status && typeof query.status === 'string') {
            filters.status = query.status;
        }
        if (query.location && typeof query.location === 'string') {
            filters.location = query.location;
        }
        if (query.startLocation && typeof query.startLocation === 'string') {
            filters.startLocation = query.startLocation;
        }
        if (query.endLocation && typeof query.endLocation === 'string') {
            filters.endLocation = query.endLocation;
        }
        if (query.roleName && typeof query.roleName === 'string') {
            filters.roleName = query.roleName;
        }
        if (query.reviewableType && typeof query.reviewableType === 'string') {
            filters.reviewableType = query.reviewableType;
        }
        if (query.userType && typeof query.userType === 'string') {
            filters.userType = query.userType;
        }
        return filters;
    }

    async getAnalyticsOverview(req: Request, res: Response) {
        try {
            const [
                totalUsers,
                totalTransBookings,
                totalAccBookings,
                totalRevenue,
                avgRating
            ] = await Promise.all([
                this.analyticsModel.getTotalUserCount(),
                this.analyticsModel.getTotalTransportationBookings({ status: 'confirmed' }),
                this.analyticsModel.getTotalAccommodationBookings({ status: 'confirmed' }),
                this.analyticsModel.getTotalRevenue({ status: 'confirmed' }),
                this.analyticsModel.getAverageRatingOverall()
            ]);

            const overviewData = {
                totalUsers,
                totalBookings: totalTransBookings + totalAccBookings,
                totalTransportationBookings: totalTransBookings,
                totalAccommodationBookings: totalAccBookings,
                totalRevenue: totalRevenue.total.toNumber(),
                averageRating: avgRating ?? 0
            };

            res.status(200).json({
                success: true,
                data: overviewData
            });
        } catch (error : any) {
            console.error("Error fetching analytics overview:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch analytics overview.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getUserAnalytics(req: Request, res: Response) {
        try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

            const [
                registrationsOverTime,
                countByRole,
                countByStatus
            ] = await Promise.all([
                 this.analyticsModel.getUserRegistrationsOverTime(interval, filters),
                 this.analyticsModel.getUserCountByRole(filters),
                 this.analyticsModel.getUserCountByStatus(filters)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    registrationsOverTime,
                    countByRole,
                    countByStatus
                }
            });
        } catch (error : any) {
             console.error("Error fetching user analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch user analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getTransportationBookingAnalytics(req: Request, res: Response) {
        try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

            const [
                volumeOverTime,
                valueOverTime,
                avgValue,
                statusDistribution
            ] = await Promise.all([
                this.analyticsModel.getTransportationBookingVolumeOverTime(interval, filters),
                this.analyticsModel.getTransportationBookingValueOverTime(interval, filters),
                this.analyticsModel.getAverageTransportationBookingValue(filters),
                this.analyticsModel.getTransportationBookingStatusDistribution(filters)
            ]);

            // For now, set popularRoutes to empty array until method is implemented
            const popularRoutes: any[] = [];

            res.status(200).json({
                success: true,
                data: {
                    volumeOverTime,
                    valueOverTime,
                    averageBookingValue: avgValue,
                    statusDistribution,
                    popularRoutes
                }
            });
        } catch (error : any) {
            console.error("Error fetching transportation booking analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch transportation booking analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getAccommodationBookingAnalytics(req: Request, res: Response) {
         try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

            const [
                volumeOverTime,
                valueOverTime,
                avgValue,
                statusDistribution
            ] = await Promise.all([
                this.analyticsModel.getAccommodationBookingVolumeOverTime(interval, filters),
                this.analyticsModel.getAccommodationBookingValueOverTime(interval, filters),
                this.analyticsModel.getAverageAccommodationBookingValue(filters),
                this.analyticsModel.getAccommodationBookingStatusDistribution(filters)
            ]);

            // For now, set these to empty arrays until methods are implemented
            const popularLocations: any[] = [];
            const popularRoomTypes: any[] = [];

            res.status(200).json({
                success: true,
                data: {
                    volumeOverTime,
                    valueOverTime,
                    averageBookingValue: avgValue,
                    statusDistribution,
                    popularLocations,
                    popularRoomTypes
                }
            });
        } catch (error : any) {
             console.error("Error fetching accommodation booking analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch accommodation booking analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getContentAnalytics(req: Request, res: Response) {
         try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

             const [
                questionsOverTime,
                reviewsOverTime,
                offerStatusCounts
             ] = await Promise.all([
                 this.analyticsModel.getQuestionCountOverTime(interval, filters),
                 this.analyticsModel.getReviewCountOverTime(interval, filters),
                 this.analyticsModel.getOfferActivityByStatus(filters)
             ]);

            // For now, set these to empty arrays until methods are implemented
            const commentCounts: any[] = [];
            const voteDistribution: any[] = [];

            res.status(200).json({
                success: true,
                data: {
                    questionsOverTime,
                    reviewsOverTime,
                    offerStatusCounts,
                    commentCounts,
                    voteDistribution
                }
            });
        } catch (error : any) {
             console.error("Error fetching content analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch content analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getRatingAnalytics(req: Request, res: Response) {
         try {
            const filters = this.parseAnalyticsFilters(req.query);
            const reviewableType = typeof req.query.reviewableType === 'string' ? req.query.reviewableType : undefined;

            const [
                avgOverall,
                avgByType,
                distribution
            ] = await Promise.all([
                this.analyticsModel.getAverageRatingOverall(filters),
                this.analyticsModel.getAverageRatingByType(filters),
                this.analyticsModel.getRatingDistribution({ ...filters, reviewableType })
            ]);

            // For now, set this to empty array until method is implemented
            const ratingTrends: any[] = [];

            res.status(200).json({
                success: true,
                data: {
                    averageRatingOverall: avgOverall,
                    averageRatingByType: avgByType,
                    ratingDistribution: distribution,
                    ratingTrends
                }
            });
        } catch (error : any) {
            console.error("Error fetching rating analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch rating analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getProviderAnalytics(req: Request, res: Response) {
         try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

             const [
                transportProviderStatusCounts,
                accommodationProviderCount
             ] = await Promise.all([
                 this.analyticsModel.getTransportationProviderCountByStatus(filters),
                 this.analyticsModel.getAccommodationProviderCount(filters)
             ]);

            // For now, set these to empty arrays until methods are implemented
            const providerApplicationsOverTime: any[] = [];
            const topPerformingProviders: any[] = [];

            res.status(200).json({
                success: true,
                data: {
                    transportProviderStatusCounts,
                    accommodationProviderCount,
                    providerApplicationsOverTime,
                    topPerformingProviders
                }
            });
        } catch (error : any) {
             console.error("Error fetching provider analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch provider analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async exportAnalytics(req: Request, res: Response) {
        try {
            const filters = this.parseAnalyticsFilters(req.query);
            const format = typeof req.query.format === 'string' ? req.query.format : 'json'; 
            const reportType = typeof req.query.reportType === 'string' ? req.query.reportType : 'overview';

            let reportData: any;
            
            switch (reportType) {
                case 'overview':
                    const [
                        totalUsers,
                        totalTransBookings,
                        totalAccBookings,
                        totalRevenue,
                        avgRating
                    ] = await Promise.all([
                        this.analyticsModel.getTotalUserCount(filters),
                        this.analyticsModel.getTotalTransportationBookings({ ...filters, status: 'confirmed' }),
                        this.analyticsModel.getTotalAccommodationBookings({ ...filters, status: 'confirmed' }),
                        this.analyticsModel.getTotalRevenue({ ...filters, status: 'confirmed' }),
                        this.analyticsModel.getAverageRatingOverall(filters)
                    ]);

                    reportData = {
                        totalUsers,
                        totalBookings: totalTransBookings + totalAccBookings,
                        totalTransportationBookings: totalTransBookings,
                        totalAccommodationBookings: totalAccBookings,
                        totalRevenue: totalRevenue.total.toNumber(),
                        averageRating: avgRating ?? 0
                    };
                    break;
                    
                case 'users':
                    const interval = req.query.interval === 'week' || req.query.interval === 'month' ? 
                        req.query.interval : 'day';
                    
                    const [
                        registrationsOverTime,
                        countByRole,
                        countByStatus
                    ] = await Promise.all([
                        this.analyticsModel.getUserRegistrationsOverTime(interval, filters),
                        this.analyticsModel.getUserCountByRole(filters),
                        this.analyticsModel.getUserCountByStatus(filters)
                    ]);
                    
                    // For now, set this to empty array until method is implemented
                    const activeUsersOverTime: any[] = [];
                    
                    reportData = {
                        registrationsOverTime,
                        countByRole,
                        countByStatus,
                        activeUsersOverTime
                    };
                    break;
                    
                case 'bookings_transport':
                    const transInterval = req.query.interval === 'week' || req.query.interval === 'month' ? 
                        req.query.interval : 'day';
                        
                    const [
                        volumeOverTime,
                        valueOverTime,
                        avgValue,
                        statusDistribution
                    ] = await Promise.all([
                        this.analyticsModel.getTransportationBookingVolumeOverTime(transInterval, filters),
                        this.analyticsModel.getTransportationBookingValueOverTime(transInterval, filters),
                        this.analyticsModel.getAverageTransportationBookingValue(filters),
                        this.analyticsModel.getTransportationBookingStatusDistribution(filters)
                    ]);
                    
                    // For now, set this to empty array until method is implemented
                    const popularRoutes: any[] = [];
                    
                    reportData = {
                        volumeOverTime,
                        valueOverTime,
                        averageBookingValue: avgValue,
                        statusDistribution,
                        popularRoutes
                    };
                    break;
                    
                case 'bookings_accommodation':
                    const accInterval = req.query.interval === 'week' || req.query.interval === 'month' ? 
                        req.query.interval : 'day';
                        
                    const [
                        accVolumeOverTime,
                        accValueOverTime,
                        accAvgValue,
                        accStatusDistribution
                    ] = await Promise.all([
                        this.analyticsModel.getAccommodationBookingVolumeOverTime(accInterval, filters),
                        this.analyticsModel.getAccommodationBookingValueOverTime(accInterval, filters),
                        this.analyticsModel.getAverageAccommodationBookingValue(filters),
                        this.analyticsModel.getAccommodationBookingStatusDistribution(filters)
                    ]);
                    
                    // For now, set these to empty arrays until methods are implemented
                    const popularLocations: any[] = [];
                    const popularRoomTypes: any[] = [];
                    
                    reportData = {
                        volumeOverTime: accVolumeOverTime,
                        valueOverTime: accValueOverTime,
                        averageBookingValue: accAvgValue,
                        statusDistribution: accStatusDistribution,
                        popularLocations,
                        popularRoomTypes
                    };
                    break;
                    
                case 'content':
                    const contentInterval = req.query.interval === 'week' || req.query.interval === 'month' ? 
                        req.query.interval : 'day';
                        
                    const [
                        questionsOverTime,
                        reviewsOverTime,
                        offerStatusCounts
                    ] = await Promise.all([
                        this.analyticsModel.getQuestionCountOverTime(contentInterval, filters),
                        this.analyticsModel.getReviewCountOverTime(contentInterval, filters),
                        this.analyticsModel.getOfferActivityByStatus(filters)
                    ]);
                    
                    // For now, set these to empty arrays until methods are implemented
                    const commentCounts: any[] = [];
                    const voteDistribution: any[] = [];
                    
                    reportData = {
                        questionsOverTime,
                        reviewsOverTime,
                        offerStatusCounts,
                        commentCounts,
                        voteDistribution
                    };
                    break;
                    
                case 'ratings':
                    const reviewableType = typeof req.query.reviewableType === 'string' ? 
                        req.query.reviewableType : undefined;
                        
                    const [
                        avgOverall,
                        avgByType,
                        distribution
                    ] = await Promise.all([
                        this.analyticsModel.getAverageRatingOverall(filters),
                        this.analyticsModel.getAverageRatingByType(filters),
                        this.analyticsModel.getRatingDistribution({ ...filters, reviewableType })
                    ]);
                    
                    // For now, set this to empty array until method is implemented
                    const ratingTrends: any[] = [];
                    
                    reportData = {
                        averageRatingOverall: avgOverall,
                        averageRatingByType: avgByType,
                        ratingDistribution: distribution,
                        ratingTrends
                    };
                    break;
                    
                case 'providers':
                    const providerInterval = req.query.interval === 'week' || req.query.interval === 'month' ? 
                        req.query.interval : 'day';
                        
                    const [
                        transportProviderStatusCounts,
                        accommodationProviderCount
                    ] = await Promise.all([
                        this.analyticsModel.getTransportationProviderCountByStatus(filters),
                        this.analyticsModel.getAccommodationProviderCount(filters)
                    ]);
                    
                    // For now, set these to empty arrays until methods are implemented
                    const providerApplicationsOverTime: any[] = [];
                    const topPerformingProviders: any[] = [];
                    
                    reportData = {
                        transportProviderStatusCounts,
                        accommodationProviderCount,
                        providerApplicationsOverTime,
                        topPerformingProviders
                    };
                    break;
                
                default:
                    return res.status(400).json({ success: false, message: 'Invalid report type' });
            }

            if (format === 'pdf') {
                try {
                    const pdfBuffer = await this.generatePdfReport(reportData, reportType);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${reportType}.pdf"`);
                    res.send(pdfBuffer);
                } catch (error : any) {
                    // If PDF generation fails due to missing dependency, provide a helpful message
                    if (error instanceof Error && error.message.includes('pdfkit')) {
                        return res.status(500).json({ 
                            success: false, 
                            message: "PDF export requires additional dependencies. Please install pdfkit: npm install pdfkit",
                            error: error.message
                        });
                    }
                    // Otherwise, throw the original error to be caught by the outer try/catch
                    throw error;
                }
            } 
            else if (format === 'csv') {
                try {
                    const csvData = await this.generateCsvReport(reportData, reportType);
                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${reportType}.csv"`);
                    res.send(csvData);
                } catch (error : any) {
                    // If CSV generation fails due to missing dependency, provide a helpful message
                    if (error instanceof Error && error.message.includes('json2csv')) {
                        return res.status(500).json({ 
                            success: false, 
                            message: "CSV export requires additional dependencies. Please install json2csv: npm install json2csv",
                            error: error.message
                        });
                    }
                    // Otherwise, throw the original error to be caught by the outer try/catch
                    throw error;
                }
            }
            else {
                res.status(200).json({ success: true, data: reportData });
            }

        } catch (error : any) {
            console.error(`Error exporting analytics report (${req.query.reportType} / ${req.query.format}):`, error);
            res.status(500).json({
                success: false,
                message: "Failed to export analytics data.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    
    private async generatePdfReport(data: any, reportType: string): Promise<Buffer> {
        try {
            // Try to dynamically import PDFKit
            let PDFDocument;
            try {
                PDFDocument = require('pdfkit');
            } catch (error : any) {
                throw new Error('PDF generation requires the "pdfkit" package. Please install it using: npm install pdfkit');
            }
            
            const doc = new PDFDocument();
            
            const buffers: Buffer[] = [];
            doc.on('data', (chunk: Buffer) => buffers.push(chunk));
            
            // Add title
            doc.fontSize(20).text(`Analytics Report: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, {
                align: 'center'
            });
            
            // Add date
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, {
                align: 'center'
            });
            
            doc.moveDown(2);
            
            // Format and add data based on report type
            doc.fontSize(16).text('Summary Data');
            doc.moveDown(1);
            
            // Format data based on reportType
            if (reportType === 'overview') {
                for (const [key, value] of Object.entries(data)) {
                    doc.fontSize(12).text(`${key}: ${value}`);
                }
            } else {
                // For more complex data structures, we'd need more sophisticated formatting
                // This is simplified
                doc.fontSize(12).text(JSON.stringify(data, null, 2));
            }
            
            doc.end();
            
            return new Promise((resolve) => {
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
            });
        } catch (error : any) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }
    
    private async generateCsvReport(data: any, reportType: string): Promise<string> {
        try {
            // Try to dynamically import json2csv
            let Parser;
            try {
                const json2csv = require('json2csv');
                Parser = json2csv.Parser;
            } catch (error : any) {
                throw new Error('CSV generation requires the "json2csv" package. Please install it using: npm install json2csv');
            }
            
            // Format data for CSV export based on report type
            let formattedData : any = [];
            
            if (reportType === 'overview') {
                // For a simple flat object like overview data
                formattedData = [data]; // Convert single object to array for CSV conversion
            } 
            else if (Array.isArray(data)) {
                // If data is already an array
                formattedData = data;
            } 
            else {
                // For nested data structures, we need to flatten them
                // This is a simplified approach - real implementation would be more sophisticated
                try {
                    if (data.volumeOverTime) {
                        formattedData = data.volumeOverTime;
                    } else {
                        // Try to extract the first array we find
                        for (const [key, value] of Object.entries(data)) {
                            if (Array.isArray(value)) {
                                formattedData = value;
                                break;
                            }
                        }
                        
                        // If we didn't find any arrays, use the object as is
                        if (formattedData.length === 0) {
                            formattedData = [data];
                        }
                    }
                } catch (error : any) {
                    console.error('Error formatting data for CSV export:', error);
                    formattedData = [{ error: 'Data formatting error', data: JSON.stringify(data) }];
                }
            }
            
            // Define fields based on the data structure
            const fields = Object.keys(formattedData[0] || {});
            
            const parser = new Parser({ fields });
            const csv = parser.parse(formattedData);
            
            return csv;
        } catch (error : any) {
            console.error('Error generating CSV:', error);
            throw error;
        }
    }
}