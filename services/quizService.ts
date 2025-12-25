/**
 * Unified Quiz Service
 * 
 * This is the main entry point for quiz generation.
 * It orchestrates between core generator (always available) and AI enhancement (optional).
 * 
 * Institutional Deployment Rationale:
 * - Core generator works without any external dependencies
 * - AI enhancement is opt-in via feature flag
 * - Silent fallback ensures app always works, even if AI is unavailable
 */

import { QuizSettings, QuizData } from '../types';
import { generateQuizCore } from './coreGenerator';
import { getAIConfig, createAIService } from './aiService';

/**
 * Generates a quiz using core generator with optional AI enhancement.
 * 
 * Flow:
 * 1. If AI is enabled and available, attempt AI enhancement
 * 2. If AI fails or is unavailable, silently fall back to core generator
 * 3. Always returns valid QuizData ready for Canvas export
 * 
 * @param settings - Quiz generation settings
 * @returns Promise resolving to QuizData
 */
export async function generateQuiz(settings: QuizSettings): Promise<QuizData> {
  // Get AI configuration
  const aiConfig = getAIConfig();
  const aiService = createAIService(aiConfig);

  // Try AI enhancement if available
  if (aiService && aiService.isAvailable()) {
    try {
      const enhanced = await aiService.enhanceQuiz(settings);
      if (enhanced) {
        // Mark as AI-generated for UI display
        return {
          ...enhanced,
          _meta: { aiEnhanced: true }
        } as QuizData & { _meta?: { aiEnhanced: boolean } };
      }
    } catch (error) {
      console.warn("AI enhancement failed, using core generator:", error);
      // Silent fallback - continue to core generator
    }
  }

  // Use core generator (always available, no dependencies)
  const coreResult = generateQuizCore(settings);
  return {
    ...coreResult,
    _meta: { aiEnhanced: false }
  } as QuizData & { _meta?: { aiEnhanced: boolean } };
}

