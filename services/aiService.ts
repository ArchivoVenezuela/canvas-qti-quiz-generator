/**
 * AI Service Interface and Adapters
 * 
 * This module provides an abstraction layer for AI enhancement functionality.
 * AI services are OPTIONAL - the app functions fully without them.
 * 
 * Architecture:
 * - Interface defines the contract for AI enhancement
 * - Adapters implement specific providers (Gemini, local LLM, etc.)
 * - Core generator provides fallback when AI is unavailable
 */

import { QuizSettings, QuizData } from '../types';

/**
 * Interface for AI enhancement services.
 * Implementations should handle quiz generation/enhancement from text.
 */
export interface AIEnhancementService {
  /**
   * Checks if the AI service is available and configured.
   */
  isAvailable(): boolean;

  /**
   * Enhances or generates quiz from source text.
   * Should return null if unavailable or if enhancement fails (silent fallback).
   */
  enhanceQuiz(settings: QuizSettings): Promise<QuizData | null>;
}

/**
 * Configuration for AI services
 */
export interface AIConfig {
  enabled: boolean;
  provider?: 'gemini' | 'local-llm' | 'custom';
  endpoint?: string; // For local LLM or custom endpoints
  apiKey?: string; // For cloud providers (if needed)
}

/**
 * Gemini AI Adapter (Optional)
 * Only loaded if AI_ENHANCEMENT_ENABLED is true and API key is available.
 */
class GeminiAIAdapter implements AIEnhancementService {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async enhanceQuiz(settings: QuizSettings): Promise<QuizData | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Dynamic import to avoid hard dependency
      // This will only execute if @google/genai is installed (optional dependency)
      const geminiModule = await import("@google/genai").catch(() => null);
      if (!geminiModule) {
        console.warn("@google/genai not installed. Install it to enable Gemini AI enhancement.");
        return null;
      }
      const { GoogleGenAI, Type } = geminiModule;
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const quizSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Quiz title" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["multiple_choice", "true_false", "short_answer"] },
                stem: { type: Type.STRING, description: "Question text" },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                feedback: { type: Type.STRING }
              },
              required: ["type", "stem", "options", "correctIndex", "feedback"]
            }
          }
        },
        required: ["title", "questions"]
      };

      const typesList = settings.questionTypes.join(", ");
      const prompt = `
        Generate a Canvas-compatible quiz from the input text.
        Context: Difficulty: ${settings.difficulty}, Language: ${settings.language}, Types: ${typesList}
        Generate exactly ${settings.questionCount} questions.
        ${settings.includeFeedback ? "Include helpful feedback for each answer." : ""}
        
        Input Text:
        """
        ${settings.sourceText}
        """
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const text = response.text;
      if (!text) return null;

      const parsedData = JSON.parse(text);
      const { QuestionType } = await import("../types");

      const questions = parsedData.questions.map((q: any, index: number) => {
        // Validate and map question type
        let qType = q.type;
        if (!Object.values(QuestionType).includes(qType)) {
          qType = QuestionType.MultipleChoice;
        }
        
        return {
          id: `q_${Date.now()}_${index}`,
          type: qType,
          stem: q.stem,
          options: q.options,
          correctIndex: q.correctIndex,
          feedback: q.feedback
        };
      });

      // Apply randomization if requested
      if (settings.randomize) {
        questions.forEach((q: any) => {
          if (q.type === QuestionType.MultipleChoice && q.options && q.options.length > 1) {
            const combined = q.options.map((opt: string, i: number) => ({ 
              text: opt, 
              isCorrect: i === q.correctIndex 
            }));
            for (let i = combined.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [combined[i], combined[j]] = [combined[j], combined[i]];
            }
            q.options = combined.map((c: any) => c.text);
            q.correctIndex = combined.findIndex((c: any) => c.isCorrect);
          }
        });
      }

      return {
        title: parsedData.title || settings.topic || "Generated Quiz",
        questions: questions,
        maxAttempts: settings.maxAttempts
      };
    } catch (error) {
      console.warn("AI enhancement failed, falling back to core generator:", error);
      return null; // Silent fallback
    }
  }
}

/**
 * Local LLM Adapter (for Ollama, LM Studio, etc.)
 * Connects to a local LLM endpoint (e.g., http://localhost:11434)
 */
class LocalLLMAdapter implements AIEnhancementService {
  private endpoint: string;

  constructor(endpoint: string = 'http://localhost:11434') {
    this.endpoint = endpoint;
  }

  isAvailable(): boolean {
    return !!this.endpoint;
  }

  async enhanceQuiz(settings: QuizSettings): Promise<QuizData | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Test endpoint availability
      const healthCheck = await fetch(`${this.endpoint}/api/tags`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (!healthCheck.ok) {
        return null;
      }

      // Generate quiz using local LLM
      const prompt = `Generate a quiz with ${settings.questionCount} questions about: ${settings.sourceText.substring(0, 500)}. Return JSON format with title and questions array.`;
      
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2', // Default model, can be configured
          prompt: prompt,
          stream: false,
          format: 'json'
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      // Parse response based on local LLM format
      // This is a simplified example - actual parsing depends on LLM provider
      // For now, return null to fall back to core generator
      console.warn("Local LLM adapter not fully implemented, using core generator");
      return null;
    } catch (error) {
      console.warn("Local LLM unavailable, falling back to core generator:", error);
      return null; // Silent fallback
    }
  }
}

/**
 * Factory function to create appropriate AI service based on config.
 * Returns null if AI is disabled or unavailable.
 */
export function createAIService(config: AIConfig): AIEnhancementService | null {
  if (!config.enabled) {
    return null;
  }

  switch (config.provider) {
    case 'gemini':
      if (config.apiKey) {
        return new GeminiAIAdapter(config.apiKey);
      }
      return null;

    case 'local-llm':
      if (config.endpoint) {
        return new LocalLLMAdapter(config.endpoint);
      }
      return null;

    default:
      return null;
  }
}

/**
 * Gets AI configuration from environment or defaults.
 * 
 * Institutional Deployment Rationale:
 * - AI enhancement defaults to disabled (privacy, security, no dependencies)
 * - Uses Vite environment variables (compile-time replacement via import.meta.env)
 * - Only processes AI configuration if explicitly enabled via feature flag
 * - This pattern ensures the app works fully without any API keys or external services
 */
export function getAIConfig(): AIConfig {
  // Vite replaces import.meta.env.* at build time
  // Default to disabled for institutional use (no API keys, privacy-first)
  // AI enhancement is opt-in via VITE_AI_ENHANCEMENT_ENABLED feature flag
  const enabled = import.meta.env.VITE_AI_ENHANCEMENT_ENABLED === 'true';

  if (!enabled) {
    return { enabled: false };
  }

  // Determine provider (only checked if AI is enabled)
  const provider = import.meta.env.VITE_AI_PROVIDER as 'gemini' | 'local-llm' | undefined;

  if (provider === 'local-llm') {
    const endpoint = import.meta.env.VITE_LOCAL_LLM_ENDPOINT || 'http://localhost:11434';
    return { enabled: true, provider: 'local-llm', endpoint };
  }

  if (provider === 'gemini') {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      return { enabled: true, provider: 'gemini', apiKey };
    }
    // If Gemini is selected but no API key, disable AI
    return { enabled: false };
  }

  // If enabled but no valid provider configured, disable AI
  return { enabled: false };
}

