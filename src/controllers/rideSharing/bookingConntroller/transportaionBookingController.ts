import { TransportationListing } from '@prisma/client'; // This import seems unused in the provided snippet, but kept as requested.
import { transportationBookingModel } from '../../../models/rideSharing/bookingModel';
import { container } from 'tsyringe';
import { FirebaseNotifier } from '../../../utils/firebaseNotficationsManger';
import { prisma } from '../../../utils/prismaClient';

export class transportationBookingController {
    private transportationBookingModelInstance: transportationBookingModel;

    constructor(transportationBookingModelInstance: transportationBookingModel) {
        this.transportationBookingModelInstance = transportationBookingModelInstance;
    }

    async getBookingByTravelerId(req, res) { 
        const { travlerId } = req.params; 

        if (!travlerId) {
            return res.status(400).json({
                success: false,
                message: "Traveler ID parameter is required."
            });
        }

        try {
            const data = await this.transportationBookingModelInstance.getBookingByTravelerId(travlerId); 
            return res.status(200).json({
                success: true,
                data: data
            });
        } catch (error) {
            console.error("Error in getBookingByTravelerId:", error);
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error retrieving traveler bookings."
            });
        }
    }

    async getBookingByTransporationProviderId(req, res) {
        const { providerId } = req.params; 

        if (!providerId) {
            return res.status(400).json({
                success: false,
                message: "Provider ID parameter is required."
            });
        }
        
        try {
            const data = await this.transportationBookingModelInstance.getBookingsByProviderId(providerId);
            return res.status(200).json({
                success: true,
                data: data
            });
        } catch (error) {
            console.error("Error in getBookingByTransporationProviderId:", error);
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error retrieving provider bookings."
            });
        }
    }

    async updateBookingStatus (req, res){
        try {
            const {bookingId , status} = req.query
            const data = await this.transportationBookingModelInstance.changeBookingState(bookingId, status) 
            const notificationManager = container.resolve(FirebaseNotifier);
            
            // Get traveler info for better context
            const travelerInfo = await prisma.user.findUnique({
                where: { id: data.travelerId },
                select: { username: true }
            });
            
            let statusMessage = '';
            let actionUrl = '';
            let actionRequired = false;
            
            switch(status) {
                case 'confirmed':
                    statusMessage = 'Great news! Your ride booking has been confirmed by the provider. Please prepare for your upcoming trip and arrive at the pickup location on time.';
                    actionUrl = `/bookings/${bookingId}`;
                    actionRequired = true;
                    break;
                case 'completed':
                    statusMessage = 'Your ride has been completed successfully! We hope you had a great experience. Please consider leaving a review for your provider.';
                    actionUrl = `/bookings/${bookingId}/review`;
                    actionRequired = true;
                    break;
                case 'cancelled':
                    statusMessage = 'Unfortunately, your ride booking has been cancelled. You can browse for alternative transportation options or contact support if you need assistance.';
                    actionUrl = '/browse/transportation';
                    actionRequired = true;
                    break;
                default:
                    statusMessage = `Your ride booking status has been updated to ${status}.`;
                    actionUrl = `/bookings/${bookingId}`;
            }

            await notificationManager.sendContextualNotification(data.travelerId, 'BOOKING_UPDATE', {
                title: `Booking Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                body: statusMessage,
                priority: status === 'cancelled' ? 'high' : 'normal',
                actionRequired: actionRequired,
                actionUrl: actionUrl,
                entityType: 'transportation_booking',
                entityId: bookingId
            });

            return res.status(200).json({
                success: true,
                data: data
            });
        } catch (error) {
            console.error("Error in getBookingByTransporationProviderId:", error);
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : "Internal server error retrieving provider bookings."
            });
        }
    }
}