# Deployment Guide

This guide covers deployment options for the Canvas QTI Quiz Generator application.

## Prerequisites

- Node.js 18+ and npm
- Google Gemini API key
- Build tool: Vite (included)

## Environment Setup

**Note:** The application works without any environment variables. AI enhancement is optional.

To enable optional AI enhancement, create a `.env.local` file:
```env
# Enable AI (optional)
VITE_AI_ENHANCEMENT_ENABLED=true
VITE_AI_PROVIDER=gemini  # or 'local-llm'
VITE_API_KEY=your_gemini_api_key_here  # only if using Gemini
```

2. Install dependencies:
```bash
npm install
```

## Local Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

## Build for Production

Create an optimized production build:
```bash
npm run build
```

The build output will be in the `dist/` directory, ready for static hosting.

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. (Optional) Add environment variable `VITE_AI_ENHANCEMENT_ENABLED=true` and related AI config if using AI
4. Deploy automatically on every push

**Note:** The app works without any environment variables. AI enhancement is optional.

### Option 2: Netlify

1. Push your code to GitHub
2. Connect repository in Netlify dashboard
3. Build command: `npm run build`
4. Publish directory: `dist`
5. (Optional) Add environment variables for AI enhancement if desired
6. Deploy - works without any configuration

### Option 3: GitHub Pages

1. Install `gh-pages` package:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

**Note:** GitHub Pages is perfect for this app - no API keys or backend required. Works fully as static hosting.

### Option 4: Local Node Server

For local/intranet deployment:

1. Install `serve` globally:
```bash
npm install -g serve
```

2. Build the app:
```bash
npm run build
```

3. Serve the dist folder:
```bash
serve -s dist -l 3000
```

## Important Notes for Institutional Deployment

✅ **No API Keys Required**: The core application works completely without any API keys or external services.

✅ **Privacy-Friendly**: No data is sent to external services unless AI enhancement is explicitly enabled.

✅ **Offline Capable**: Core functionality works offline after initial page load.

⚠️ **Optional AI Enhancement**: If you enable AI enhancement:
- API keys will be visible in client-side code (use environment variables at build time)
- Consider using a backend proxy for production if security is critical
- Local LLM option (Ollama) keeps data completely local

## Custom Domain

After deployment, configure your custom domain in your hosting provider's dashboard.

## Troubleshooting

- **Build errors**: Ensure all dependencies are installed (`npm install`)
- **AI not working**: Check that `VITE_AI_ENHANCEMENT_ENABLED=true` and provider is configured (AI is optional - app works without it)
- **Missing files**: Ensure `dist/` contains `index.html` after build

