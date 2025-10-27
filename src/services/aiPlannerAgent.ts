import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  PlanGenerationRequest,
  TripPlan,
  TransportationOption,
  AccommodationOption,
  ActivityOption
} from '../Types/plannerTypes';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface IterationAnalysis {
  hasGoodOptions: boolean;
  mainIssues: string[];
  suggestions: {
    budgetAdjustments?: {
      transportationBudget: number;
      accommodationBudget: number;
      reasoning: string;
    };
    dateFlexibility?: {
      suggestedStartDate: string;
      suggestedEndDate: string;
      reasoning: string;
    };
    locationAlternatives?: {
      alternative: string;
      reasoning: string;
    }[];
    searchCriteria?: {
      expandRadius: boolean;
      relaxBudget: number;
      reasoning: string;
    };
  };
  shouldContinueIterating: boolean;
  reasoning: string;
}

interface AIPlanEnhancement {
  enhancedDescription: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  aiRecommendation: string;
  valueScore: number; // 0-100
}

export class AIPlannerAgent {
  /**
   * Analyze search results and suggest improvements
   */
  static async analyzeResults(
    request: PlanGenerationRequest,
    currentResults: TripPlan,
    iterationNumber: number
  ): Promise<IterationAnalysis> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const analysisPrompt = `
You are a travel planning expert analyzing search results to help improve them.

USER REQUEST:
- From: ${request.startLocation} to ${request.endLocation}
- Dates: ${request.startTime} to ${request.endTime}
- Travelers: ${request.numberOfTravelers}
- Budget: $${request.budget}
- Interests: ${request.interests.join(', ')}

CURRENT RESULTS (Iteration ${iterationNumber}):
- Outbound Transport Options: ${currentResults.availableOptions.outboundTransportation.length}
- Return Transport Options: ${currentResults.availableOptions.returnTransportation.length}
- Accommodation Options: ${currentResults.availableOptions.accommodations.length}
- Recommended Plans: ${currentResults.recommendedPlans.length}
- Optimal Plan Score: ${currentResults.optimalPlan?.optimizationScore || 'N/A'}

TRANSPORT OPTIONS SUMMARY:
${JSON.stringify(currentResults.availableOptions.outboundTransportation.slice(0, 3), null, 2)}

ACCOMMODATION OPTIONS SUMMARY:
${JSON.stringify(currentResults.availableOptions.accommodations.slice(0, 3), null, 2)}

TASK: Analyze these results and provide actionable suggestions to improve them.

Consider:
1. Are there enough options? (Good: 3+ transport, 3+ accommodation, 2+ complete plans)
2. Are options within budget or forcing compromises?
3. Is the optimal plan score high enough? (Good: 75+)
4. Are there gaps (e.g., no return transport, no accommodation)?
5. What adjustments might find better options?

RESPOND WITH VALID JSON ONLY (no markdown, no explanations outside JSON):
{
  "hasGoodOptions": boolean,
  "mainIssues": ["issue1", "issue2"],
  "suggestions": {
    "budgetAdjustments": {
      "transportationBudget": number,
      "accommodationBudget": number,
      "reasoning": "why these allocations"
    },
    "dateFlexibility": {
      "suggestedStartDate": "ISO date",
      "suggestedEndDate": "ISO date",
      "reasoning": "why these dates"
    },
    "locationAlternatives": [
      {
        "alternative": "nearby city",
        "reasoning": "why this location"
      }
    ],
    "searchCriteria": {
      "expandRadius": boolean,
      "relaxBudget": number (percentage to increase, e.g., 10 for 10%),
      "reasoning": "why these changes"
    }
  },
  "shouldContinueIterating": boolean,
  "reasoning": "overall assessment"
}
`;

    try {
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const analysis: IterationAnalysis = JSON.parse(cleanedText);
      return analysis;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      
      // Fallback analysis based on simple heuristics
      return this.fallbackAnalysis(request, currentResults, iterationNumber);
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private static fallbackAnalysis(
    request: PlanGenerationRequest,
    currentResults: TripPlan,
    iterationNumber: number
  ): IterationAnalysis {
    const hasTransport = currentResults.availableOptions.outboundTransportation.length > 0;
    const hasReturn = currentResults.availableOptions.returnTransportation.length > 0 || !request.needsReturnTransport;
    const hasAccommodation = currentResults.availableOptions.accommodations.length > 0;
    const hasCompletePlans = currentResults.recommendedPlans.length > 0;
    const optimalScore = currentResults.optimalPlan?.optimizationScore || 0;

    const issues: string[] = [];
    if (!hasTransport) issues.push("No outbound transportation found");
    if (!hasReturn && request.needsReturnTransport) issues.push("No return transportation found");
    if (!hasAccommodation) issues.push("No accommodations found");
    if (optimalScore < 60) issues.push("Low optimization score");

    const hasGoodOptions = hasTransport && hasReturn && hasAccommodation && optimalScore >= 70;
    const shouldContinue = !hasGoodOptions && iterationNumber < 3;

    return {
      hasGoodOptions,
      mainIssues: issues,
      suggestions: {
        budgetAdjustments: {
          transportationBudget: request.budget * 0.35,
          accommodationBudget: request.budget * 0.55,
          reasoning: "Increasing accommodation budget for more options"
        },
        searchCriteria: {
          expandRadius: true,
          relaxBudget: 15,
          reasoning: "Expand search to find more options"
        }
      },
      shouldContinueIterating: shouldContinue,
      reasoning: hasGoodOptions 
        ? "Found sufficient quality options" 
        : "Need more iterations to improve results"
    };
  }

  /**
   * Enhance plan descriptions with AI insights
   */
  static async enhancePlanWithAI(
    plan: any,
    request: PlanGenerationRequest,
    allPlans: any[]
  ): Promise<AIPlanEnhancement> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const enhancementPrompt = `
You are a travel expert providing insights on a trip plan.

USER PROFILE:
- Travelers: ${request.numberOfTravelers}
- Budget: $${request.budget}
- Interests: ${request.interests.join(', ')}

THIS PLAN:
- Name: ${plan.planName}
- Total Cost: $${plan.costs.total}
- Transport: ${plan.outboundTransport ? plan.outboundTransport.vehicleType : 'None'}
- Accommodation: ${plan.accommodation ? plan.accommodation.name : 'None'}
- Optimization Score: ${plan.optimizationScore}

COMPETING PLANS: ${allPlans.length} alternatives available

TASK: Provide a concise, helpful analysis of this plan.

RESPOND WITH VALID JSON ONLY:
{
  "enhancedDescription": "2-3 sentence compelling description",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "bestFor": "type of traveler this suits",
  "aiRecommendation": "brief recommendation",
  "valueScore": number (0-100, value for money)
}

Keep it concise and actionable. Focus on practical insights.
`;

    try {
      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Enhancement Error:", error);
      
      // Fallback enhancement
      return {
        enhancedDescription: plan.description,
        pros: ["Within budget", "Available options"],
        cons: plan.warnings,
        bestFor: "General travelers",
        aiRecommendation: "Solid option for your trip",
        valueScore: plan.optimizationScore
      };
    }
  }

