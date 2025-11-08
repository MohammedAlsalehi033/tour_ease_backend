import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  PlanGenerationRequest,
  TripPlan,
  TransportationOption,
  AccommodationOption,
  ActivityOption
} from '../Types/plannerTypes';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Simple in-memory cache to avoid repeated AI calls
const aiCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

// Feature flags to control AI usage
const AI_FEATURES = {
  USE_AI_ANALYSIS: process.env.USE_AI_ANALYSIS !== 'false', // Can be disabled via env
  USE_AI_ENHANCEMENT: process.env.USE_AI_ENHANCEMENT === 'true', // Opt-in only
  USE_AI_ACTIVITIES: process.env.USE_AI_ACTIVITIES === 'true', // Opt-in only
  USE_AI_FEEDBACK: process.env.USE_AI_FEEDBACK !== 'false',
  MAX_ITERATIONS_FOR_AI: 2 // Only use AI for first 2 iterations
};

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
   * Helper to get cached result or generate new one
   */
  private static getFromCache<T>(key: string): T | null {
    const cached = aiCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result as T;
    }
    if (cached) {
      aiCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private static setCache<T>(key: string, result: T): void {
    aiCache.set(key, { result, timestamp: Date.now() });
    
    // Simple cache size management - keep only last 100 entries
    if (aiCache.size > 100) {
      const firstKey = aiCache.keys().next().value;
      if (firstKey) aiCache.delete(firstKey);
    }
  }

  /**
   * Analyze search results and suggest improvements
   * COST OPTIMIZATION: Uses fallback first, AI only when needed and iteration <= 2
   */
  static async analyzeResults(
    request: PlanGenerationRequest,
    currentResults: TripPlan,
    iterationNumber: number
  ): Promise<IterationAnalysis> {
    // COST SAVING 1: Use fallback analysis first
    const fallback = this.fallbackAnalysis(request, currentResults, iterationNumber);
    
    // COST SAVING 2: Only use AI if fallback says we need it AND we're within iteration limit
    const shouldUseAI = AI_FEATURES.USE_AI_ANALYSIS && 
                        !fallback.hasGoodOptions && 
                        iterationNumber <= AI_FEATURES.MAX_ITERATIONS_FOR_AI;
    
    if (!shouldUseAI) {
      return fallback;
    }

    // COST SAVING 3: Check cache
    const cacheKey = `analysis_${request.startLocation}_${request.endLocation}_${request.budget}_${iterationNumber}`;
    const cached = this.getFromCache<IterationAnalysis>(cacheKey);
    if (cached) {
      console.log('Using cached AI analysis');
      return cached;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // COST SAVING 4: Minimized prompt - only essential data
    const analysisPrompt = `Analyze trip search results. Respond JSON only.
From: ${request.startLocation} to ${request.endLocation}
Budget: $${request.budget}, Travelers: ${request.numberOfTravelers}
Results: ${currentResults.availableOptions.outboundTransportation.length} transport, ${currentResults.availableOptions.accommodations.length} accommodation, Score: ${currentResults.optimalPlan?.optimizationScore || 0}

JSON format:
{"hasGoodOptions": bool, "mainIssues": ["str"], "suggestions": {"budgetAdjustments": {"transportationBudget": num, "accommodationBudget": num, "reasoning": "str"}}, "shouldContinueIterating": bool, "reasoning": "str"}`;

    try {
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const analysis: IterationAnalysis = JSON.parse(text);
      
      // COST SAVING 5: Cache the result
      this.setCache(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return fallback;
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
   * COST OPTIMIZATION: Disabled by default, only top plan gets enhanced
   */
  static async enhancePlanWithAI(
    plan: any,
    request: PlanGenerationRequest,
    allPlans: any[],
    isTopPlan: boolean = false
  ): Promise<AIPlanEnhancement> {
    // COST SAVING 1: Only enhance if feature is enabled AND it's the top plan
    if (!AI_FEATURES.USE_AI_ENHANCEMENT || !isTopPlan) {
      return {
        enhancedDescription: plan.description || `${plan.planName} - Total cost: $${plan.costs.total}`,
        pros: ["Within budget", "Available options"],
        cons: plan.warnings || [],
        bestFor: "General travelers",
        aiRecommendation: "Good option for your trip",
        valueScore: plan.optimizationScore
      };
    }

    // COST SAVING 2: Check cache
    const cacheKey = `enhance_${plan.planName}_${plan.costs.total}`;
    const cached = this.getFromCache<AIPlanEnhancement>(cacheKey);
    if (cached) {
      console.log('Using cached plan enhancement');
      return cached;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // COST SAVING 3: Minimal prompt
    const enhancementPrompt = `Analyze trip plan. JSON only.
Plan: ${plan.planName}, Cost: $${plan.costs.total}, Budget: $${request.budget}, Score: ${plan.optimizationScore}
Format: {"enhancedDescription": "str", "pros": ["str"], "cons": ["str"], "bestFor": "str", "aiRecommendation": "str", "valueScore": num}`;

    try {
      const result = await model.generateContent(enhancementPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const enhancement = JSON.parse(text);
      this.setCache(cacheKey, enhancement);
      return enhancement;
    } catch (error) {
      console.error("AI Enhancement Error:", error);
      
      return {
        enhancedDescription: plan.description || `${plan.planName} - Total cost: $${plan.costs.total}`,
        pros: ["Within budget", "Available options"],
        cons: plan.warnings || [],
        bestFor: "General travelers",
        aiRecommendation: "Solid option for your trip",
        valueScore: plan.optimizationScore
      };
    }
  }

  /**
   * Generate personalized activity suggestions using AI
   * COST OPTIMIZATION: Disabled by default, only generates if explicitly enabled
   */
  static async generateActivitySuggestions(
    location: string,
    interests: string[],
    existingActivities: ActivityOption[],
    numberOfDays: number
  ): Promise<ActivityOption[]> {
    // COST SAVING 1: Only generate if feature is enabled
    if (!AI_FEATURES.USE_AI_ACTIVITIES) {
      console.log('AI activity generation disabled');
      return [];
    }

    // COST SAVING 2: If we already have enough activities, don't generate more
    if (existingActivities.length >= 8) {
      console.log('Sufficient existing activities, skipping AI generation');
      return [];
    }

    // COST SAVING 3: Check cache
    const cacheKey = `activities_${location}_${interests.join('_')}`;
    const cached = this.getFromCache<ActivityOption[]>(cacheKey);
    if (cached) {
      console.log('Using cached activity suggestions');
      return cached;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // COST SAVING 4: Minimal prompt, limit activities generated
    const numToGenerate = Math.min(5, 8 - existingActivities.length);
    const activityPrompt = `Suggest ${numToGenerate} activities for ${location}. Interests: ${interests.join(', ')}. JSON array only:
[{"title": "str", "description": "str", "estimatedCost": num|null, "tags": ["str"]}]`;

    try {
      const result = await model.generateContent(activityPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const aiActivities = JSON.parse(text);
      
      const activities = aiActivities.map((activity: any) => ({
        title: activity.title,
        description: activity.description,
        upvotes: 0,
        tags: activity.tags || [],
        estimatedCost: activity.estimatedCost,
        source: 'ai_suggestion' as const
      }));
      
      this.setCache(cacheKey, activities);
      return activities;
    } catch (error) {
      console.error("AI Activity Generation Error:", error);
      return [];
    }
  }

  /**
   * Handle conversational refinement
   * COST OPTIMIZATION: Uses smarter pattern matching before AI
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
    // COST SAVING 1: Try pattern matching first
    const patternResult = this.patternMatchFeedback(userMessage, originalRequest);
    
    // COST SAVING 2: Only use AI if pattern matching wasn't confident AND feature is enabled
    if (patternResult.confidence > 0.7 || !AI_FEATURES.USE_AI_FEEDBACK) {
      return patternResult.result;
    }

    // COST SAVING 3: Check cache
    const cacheKey = `feedback_${userMessage.toLowerCase().substring(0, 50)}`;
    const cached = this.getFromCache<{
      adjustedRequest: Partial<PlanGenerationRequest>;
      explanation: string;
      suggestedChanges: string[];
    }>(cacheKey);
    if (cached) {
      console.log('Using cached feedback interpretation');
      return cached;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // COST SAVING 4: Minimal prompt - only recent history
    const recentHistory = conversationHistory.slice(-3); // Only last 3 messages
    const conversationPrompt = `Interpret user travel request adjustment. JSON only.
Original budget: $${originalRequest.budget}
User says: "${userMessage}"
Format: {"adjustedRequest": {"budget"?: num}, "explanation": "str", "suggestedChanges": ["str"]}`;

    try {
      const result = await model.generateContent(conversationPrompt);
      const response = await result.response;
      const text = response.text().trim()
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const interpretation = JSON.parse(text);
      this.setCache(cacheKey, interpretation);
      return interpretation;
    } catch (error) {
      console.error("AI Conversation Error:", error);
      return patternResult.result;
    }
  }

  /**
   * Pattern-based feedback interpretation (no AI cost)
   */
  private static patternMatchFeedback(
    userMessage: string,
    originalRequest: PlanGenerationRequest
  ): {
    result: {
      adjustedRequest: Partial<PlanGenerationRequest>;
      explanation: string;
      suggestedChanges: string[];
    };
    confidence: number;
  } {
    const lowerMessage = userMessage.toLowerCase();
    const adjustedRequest: Partial<PlanGenerationRequest> = {};
    const suggestedChanges: string[] = [];
    let confidence = 0.5;

    // Budget adjustments
    if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('save money')) {
      adjustedRequest.budget = originalRequest.budget * 0.8;
      suggestedChanges.push('Reduced budget by 20%');
      confidence = 0.9;
    } else if (lowerMessage.includes('luxury') || lowerMessage.includes('expensive') || lowerMessage.includes('premium')) {
      adjustedRequest.budget = originalRequest.budget * 1.3;
      suggestedChanges.push('Increased budget by 30%');
      confidence = 0.9;
    } else if (lowerMessage.includes('more money') || lowerMessage.includes('increase budget')) {
      adjustedRequest.budget = originalRequest.budget * 1.2;
      suggestedChanges.push('Increased budget by 20%');
      confidence = 0.85;
    }

    // Transport preferences
    if (lowerMessage.includes('no return') || lowerMessage.includes('one way') || lowerMessage.includes('skip return')) {
      adjustedRequest.needsReturnTransport = false;
      suggestedChanges.push('Removed return transport requirement');
      confidence = 0.95;
    }

    // Number of travelers
    const travelersMatch = lowerMessage.match(/(\d+)\s*(people|person|traveler|passenger)/);
    if (travelersMatch) {
      adjustedRequest.numberOfTravelers = parseInt(travelersMatch[1]);
      suggestedChanges.push(`Updated to ${travelersMatch[1]} travelers`);
      confidence = 0.9;
    }

    // If we made changes, we're more confident
    if (suggestedChanges.length === 0) {
      confidence = 0.3;
    }

    return {
      result: {
        adjustedRequest,
        explanation: suggestedChanges.length > 0 
          ? `Based on your feedback: ${suggestedChanges.join(', ')}`
          : "I'll try to adjust based on your feedback",
        suggestedChanges
      },
      confidence
    };
  }
}
