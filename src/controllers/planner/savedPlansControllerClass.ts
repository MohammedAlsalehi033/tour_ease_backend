import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

export class SavedPlansControllerClass {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async saveTripPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenicated' });
      }

      const {
        planName,
        startLocation,
        endLocation,
        startTime,
        endTime,
        numberOfTravelers,
        budget,
        interests = [],
        needsReturnTransport = true,
        selectedOutboundTransportId,
        selectedReturnTransportId,
        selectedAccommodationId,
        selectedRoomAllocations = [],
        seatsNeeded,
        planData = {}, // Default to an empty object
        notes,
        tags = [],
        dayToDayActivities = [] // New field for day-to-day activities
      } = req.body;

      // Validation
      if (!planName || !startLocation || !endLocation || !startTime || !endTime || !budget || !numberOfTravelers) {
        return res.status(400).json({
          error: 'Missing required fields: planName, startLocation, endLocation, startTime, endTime, budget, numberOfTravelers'
        });
      }

      // Add day-to-day activities to planData
      planData.dayToDayActivities = dayToDayActivities;

      // Create saved plan
      const savedPlan = await this.prisma.savedTripPlan.create({
        data: {
          userId,
          planName,
          startLocation,
          endLocation,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          numberOfTravelers,
          budget,
          interests,
          needsReturnTransport,
          selectedOutboundTransportId,
          selectedReturnTransportId,
          selectedAccommodationId,
          seatsNeeded,
          planData, // Save the updated planData
          notes,
          tags,
          status: 'draft'
        },
        include: {
          TransportationListing_SavedTripPlan_selectedOutboundTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          },
          TransportationListing_SavedTripPlan_selectedReturnTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          },
          Accommodation: {
            include: {
              rooms: true
            }
          }
        }
      });

      // Save room allocations if provided
      if (selectedRoomAllocations.length > 0) {
        await this.prisma.savedPlanRoomAllocation.createMany({
          data: selectedRoomAllocations.map((alloc: any) => ({
            savedPlanId: savedPlan.id,
            roomId: alloc.roomId,
            numberOfRooms: alloc.numberOfRooms,
            checkInDate: new Date(startTime),
            checkOutDate: new Date(endTime)
          }))
        });
      }

      res.status(201).json({
        success: true,
        data: savedPlan,
        message: 'Trip plan saved successfully'
      });

    } catch (error) {
      console.error("Error saving trip plan:", error);
      res.status(500).json({
        error: "An internal server error occurred.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async getSavedPlans(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { status, tag, sortBy = 'createdAt', order = 'desc' } = req.query;

      const where: any = { userId };
      
      if (status) {
        where.status = status;
      }
      
      if (tag) {
        where.tags = { has: tag };
      }

      const savedPlans = await this.prisma.savedTripPlan.findMany({
        where,
        include: {
          TransportationListing_SavedTripPlan_selectedOutboundTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          },
          TransportationListing_SavedTripPlan_selectedReturnTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          },
          Accommodation: {
            include: {
              rooms: true
            }
          },
          SavedPlanRoomAllocation: {
            include: {
              Room: true
            }
          }
        },
        orderBy: {
          [sortBy as string]: order
        }
      });

      res.status(200).json({
        success: true,
        data: savedPlans,
        count: savedPlans.length
      });

    } catch (error) {
      console.error("Error fetching saved plans:", error);
      res.status(500).json({
        error: "An internal server error occurred.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async getSavedPlanById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const savedPlan = await this.prisma.savedTripPlan.findFirst({
        where: {
          id: parseInt(id),
          userId
        },
        include: {
          TransportationListing_SavedTripPlan_selectedOutboundTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              },
              reviews: { select: { rating: true } }
            }
          },
          TransportationListing_SavedTripPlan_selectedReturnTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              },
              reviews: { select: { rating: true } }
            }
          },
          Accommodation: {
            include: {
              rooms: true,
              reviews: { select: { rating: true } }
            }
          },
          SavedPlanRoomAllocation: {
            include: {
              Room: {
                include: {
                  accommodation: true
                }
              }
            }
          }
        }
      });

      if (!savedPlan) {
        return res.status(404).json({ error: 'Saved plan not found' });
      }

      // Update last viewed timestamp
      await this.prisma.savedTripPlan.update({
        where: { id: savedPlan.id },
        data: { lastViewedAt: new Date() }
      });

      res.status(200).json({
        success: true,
        data: savedPlan
      });

    } catch (error) {
      console.error("Error fetching saved plan:", error);
      res.status(500).json({
        error: "An internal server error occurred.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async updateSavedPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        planName,
        startLocation,
        endLocation,
        startTime,
        endTime,
        numberOfTravelers,
        budget,
        interests,
        needsReturnTransport,
        selectedOutboundTransportId,
        selectedReturnTransportId,
        selectedAccommodationId,
        selectedRoomAllocations,
        seatsNeeded,
        planData,
        notes,
        tags,
        status
      } = req.body;

      // Check ownership
      const existingPlan = await this.prisma.savedTripPlan.findFirst({
        where: {
          id: parseInt(id),
          userId
        }
      });

      if (!existingPlan) {
        return res.status(404).json({ error: 'Saved plan not found or access denied' });
      }

      // Build update data
      const updateData: any = {};
      
      if (planName !== undefined) updateData.planName = planName;
      if (startLocation !== undefined) updateData.startLocation = startLocation;
      if (endLocation !== undefined) updateData.endLocation = endLocation;
      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (numberOfTravelers !== undefined) updateData.numberOfTravelers = numberOfTravelers;
      if (budget !== undefined) updateData.budget = budget;
      if (interests !== undefined) updateData.interests = interests;
      if (needsReturnTransport !== undefined) updateData.needsReturnTransport = needsReturnTransport;
      if (selectedOutboundTransportId !== undefined) updateData.selectedOutboundTransportId = selectedOutboundTransportId;
      if (selectedReturnTransportId !== undefined) updateData.selectedReturnTransportId = selectedReturnTransportId;
      if (selectedAccommodationId !== undefined) updateData.selectedAccommodationId = selectedAccommodationId;
      if (seatsNeeded !== undefined) updateData.seatsNeeded = seatsNeeded;
      if (planData !== undefined) updateData.planData = planData;
      if (notes !== undefined) updateData.notes = notes;
      if (tags !== undefined) updateData.tags = tags;
      if (status !== undefined) updateData.status = status;

      // Update saved plan
      const updatedPlan = await this.prisma.savedTripPlan.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          TransportationListing_SavedTripPlan_selectedOutboundTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          },
          TransportationListing_SavedTripPlan_selectedReturnTransportIdToTransportationListing: {
            include: {
              provider: {
                include: {
                  user: { select: { username: true } }
                }
              }
            }
          },
          Accommodation: {
            include: {
              rooms: true
            }
          },
          SavedPlanRoomAllocation: {
            include: {
              Room: true
            }
          }
        }
      });

      // Update room allocations if provided
      if (selectedRoomAllocations !== undefined) {
        // Delete existing allocations
        await this.prisma.savedPlanRoomAllocation.deleteMany({
          where: { savedPlanId: parseInt(id) }
        });

        // Create new allocations
        if (selectedRoomAllocations.length > 0) {
          await this.prisma.savedPlanRoomAllocation.createMany({
            data: selectedRoomAllocations.map((alloc: any) => ({
              savedPlanId: parseInt(id),
              roomId: alloc.roomId,
              numberOfRooms: alloc.numberOfRooms,
              checkInDate: new Date(updateData.startTime || existingPlan.startTime),
              checkOutDate: new Date(updateData.endTime || existingPlan.endTime)
            }))
          });
        }
      }

      res.status(200).json({
        success: true,
        data: updatedPlan,
        message: 'Trip plan updated successfully'
      });

    } catch (error) {
      console.error("Error updating saved plan:", error);
      res.status(500).json({
        error: "An internal server error occurred.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async deleteSavedPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check ownership
      const existingPlan = await this.prisma.savedTripPlan.findFirst({
        where: {
          id: parseInt(id),
          userId
        }
      });

      if (!existingPlan) {
        return res.status(404).json({ error: 'Saved plan not found or access denied' });
      }

      // Delete plan (room allocations will be cascade deleted)
      await this.prisma.savedTripPlan.delete({
        where: { id: parseInt(id) }
      });

      res.status(200).json({
        success: true,
        message: 'Trip plan deleted successfully'
      });

    } catch (error) {
      console.error("Error deleting saved plan:", error);
      res.status(500).json({
        error: "An internal server error occurred.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  public async bookSavedPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get saved plan with all details
      const savedPlan = await this.prisma.savedTripPlan.findFirst({
        where: {
          id: parseInt(id),
          userId
        },
        include: {
          TransportationListing_SavedTripPlan_selectedOutboundTransportIdToTransportationListing: true,
          TransportationListing_SavedTripPlan_selectedReturnTransportIdToTransportationListing: true,
          Accommodation: true,
          SavedPlanRoomAllocation: {
            include: {
              Room: true
            }
          }
        }
      });

      if (!savedPlan) {
        return res.status(404).json({ error: 'Saved plan not found or access denied' });
      }

      const bookingResult: any = {
        success: true,
        bookings: {
          transportationBookings: {},
          accommodationBookings: []
        },
        totalCost: 0,
        errors: []
      };

      // Book outbound transport
      if (savedPlan.selectedOutboundTransportId && savedPlan.seatsNeeded) {
        try {
          const transport = savedPlan.TransportationListing_SavedTripPlan_selectedOutboundTransportIdToTransportationListing!;
          const totalPrice = Number(transport.pricePerSeat) * savedPlan.seatsNeeded;

          // Create offer
          const offer = await this.prisma.offer.create({
            data: {
              senderId: userId,
              recipientId: transport.providerId,
              transportationListingId: transport.id,
              pricePerSeat: transport.pricePerSeat,
              seatsRequested: savedPlan.seatsNeeded,
              message: `Booking from saved plan: ${savedPlan.planName}`,
              status: 'pending'
            }
          });

          // Create booking
          const booking = await this.prisma.transportationBooking.create({
            data: {
              travelerId: userId,
              transportationListingId: transport.id,
              offerId: offer.id,
              seatsBooked: savedPlan.seatsNeeded,
              totalPrice,
              status: 'pending',
              bookingSource: 'saved_plan'
            }
          });

          bookingResult.bookings.transportationBookings.outbound = {
            id: booking.id,
            status: booking.status,
            totalPrice: Number(booking.totalPrice),
            offerId: offer.id
          };
          bookingResult.totalCost += Number(booking.totalPrice);

          // Notify driver
          await this.prisma.notification.create({
            data: {
              userId: transport.providerId,
              message: `New booking request for ${savedPlan.seatsNeeded} seat(s)`,
              type: 'booking_request'
            }
          });

        } catch (error) {
          bookingResult.errors.push(`Outbound transport booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Book return transport
      if (savedPlan.selectedReturnTransportId && savedPlan.seatsNeeded) {
        try {
          const transport = savedPlan.TransportationListing_SavedTripPlan_selectedReturnTransportIdToTransportationListing!;
          const totalPrice = Number(transport.pricePerSeat) * savedPlan.seatsNeeded;

          const offer = await this.prisma.offer.create({
            data: {
              senderId: userId,
              recipientId: transport.providerId,
              transportationListingId: transport.id,
              pricePerSeat: transport.pricePerSeat,
              seatsRequested: savedPlan.seatsNeeded,
              message: `Return trip from saved plan: ${savedPlan.planName}`,
              status: 'pending'
            }
          });

          const booking = await this.prisma.transportationBooking.create({
            data: {
              travelerId: userId,
              transportationListingId: transport.id,
              offerId: offer.id,
              seatsBooked: savedPlan.seatsNeeded,
              totalPrice,
              status: 'pending',
              bookingSource: 'saved_plan'
            }
          });

          bookingResult.bookings.transportationBookings.return = {
            id: booking.id,
            status: booking.status,
            totalPrice: Number(booking.totalPrice),
            offerId: offer.id
          };
          bookingResult.totalCost += Number(booking.totalPrice);

          await this.prisma.notification.create({
            data: {
              userId: transport.providerId,
              message: `New return trip booking request for ${savedPlan.seatsNeeded} seat(s)`,
              type: 'booking_request'
            }
          });

        } catch (error) {
          bookingResult.errors.push(`Return transport booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Book accommodations
      if (savedPlan.SavedPlanRoomAllocation && savedPlan.SavedPlanRoomAllocation.length > 0) {
        for (const allocation of savedPlan.SavedPlanRoomAllocation) {
          for (let i = 0; i < allocation.numberOfRooms; i++) {
            try {
              const numberOfNights = Math.ceil(
                (savedPlan.endTime.getTime() - savedPlan.startTime.getTime()) / (1000 * 60 * 60 * 24)
              );
              const totalPrice = Number(allocation.Room.pricePerNight) * numberOfNights;

              const booking = await this.prisma.accommodationBooking.create({
                data: {
                  travelerId: userId,
                  roomId: allocation.roomId,
                  checkInDate: allocation.checkInDate,
                  checkOutDate: allocation.checkOutDate,
                  totalPrice,
                  status: 'confirmed'
                }
              });

              bookingResult.bookings.accommodationBookings.push({
                id: booking.id,
                roomId: booking.roomId,
                status: booking.status,
                totalPrice: Number(booking.totalPrice)
              });
              bookingResult.totalCost += Number(booking.totalPrice);

            } catch (error) {
              bookingResult.errors.push(`Room ${allocation.roomId} booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        // Notify accommodation provider
        if (savedPlan.Accommodation && bookingResult.bookings.accommodationBookings.length > 0) {
          await this.prisma.notification.create({
            data: {
              userId: savedPlan.Accommodation.providerId,
              message: `New booking from saved plan: ${bookingResult.bookings.accommodationBookings.length} room(s)`,
              type: 'accommodation_booking'
            }
          });
        }
      }

      // Update saved plan status to booked
      await this.prisma.savedTripPlan.update({
        where: { id: savedPlan.id },
        data: { status: 'booked' }
      });

      bookingResult.success = bookingResult.errors.length === 0;
      bookingResult.message = bookingResult.success 
        ? 'Saved plan booked successfully' 
        : 'Partial booking completed with some errors';

      const statusCode = bookingResult.success ? 200 : 207;
      res.status(statusCode).json(bookingResult);

    } catch (error) {
      console.error("Error booking saved plan:", error);
      res.status(500).json({
        error: "An internal server error occurred.",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default SavedPlansControllerClass;
