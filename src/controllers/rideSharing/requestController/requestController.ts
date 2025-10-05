import { container } from 'tsyringe';
import RequestModel from '../../../models/rideSharing/requestModel';
import { Request, Response } from 'express';
import { FirebaseNotifier } from '../../../utils/firebaseNotficationsManger';
import { FileUploaderForS3 } from '../../../utils/FileUploader';

export default class RequestController {
  private requestModel: RequestModel;
  private fileUploaderForS3: FileUploaderForS3;

  constructor(requestModel: RequestModel) {
    this.requestModel = requestModel;
    this.fileUploaderForS3 = new FileUploaderForS3();
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
        departureTime instanceof Date ? departureTime :new Date(departureTime),
        Number(seatsNeeded),
        Number(budget)
      );

      // Notify traveler that their request was created
      try {
        const notifier = container.resolve(FirebaseNotifier);
        await notifier.sendContextualNotification(travelerId, 'REQUEST', {
          title: "Ride Request Posted Successfully",
          body: `Your ride request from ${startLocationText} to ${endLocationText} has been posted and is now visible to transportation providers.`,
          priority: 'normal',
          actionRequired: false,
          actionUrl: `/requests/${newRequest.id}`,
          entityType: 'transportation_request',
          entityId: newRequest.id
        });
      } catch (notifyError) {
        // Log only — do not fail the request on notification issues
        console.error('Failed to send request creation notification:', notifyError);
      }
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
      const { 
        lat, 
        lng, 
        radiusKm = 30, 
        latEnd, 
        lngEnd,
        // New filtering parameters
        startTime,           // Time of day filter start (HH:MM format or ISO string)
        endTime,             // Time of day filter end (HH:MM format or ISO string)
        minBudget,           // Minimum budget filter
        maxBudget,           // Maximum budget filter
        maxSeatsNeeded,      // Maximum seats needed (shows requests with <= this value)
        sortBy = 'distance'  // Sort by: 'distance', 'budget_asc', 'budget_desc', 'time_asc', 'time_desc'
      } = req.query; 

      // Validate required parameters
      if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({
          success: false, 
          error: 'Valid latitude and longitude are required'
        });
      }

      // Validate optional numeric parameters
      if (minBudget && isNaN(Number(minBudget))) {
        return res.status(400).json({
          success: false, 
          error: 'minBudget must be a valid number'
        });
      }

      if (maxBudget && isNaN(Number(maxBudget))) {
        return res.status(400).json({
          success: false, 
          error: 'maxBudget must be a valid number'
        });
      }

      if (maxSeatsNeeded && isNaN(Number(maxSeatsNeeded))) {
        return res.status(400).json({
          success: false, 
          error: 'maxSeatsNeeded must be a valid number'
        });
      }

      // Build filter options object
      const filterOptions = {
        radiusKm: radiusKm ? Number(radiusKm) : 30,
        endLat: latEnd && lngEnd ? Number(latEnd) : undefined,
        endLng: latEnd && lngEnd ? Number(lngEnd) : undefined,
        startTime: startTime ? String(startTime) : undefined,
        endTime: endTime ? String(endTime) : undefined,
        minBudget: minBudget ? Number(minBudget) : undefined,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        maxSeatsNeeded: maxSeatsNeeded ? Number(maxSeatsNeeded) : undefined,
        sortBy: sortBy ? String(sortBy) : 'distance'
      };

      const results = await this.requestModel.searchNearbyRequests(
        Number(lat), 
        Number(lng), 
        filterOptions
      );

      // Sign S3 URLs for user media
      const resultsWithSigned = await Promise.all(
        results.map(async (request: any) => {
          if (request?.user?.mediaUrls?.length > 0) {
            const signed = await Promise.all(
              request.user.mediaUrls.map((url: string) => this.fileUploaderForS3.myGetSignedUrl(url))
            );
            return { ...request, user: { ...request.user, mediaUrls: signed } };
          }
          return request;
        })
      );

      return res.status(200).json({
        success: true,
        count: resultsWithSigned.length,
        data: resultsWithSigned,
        filters: filterOptions // Return applied filters for frontend reference
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