import RequestModel from '../../../models/rideSharing/requestModel';
import { Request, Response } from 'express';

export default class RequestController {
  private requestModel: RequestModel;

  constructor(requestModel: RequestModel) {
    this.requestModel = requestModel;
  }

  async createRequest(req: Request, res: Response) {
    try {
      const {
        travelerId,
        startLocationText,
        endLocationText,
        startLocationLat,
        startLocationLng,
        endLocationLat,
        endLocationLng,
        departureTime,
        seatsNeeded,
        budget
      } = req.body;

      if (!travelerId || !startLocationText || !endLocationText || 
          !departureTime || !seatsNeeded || budget === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }
      console.log(startLocationLat, startLocationLng, endLocationLat, endLocationLng);

      const newRequest = await this.requestModel.createRequest(
        travelerId,
        startLocationText,
        endLocationText,
        startLocationLat,
        startLocationLng,
        endLocationLat,
        endLocationLng,
        new Date(departureTime),
        Number(seatsNeeded),
        Number(budget)
      );

      return res.status(201).json({
        success: true,
        data: newRequest
      });
    } catch (error) {
      console.error("Error in createRequest controller:", error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  async findNearbyRequests(req: Request, res: Response) {
    try {
      const { lat, lng, radiusKm = 30 } = req.query; 

      if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({
          success: false, 
          error: 'Valid latitude and longitude are required'
        });
      }

      const results = await this.requestModel.searchNearbyRequests(
        Number(lat), 
        Number(lng), 
        radiusKm ? Number(radiusKm) : 30
      );
    
      return res.status(200).json({
        success: true,
        count: results.length,
        data: results
      });
    } catch (error) {
      console.error("Error in findNearbyRequests controller:", error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      }); 
    }
  }
}