  /**
   * Generate personalized activity suggestions using AI
   */
  static async generateActivitySuggestions(
    location: string,
    interests: string[],
    existingActivities: ActivityOption[],
    numberOfDays: number
  ): Promise<ActivityOption[]> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const activityPrompt = `
You are a local travel expert for ${location}.

TRIP DETAILS:
- Duration: ${numberOfDays} days
- Interests: ${interests.join(', ')}

EXISTING COMMUNITY SUGGESTIONS:
${JSON.stringify(existingActivities.slice(0, 5), null, 2)}

TASK: Suggest ${Math.max(5, 10 - existingActivities.length)} additional activities that complement the existing ones.

RESPOND WITH VALID JSON ONLY (array of activities):
[
  {
    "title": "Activity name",
    "description": "Brief description (1-2 sentences)",
    "estimatedCost": number or null,
    "tags": ["tag1", "tag2"]
  }
]

Make suggestions specific to ${location} and the user's interests. Don't repeat existing activities.
`;

    try {
      const result = await model.generateContent(activityPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const aiActivities = JSON.parse(text);
      
      return aiActivities.map((activity: any) => ({
        title: activity.title,
        description: activity.description,
        upvotes: 0,
        tags: activity.tags || [],
        estimatedCost: activity.estimatedCost,
        source: 'ai_suggestion' as const
      }));
    } catch (error) {
      console.error("AI Activity Generation Error:", error);
      return [];
    }
  }

  /**
   * Handle conversational refinement
   */
  static async handleUserFeedback(
    originalRequest: PlanGenerationRequest,
    currentResults: TripPlan,
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{
    adjustedRequest: Partial<PlanGenerationRequest>;
    explanation: string;
    suggestedChanges: string[];
  }> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const conversationPrompt = `
You are a helpful travel planning assistant having a conversation with a user.

ORIGINAL TRIP REQUEST:
${JSON.stringify(originalRequest, null, 2)}

CURRENT RESULTS SUMMARY:
- Available Plans: ${currentResults.recommendedPlans.length}
- Best Score: ${currentResults.optimalPlan?.optimizationScore || 'N/A'}
- Budget Usage: $${currentResults.optimalPlan?.costs.total || 0} of $${originalRequest.budget}

CONVERSATION HISTORY:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

USER'S LATEST MESSAGE:
"${userMessage}"

TASK: Interpret what the user wants to adjust and suggest parameter changes.

Common requests:
- "cheaper options" → reduce budget or shift allocation
- "better hotels" → increase accommodation budget
- "earlier/later times" → adjust dates
- "luxury/budget trip" → adjust overall budget
- "skip return" → set needsReturnTransport to false

RESPOND WITH VALID JSON ONLY:
{
  "adjustedRequest": {
    "budget": number or omit if no change,
    "startTime": "ISO date" or omit,
    "endTime": "ISO date" or omit,
    "numberOfTravelers": number or omit,
    "needsReturnTransport": boolean or omit,
    "interests": ["interest1"] or omit
  },
  "explanation": "What I understood from your request",
  "suggestedChanges": ["Change 1", "Change 2"]
}
`;

    try {
      const result = await model.generateContent(conversationPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.error("AI Conversation Error:", error);
      
      // Fallback interpretation
      const lowerMessage = userMessage.toLowerCase();
      const adjustedRequest: Partial<PlanGenerationRequest> = {};
      const suggestedChanges: string[] = [];

      if (lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
        adjustedRequest.budget = originalRequest.budget * 0.8;
        suggestedChanges.push('Reduced budget by 20%');
      }
      if (lowerMessage.includes('luxury') || lowerMessage.includes('expensive')) {
        adjustedRequest.budget = originalRequest.budget * 1.3;
        suggestedChanges.push('Increased budget by 30%');
      }
      if (lowerMessage.includes('no return') || lowerMessage.includes('one way')) {
        adjustedRequest.needsReturnTransport = false;
        suggestedChanges.push('Removed return transport requirement');
      }

      return {
        adjustedRequest,
        explanation: "I'll try to adjust based on your feedback",
        suggestedChanges
      };
    }
  }
}
