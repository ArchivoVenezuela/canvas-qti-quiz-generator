# Canvas QTI Quiz Generator

A web application that generates Canvas LMS-compatible QTI quiz packages from text input. **Works fully without any API keys** - AI enhancement is optional.

## Key Features

- ✅ **No API Key Required**: Core functionality works completely offline
- ✅ **Template-Based Generation**: Creates editable quiz templates from user settings
- ✅ **Question Parsing**: Parses pre-formatted questions (Question: ... Answer: C format)
- ✅ **Multiple Question Types**: Multiple choice, True/False, and Short Answer
- ✅ **Canvas-Compatible**: Exports IMS QTI 1.2 format ZIP packages
- ✅ **Optional AI Enhancement**: Can use Google Gemini or local LLMs when configured
- ✅ **Institutional Deployment Ready**: No external dependencies required

## Architecture

The application uses a **core-first architecture** with optional AI enhancement:

```
┌─────────────────────────────────────┐
│   Core Generator (Always Works)     │
│   - Template generation             │
│   - Question parsing                │
│   - QTI XML export                  │
│   - NO external dependencies        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   AI Enhancement (Optional)         │
│   - Gemini (if API key provided)    │
│   - Local LLM (e.g., Ollama)        │
│   - Silent fallback if unavailable  │
└─────────────────────────────────────┘
```

**Design Rationale for Institutional Use:**
- Core generator has zero external API dependencies
- AI services are dynamically loaded only if enabled
- Silent fallback ensures app always functions, even if AI is unavailable
- No hard-coded API keys in client-side code

## Installation

**Prerequisites:** Node.js 18+

```bash
# Clone the repository
git clone <repository-url>
cd canvas-qti-quiz-generator

# Install dependencies
npm install
```

## Running Without AI (Default Mode)

The app works immediately without any configuration:

```bash
npm run dev
```

Open `http://localhost:5173` - the app will:
- Generate template questions based on your settings
- Parse pre-formatted questions from text input
- Export valid Canvas QTI packages
- **All without any API keys or external services**

## Optional: Enabling AI Enhancement

### Option 1: Google Gemini (Cloud)

1. Create `.env.local`:
   ```env
   VITE_AI_ENHANCEMENT_ENABLED=true
   VITE_AI_PROVIDER=gemini
   VITE_API_KEY=your_gemini_api_key_here
   ```

2. Install Gemini dependency (optional):
   ```bash
   npm install @google/genai
   ```

3. Restart dev server - AI enhancement will be available

### Option 2: Local LLM (Ollama, LM Studio, etc.)

1. Install and run a local LLM server (e.g., [Ollama](https://ollama.ai/)):
   ```bash
   # Example: Install Ollama, then run a model
   ollama serve
   # In another terminal:
   ollama pull llama2
   ```

2. Create `.env.local`:
   ```env
   VITE_AI_ENHANCEMENT_ENABLED=true
   VITE_AI_PROVIDER=local-llm
   VITE_LOCAL_LLM_ENDPOINT=http://localhost:11434
   ```

3. Restart dev server

## Usage

### Mode 1: Pre-Formatted Questions

Paste questions in this format:

```
Question: What is the capital of France?
A. London
B. Berlin
C. Paris
D. Madrid
Answer: C

Question: Who painted the Mona Lisa?
A. Van Gogh
B. Picasso
C. Leonardo da Vinci
D. Monet
Answer: C
```

The app will parse and convert them to Canvas-compatible QTI format.

### Mode 2: Template Generation

1. Leave the source text field empty or enter a topic
2. Set desired question count and types
3. Click "Generate Quiz"
4. The app creates template questions you can customize
5. Download as QTI ZIP and import into Canvas

### Mode 3: AI-Enhanced Generation (If Enabled)

1. Paste educational content (lecture notes, articles, etc.)
2. Configure settings
3. If AI is enabled and available, questions will be AI-generated
4. If AI is unavailable, app falls back to template generation
5. Review and edit as needed before exporting

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

3. **Optional: Configure Environment Variables** (if using AI):
   - In Vercel project settings → Environment Variables
   - Add `VITE_AI_ENHANCEMENT_ENABLED=true`
   - Add `VITE_AI_PROVIDER=gemini` (or `local-llm`)
   - Add `VITE_API_KEY=your_key` (if using Gemini)
   - Redeploy

The app will be live at `https://your-project.vercel.app`

### Other Deployment Options

This application is designed for institutional use where:
- External API dependencies may be restricted
- Data privacy is a concern
- Offline functionality is required

**Deployment Checklist:**
- ✅ **No API keys required** - Core functionality works offline
- ✅ **Static hosting compatible** - Can be deployed to any static host
- ✅ **No backend required** - Pure client-side application
- ✅ **Optional AI** - Configure only if desired

**Build for Production:**
```bash
npm run build
```

Deploy the `dist/` folder to:
- Any static hosting (Netlify, GitHub Pages, etc.)
- Institutional web server
- Intranet/local network

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment options.

## Technical Details

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Core Dependencies**: React, JSZip (for QTI package creation)
- **Optional Dependencies**: @google/genai (only if AI enabled)
- **Export Format**: IMS QTI 1.2 (Canvas-compatible)
- **ZIP Package**: Contains `quiz.xml` and `imsmanifest.xml`

## Project Structure

```
├── services/
│   ├── coreGenerator.ts      # Core generation (no AI)
│   ├── aiService.ts          # AI abstraction layer
│   ├── quizService.ts        # Unified service (core + optional AI)
│   └── qtiGenerator.ts       # QTI XML export
├── components/
│   ├── QuizForm.tsx          # Input form
│   ├── QuizPreview.tsx       # Preview and download
│   └── ...
└── types.ts                  # TypeScript definitions
```

## Configuration

### Environment Variables (All Optional)

```env
# Enable AI enhancement (default: false)
VITE_AI_ENHANCEMENT_ENABLED=true

# AI provider: 'gemini' or 'local-llm' (default: none)
VITE_AI_PROVIDER=gemini

# For Gemini
VITE_API_KEY=your_api_key

# For local LLM
VITE_LOCAL_LLM_ENDPOINT=http://localhost:11434
```

## License

CC BY-NC-SA 4.0 © 2026 Patricia Valladares

## Credits

Created by Prof. Patricia Valladares — For Canvas QTI Quiz Generation

Designed for institutional and classroom use with privacy and offline-first principles.
