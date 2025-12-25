# Refactoring Summary: Optional AI Architecture

This document summarizes the refactoring from an AI-required architecture to an optional AI enhancement architecture.

## Changes Made

### 1. New Core Generator Service
**File**: `services/coreGenerator.ts`

- Provides deterministic quiz generation without any AI dependencies
- Parses pre-formatted questions from text input
- Generates template questions based on user settings
- Always available, no external dependencies

### 2. AI Service Abstraction Layer
**File**: `services/aiService.ts`

- Defines `AIEnhancementService` interface for pluggable AI providers
- Implements adapters for:
  - Google Gemini (optional, dynamically loaded)
  - Local LLM (e.g., Ollama) - framework in place
- Feature flag controlled via `VITE_AI_ENHANCEMENT_ENABLED`
- Silent fallback when AI is unavailable

### 3. Unified Quiz Service
**File**: `services/quizService.ts`

- Main entry point for quiz generation
- Orchestrates between core generator and optional AI enhancement
- Always returns valid QuizData (core generator as fallback)

### 4. Updated Application Entry Point
**File**: `App.tsx`

- Changed import from `geminiService` to `quizService`
- Updated UI messaging to indicate AI is optional
- Removed "Powered by Google Gemini" from footer

### 5. Updated Components

**QuizForm.tsx**:
- Updated placeholder text to clarify AI is optional
- Source text field is now optional (for template generation)
- Added help text explaining both modes

**QuizPreview.tsx**:
- Added notice that questions are editable templates
- Clear indication that review and customization is expected

### 6. Dependency Changes

**package.json**:
- Moved `@google/genai` from `dependencies` to `optionalDependencies`
- Application works without this package installed

**index.html**:
- Removed `@google/genai` from importmap (uses dynamic imports instead)

### 7. Documentation Updates

**README.md**:
- Complete rewrite emphasizing no-API-key operation
- Clear sections for offline mode vs. AI-enhanced mode
- Institutional deployment guidance

**DEPLOYMENT.md**:
- Updated to emphasize no API keys required
- Added guidance for optional AI configuration

**INSTITUTIONAL_DEPLOYMENT.md** (new):
- Comprehensive guide for institutional deployment
- Privacy and compliance considerations
- Three deployment scenarios with recommendations

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Application Entry Point         │
│              (App.tsx)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Unified Quiz Service               │
│      (quizService.ts)                   │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Try AI Enhancement (optional)   │  │
│  │  - Check feature flag            │  │
│  │  - Dynamic import if enabled     │  │
│  │  - Silent fallback on failure    │  │
│  └────────────┬─────────────────────┘  │
│               │                         │
│               ▼                         │
│  ┌──────────────────────────────────┐  │
│  │  Core Generator (always works)   │  │
│  │  - Parse pre-formatted questions │  │
│  │  - Generate template questions   │  │
│  │  - NO external dependencies      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Migration Guide

### For Existing Deployments

1. **Update imports**: Change `geminiService` to `quizService`
2. **Remove API key requirement**: App works without `API_KEY` environment variable
3. **Optional AI setup**: Add `VITE_AI_ENHANCEMENT_ENABLED=true` if you want AI features

### For New Deployments

1. **No configuration needed**: Works out of the box
2. **Optional AI**: Configure only if desired

## Benefits

1. **Institutional Friendly**: No external API dependencies required
2. **Privacy**: Data never leaves your network (unless AI explicitly enabled)
3. **Reliability**: Always works, even if AI services are down
4. **Cost**: No ongoing API costs for core functionality
5. **Flexibility**: Can enable AI enhancement when needed/approved

## Backward Compatibility

- **Breaking**: Old `geminiService.ts` is removed (replaced by `aiService.ts`)
- **Compatible**: QTI export format unchanged
- **Compatible**: Quiz data structures unchanged
- **New**: Environment variables changed (optional now)

## Testing Checklist

- [x] Core generator creates valid quiz templates
- [x] Pre-formatted question parsing works
- [x] AI enhancement works when enabled
- [x] Silent fallback when AI unavailable
- [x] QTI export works with core-generated quizzes
- [x] UI indicates AI is optional
- [x] App works without any environment variables

## Future Enhancements

- Full local LLM adapter implementation (framework in place)
- In-browser question editing interface
- Question bank import/export
- Additional AI provider adapters (OpenAI, Anthropic, etc.)

