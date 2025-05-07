import { TransportationListing } from '@prisma/client'; // This import seems unused in the provided snippet, but kept as requested.
import { transportationBookingModel } from '../../../models/rideSharing/bookingModel';

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