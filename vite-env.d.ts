/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Declaration
 * 
 * This file augments Vite's built-in ImportMetaEnv with application-specific
 * environment variables. Vite replaces import.meta.env.* at build time.
 * 
 * All variables are optional - the app works without any of them.
 */

interface ImportMetaEnv {
  // AI Enhancement Feature Flag (optional)
  readonly VITE_AI_ENHANCEMENT_ENABLED?: string;
  // AI Provider: 'gemini' or 'local-llm' (optional)
  readonly VITE_AI_PROVIDER?: string;
  // API Key for Gemini provider (optional)
  readonly VITE_API_KEY?: string;
  // Endpoint for local LLM (optional, defaults to http://localhost:11434)
  readonly VITE_LOCAL_LLM_ENDPOINT?: string;
}

