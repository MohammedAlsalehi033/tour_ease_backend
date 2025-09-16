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
      const { lat, lng, radiusKm = 30 , latEnd, lngEnd} = req.query; 

      if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) {
        return res.status(400).json({
          success: false, 
          error: 'Valid latitude and longitude are required'
        });
      }

      const results = await this.requestModel.searchNearbyRequests(
        Number(lat), 
        Number(lng), 
        latEnd && lngEnd ? Number(latEnd) : undefined,
        latEnd && lngEnd ? Number(lngEnd) : undefined,
        radiusKm ? Number(radiusKm) : 30
      );
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
        data: resultsWithSigned
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