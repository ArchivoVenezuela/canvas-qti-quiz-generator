# Deployment Guide: Vercel

This guide will help you deploy the Canvas QTI Quiz Generator to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (free tier works)
- Node.js 18+ installed locally (for testing)

## Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Canvas QTI Quiz Generator"
   ```

2. **Create GitHub Repository:**
   - Go to GitHub and create a new repository
   - Don't initialize with README (you already have one)
   - Copy the repository URL

3. **Push to GitHub:**
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Vercel will auto-detect:
     - Framework: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Configure Project:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables (Optional):**
   If you want to enable AI enhancement:
   - Click "Environment Variables"
   - Add:
     - `VITE_AI_ENHANCEMENT_ENABLED` = `true`
     - `VITE_AI_PROVIDER` = `gemini` (or `local-llm`)
     - `VITE_API_KEY` = `your_api_key` (if using Gemini)

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project.vercel.app`

## Step 3: Verify Deployment

1. **Test the App:**
   - Visit your Vercel URL
   - Try generating a quiz
   - Download a QTI ZIP file
   - Verify it works correctly

2. **Check Build Logs:**
   - If build fails, check Vercel dashboard → Deployments → Build Logs
   - Common issues:
     - Missing dependencies (should auto-install)
     - TypeScript errors (check locally first)
     - Environment variable issues

## Step 4: Custom Domain (Optional)

1. **Add Custom Domain:**
   - Go to Project Settings → Domains
   - Add your domain
   - Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Error: "Cannot find module 'tailwindcss'"**
- Solution: Dependencies should auto-install. If not, check `package.json` includes tailwindcss in devDependencies.

**Error: "TypeScript errors"**
- Solution: Run `npm run build` locally first to catch errors
- Fix any TypeScript issues before deploying

**Error: "Module not found"**
- Solution: Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

### Runtime Issues

**App loads but styles are broken:**
- Check that `index.css` is imported in `index.tsx`
- Verify Tailwind is configured correctly

**Quiz generation doesn't work:**
- Check browser console for errors
- Verify all services are imported correctly
- Test in development mode first: `npm run dev`

## Continuous Deployment

Vercel automatically deploys on every push to main branch:
- Push to GitHub → Vercel builds and deploys
- Preview deployments for pull requests
- Automatic HTTPS certificates

## Production Checklist

- ✅ Build succeeds locally: `npm run build`
- ✅ No TypeScript errors: `npm run build`
- ✅ App works in preview: `npm run preview`
- ✅ All dependencies in `package.json`
- ✅ `.gitignore` excludes `node_modules` and `dist`
- ✅ `vercel.json` configured (optional, auto-detected)
- ✅ Environment variables set (if using AI)

## Support

For issues:
1. Check Vercel build logs
2. Test locally first: `npm run dev`
3. Check browser console for runtime errors
4. Verify all files are committed to GitHub

