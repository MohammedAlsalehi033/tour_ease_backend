import { Request, Response } from 'express'; // Assuming Express types
import { AnalyticsFilters, AnalyticsModel } from '../../../models/admin/analtics/analysis';

export class AnalyticsController {
    private analyticsModel: AnalyticsModel;

    // Inject the AnalyticsModel
    constructor(analyticsModel: AnalyticsModel) {
        this.analyticsModel = analyticsModel;
        // Bind methods to ensure 'this' context is correct if methods are passed as callbacks
        this.getAnalyticsOverview = this.getAnalyticsOverview.bind(this);
        this.getUserAnalytics = this.getUserAnalytics.bind(this);
        this.getTransportationBookingAnalytics = this.getTransportationBookingAnalytics.bind(this);
        this.getAccommodationBookingAnalytics = this.getAccommodationBookingAnalytics.bind(this);
        this.getContentAnalytics = this.getContentAnalytics.bind(this);
        this.getRatingAnalytics = this.getRatingAnalytics.bind(this);
        this.getProviderAnalytics = this.getProviderAnalytics.bind(this);
        // Add binds for any other methods you create
    }

    /**
     * Helper function to parse filters from request query
     */
    private parseAnalyticsFilters(query: Request['query']): AnalyticsFilters {
        const filters: AnalyticsFilters = {};
        if (query.startDate && typeof query.startDate === 'string') {
            filters.startDate = new Date(query.startDate);
        }
        if (query.endDate && typeof query.endDate === 'string') {
            filters.endDate = new Date(query.endDate);
            // Optional: Set end date to end of day
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
        // Add parsing for other potential filters like userType, reviewableType etc.
        return filters;
    }

    /**
     * 7a: Get Overview Analytics Data (Key Metrics)
     */
    async getAnalyticsOverview(req: Request, res: Response) {
        try {
            // Fetch multiple key metrics concurrently
            const [
                totalUsers,
                totalTransBookings,
                totalAccBookings,
                totalRevenue, // Fetch combined revenue
                avgRating
            ] = await Promise.all([
                this.analyticsModel.getTotalUserCount(),
                this.analyticsModel.getTotalTransportationBookings({ status: 'confirmed' }), // Example filter
                this.analyticsModel.getTotalAccommodationBookings({ status: 'confirmed' }), // Example filter
                this.analyticsModel.getTotalRevenue({ status: 'confirmed' }), // Example filter
                this.analyticsModel.getAverageRatingOverall()
            ]);

            const overviewData = {
                totalUsers,
                totalBookings: totalTransBookings + totalAccBookings,
                totalTransportationBookings: totalTransBookings,
                totalAccommodationBookings: totalAccBookings,
                totalRevenue: totalRevenue.total.toNumber(), // Convert Decimal to number
                averageRating: avgRating ?? 0 // Handle null rating
            };

            res.status(200).json({
                success: true,
                data: overviewData
            });
        } catch (error) {
            console.error("Error fetching analytics overview:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch analytics overview.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 7b/7c: Get Detailed User Analytics (with Filters)
     */
    async getUserAnalytics(req: Request, res: Response) {
        try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

            // Fetch different user metrics based on query or separate endpoints
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
                    // Add more user analytics data as needed
                }
            });
        } catch (error) {
             console.error("Error fetching user analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch user analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

     /**
     * 7b/7c: Get Detailed Transportation Booking Analytics (with Filters)
     */
    async getTransportationBookingAnalytics(req: Request, res: Response) {
        try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

            const [
                volumeOverTime,
                valueOverTime,
                avgValue,
                statusDistribution
                // Add calls for popular routes, etc. here if needed
            ] = await Promise.all([
                this.analyticsModel.getTransportationBookingVolumeOverTime(interval, filters),
                this.analyticsModel.getTransportationBookingValueOverTime(interval, filters),
                this.analyticsModel.getAverageTransportationBookingValue(filters),
                this.analyticsModel.getTransportationBookingStatusDistribution(filters)
                 // Example: this.analyticsModel.getPopularTransportationRoutes(filters) // Assuming this method exists
            ]);

            res.status(200).json({
                success: true,
                data: {
                    volumeOverTime,
                    valueOverTime,
                    averageBookingValue: avgValue,
                    statusDistribution,
                     // popularRoutes: popularRoutesData // Include data from added calls
                }
            });
        } catch (error) {
            console.error("Error fetching transportation booking analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch transportation booking analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 7b/7c: Get Detailed Accommodation Booking Analytics (with Filters)
     */
    async getAccommodationBookingAnalytics(req: Request, res: Response) {
         try {
            const filters = this.parseAnalyticsFilters(req.query);
            const interval = req.query.interval === 'week' || req.query.interval === 'month' ? req.query.interval : 'day';

            const [
                volumeOverTime,
                valueOverTime,
                avgValue,
                statusDistribution
                // Add calls for popular locations, room types etc.
            ] = await Promise.all([
                this.analyticsModel.getAccommodationBookingVolumeOverTime(interval, filters),
                this.analyticsModel.getAccommodationBookingValueOverTime(interval, filters),
                this.analyticsModel.getAverageAccommodationBookingValue(filters),
                this.analyticsModel.getAccommodationBookingStatusDistribution(filters)
                // Example: this.analyticsModel.getPopularAccommodationLocations(filters)
            ]);

            res.status(200).json({
                success: true,
                data: {
                    volumeOverTime,
                    valueOverTime,
                    averageBookingValue: avgValue,
                    statusDistribution,
                     // popularLocations: popularLocationsData
                }
            });
        } catch (error) {
             console.error("Error fetching accommodation booking analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch accommodation booking analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

     /**
     * 7b/7c: Get Detailed Content Engagement Analytics (with Filters)
     */
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
                 // Add calls for comments, votes etc. if needed
             ]);

            res.status(200).json({
                success: true,
                data: {
                    questionsOverTime,
                    reviewsOverTime,
                    offerStatusCounts
                    // Add more content analytics data as needed
                }
            });
        } catch (error) {
             console.error("Error fetching content analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch content analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

     /**
     * 7b/7c: Get Detailed Rating Analytics (with Filters)
     */
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

            res.status(200).json({
                success: true,
                data: {
                    averageRatingOverall: avgOverall,
                    averageRatingByType: avgByType,
                    ratingDistribution: distribution
                }
            });
        } catch (error) {
            console.error("Error fetching rating analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch rating analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

     /**
     * 7b/7c: Get Detailed Provider Analytics (with Filters)
     */
    async getProviderAnalytics(req: Request, res: Response) {
         try {
            const filters = this.parseAnalyticsFilters(req.query);

             const [
                transportProviderStatusCounts,
                accommodationProviderCount
             ] = await Promise.all([
                 this.analyticsModel.getTransportationProviderCountByStatus(filters),
                 this.analyticsModel.getAccommodationProviderCount(filters)
                 // Add calls for new applications over time etc. if needed
             ]);


            res.status(200).json({
                success: true,
                data: {
                    transportProviderStatusCounts,
                    accommodationProviderCount
                    // Add more provider analytics data as needed
                }
            });
        } catch (error) {
             console.error("Error fetching provider analytics:", error);
             res.status(500).json({
                success: false,
                message: "Failed to fetch provider analytics.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * 7d: Export Analytics Data (Placeholder)
     * This would involve fetching data similar to detailed views
     * and then formatting it into a downloadable format (e.g., PDF, CSV).
     */
    async exportAnalytics(req: Request, res: Response) {
        try {
            const filters = this.parseAnalyticsFilters(req.query);
            const format = req.query.format || 'json'; // pdf, csv
            const reportType = req.query.reportType || 'overview'; // users, bookings_transport, etc.

            // 1. Fetch data based on reportType and filters (similar to detailed view methods)
            let reportData: any;
            switch (reportType) {
                 case 'overview':
                    // Fetch overview data - reuse logic from getAnalyticsOverview or call model methods
                    reportData = await /* ... fetch overview data ... */ {};
                    break;
                 case 'users':
                     reportData = await /* ... fetch user analytics data ... */ {};
                    break;
                 // Add cases for other report types
                default:
                    return res.status(400).json({ success: false, message: 'Invalid report type' });
            }


            // 2. Format the data based on the requested format
            if (format === 'pdf') {
                // Use a library like pdfkit or puppeteer to generate PDF
                // const pdfBuffer = await generatePdfReport(reportData); // Implement this function
                // res.setHeader('Content-Type', 'application/pdf');
                // res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${reportType}.pdf"`);
                // res.send(pdfBuffer);
                 res.status(501).json({ success: false, message: 'PDF export not implemented yet.' }); // Placeholder
            } else if (format === 'csv') {
                 // Use a library like 'json2csv' to generate CSV
                // const csvData = await generateCsvReport(reportData); // Implement this function
                // res.setHeader('Content-Type', 'text/csv');
                // res.setHeader('Content-Disposition', `attachment; filename="analytics_report_${reportType}.csv"`);
                // res.send(csvData);
                 res.status(501).json({ success: false, message: 'CSV export not implemented yet.' }); // Placeholder
            }
             else { // Default to JSON
                res.status(200).json({ success: true, data: reportData });
            }

        } catch (error) {
            console.error(`Error exporting analytics report (${req.query.reportType} / ${req.query.format}):`, error);
             res.status(500).json({
                success: false,
                message: "Failed to export analytics data.",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

}