# GitHub Setup & Deployment Guide

## Quick Start: Deploy to Vercel

### 1. Initialize Git Repository

```bash
# If not already initialized
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Canvas QTI Quiz Generator with Survey/Quiz modes"
```

### 2. Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click "New repository"
3. Repository name: `canvas-qti-quiz-generator` (or your choice)
4. Description: "Generate Canvas LMS-compatible QTI quizzes from text"
5. Choose Public or Private
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### 3. Push to GitHub

```bash
# Add remote (replace with your GitHub username/repo)
git remote add origin https://github.com/YOUR_USERNAME/canvas-qti-quiz-generator.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Vercel will auto-detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click "Deploy"
7. Wait 1-2 minutes for deployment
8. Your app is live! 🎉

## What's Included

✅ **Complete Application:**
- Multiple question types (multiple choice, true/false, multiple select, short answer, essay)
- Survey mode (ungraded) and Quiz mode (graded)
- Text parsing for pre-formatted questions
- Canvas QTI 1.2 export
- Offline-first (no API keys required)

✅ **Production Ready:**
- TypeScript configured
- Tailwind CSS configured
- Build tested and working
- Vercel configuration included
- Proper .gitignore

✅ **Documentation:**
- README.md with full instructions
- DEPLOYMENT_VERCEL.md with detailed steps
- Code comments and type safety

## Environment Variables (Optional)

If you want AI enhancement, add these in Vercel project settings:

- `VITE_AI_ENHANCEMENT_ENABLED` = `true`
- `VITE_AI_PROVIDER` = `gemini` or `local-llm`
- `VITE_API_KEY` = your API key (if using Gemini)

**Note:** The app works perfectly without these - AI is optional!

## Testing Before Deployment

```bash
# Install dependencies
npm install

# Test development server
npm run dev

# Test production build
npm run build

# Preview production build
npm run preview
```

## File Structure

```
canvas-qti-quiz-generator/
├── components/          # React components
├── services/           # Core logic (parser, generator, QTI export)
├── types.ts           # TypeScript definitions
├── App.tsx            # Main app component
├── index.tsx          # Entry point
├── index.html         # HTML template
├── index.css          # Tailwind CSS
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind configuration
├── vercel.json        # Vercel deployment config
├── package.json       # Dependencies
└── README.md          # Documentation
```

## Next Steps After Deployment

1. **Test the deployed app:**
   - Generate a quiz
   - Download QTI ZIP
   - Import to Canvas to verify

2. **Customize (optional):**
   - Update README with your info
   - Add custom domain in Vercel
   - Configure environment variables for AI

3. **Share:**
   - Share the Vercel URL with instructors
   - Add to your institution's tools page

## Troubleshooting

**Build fails on Vercel:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Test build locally first: `npm run build`

**App doesn't load:**
- Check browser console for errors
- Verify all files are committed to GitHub
- Check Vercel deployment logs

**Styles not working:**
- Verify Tailwind is configured
- Check that index.css is imported in index.tsx
- Clear browser cache

## Support

For issues:
1. Check Vercel build logs
2. Test locally: `npm run dev`
3. Check browser console
4. Review README.md for usage instructions

