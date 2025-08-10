// controllers/planController.js

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const serializeContext = (data, title) => {
  if (!data || data.length === 0) return '';
  return `\n--- ${title.toUpperCase()} ---\n${JSON.stringify(data, null, 2)}\n`;
};


export const generatePlan = async (req, res) => {
  try {
    const { startLocation, endLocation, startTime, endTime, interests, budget } = req.body;

    if (!startLocation || !endLocation || !startTime || !endTime || !budget) {
      return res.status(400).json({ error: 'Missing required fields for plan generation.' });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const availableAccommodations = await prisma.accommodation.findMany({
      where: {
        location: { 
          contains: endLocation,
          mode: 'insensitive',
        },
        rooms: {
          some: {
            pricePerNight: { lte: budget }, // Simple budget check
            bookings: {
              none: {
                OR: [
                  { checkInDate: { lte: endDate }, checkOutDate: { gte: startDate } },
                ],
              },
            },
          },
        },
      },
      include: {
        rooms: {
          select: { roomType: true, pricePerNight: true, capacity: true }
        },
        reviews: {
          select: { rating: true }
        }
      },
      take: 5 
    });

    
    const availableTransportation = await prisma.transportationListing.findMany({
      where: {
        startLocationText: { contains: startLocation, mode: 'insensitive' },
        endLocationText: { contains: endLocation, mode: 'insensitive' },
        departureTime: { gte: startDate, lte: new Date(startDate.getTime() + 2 * 60 * 60 * 1000) }, 
        pricePerSeat: { lte: budget },
        status: 'active'
      },
      include: {
        provider: {
          include: {
            user: { select: { username: true } },
          }
        },
        reviews: { select: { rating: true } }
      },
      take: 5
    });

    // C. Find "local knowledge" from your Questions model (creative use of existing data)
    const localKnowledge = await prisma.question.findMany({
        where: {
            OR: interests.map(interest => ({
                OR: [
                    { title: { contains: interest, mode: 'insensitive' } },
                    { description: { contains: interest, mode: 'insensitive' } },
                    { tags: { has: interest } }
                ]
            }))
        },
        select: { title: true, description: true, upvotes: true },
        orderBy: { upvotes: 'desc' },
        take: 5
    });


    // 3. AUGMENTATION (The "A" in RAG)
    // Clean up data for the prompt
    const cleanAccommodations = availableAccommodations.map(a => ({
        name: a.name ,
        location: a.location,
        avgRating: a.reviews.length > 0 ? a.reviews.reduce((acc, r) => acc + r.rating, 0) / a.reviews.length : 'N/A',
        rooms: a.rooms.map(r => ({ type: r.roomType, price: r.pricePerNight }))
    }));
    
    const cleanTransportation = availableTransportation.map(t => ({
        provider: t.provider.user.username,
        vehicleType: t.provider.vehicleType,
        pricePerSeat: t.pricePerSeat,
        departureTime: t.departureTime,
        avgRating: t.reviews.length > 0 ? t.reviews.reduce((acc, r) => acc + r.rating, 0) / t.reviews.length : 'N/A',
    }));

    const prompt = `
      You are an expert travel planner for a ride-sharing and accommodation app.
      Your task is to generate 2-3 distinct travel plans based on a user's request and real-time data from our database.
      You MUST return the output as a single, minified JSON object, with no markdown formatting.
      The JSON object should have a single key "plans", which is an array of plan objects. Each plan object must include: 'planName', 'description', 'steps' (an array of actions with time, description, and estimatedCost), and 'totalCost'.

      --- USER REQUEST ---
      - Destination: ${endLocation}
      - From: ${startLocation}
      - Trip Dates: ${startTime} to ${endTime}
      - Interests: ${interests.join(', ')}
      - Total Budget: $${budget}

      --- CONTEXTUAL DATA FROM DATABASE ---
      ${serializeContext(cleanAccommodations, 'Available Accommodations')}
      ${serializeContext(cleanTransportation, 'Available Transportation')}
      ${serializeContext(localKnowledge, 'Local Tips & Questions')}
      --- END OF DATA ---

      Now, generate the travel plans as a single, minified JSON object.
    `;

    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    
    let plans;
    try {
      plans = JSON.parse(text);
    } catch (e) {
      console.error("Error parsing Gemini response:", text);
      return res.status(500).json({ error: "Failed to generate a valid plan. The model returned an unexpected format." });
    }

    
    res.status(200).json(plans);

  } catch (error) {
    console.error("Error in plan generation:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};