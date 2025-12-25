# Quick Deployment Guide

## Quick Start (Static Hosting)

### 1. Build the Application
```bash
npm install
npm run build
```

### 2. Deploy the `dist/` Folder

The `dist/` folder contains everything needed for deployment. Upload its contents to your hosting provider.

## Deployment Options

### Netlify (Recommended - Easiest)

1. **Via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

2. **Via Netlify Dashboard:**
   - Push code to GitHub
   - Connect repository in Netlify
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Deploy!

### Vercel

1. **Via Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Via Vercel Dashboard:**
   - Push code to GitHub
   - Import repository
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

### GitHub Pages

1. Install gh-pages:
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

### Traditional Web Server

1. Build: `npm run build`
2. Copy contents of `dist/` to your web server
3. Configure server for SPA routing (see below)

#### Apache
Copy `.htaccess` from project root to `dist/` folder

#### Nginx
Add to server config:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Environment Variables (Optional)

**Important:** The app works without any environment variables!

Only set these if you want to enable AI enhancement:

```env
VITE_AI_ENHANCEMENT_ENABLED=true
VITE_AI_PROVIDER=gemini  # or 'local-llm'
VITE_API_KEY=your_key    # only for Gemini
```

Set these **before** running `npm run build` - they get embedded in the build.

## Post-Deployment Checklist

- [ ] Application loads at root URL
- [ ] Quiz generation works
- [ ] QTI ZIP download works
- [ ] No console errors
- [ ] Test import into Canvas LMS

## Need More Details?

- **Full deployment guide:** See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Institutional deployment:** See [INSTITUTIONAL_DEPLOYMENT.md](INSTITUTIONAL_DEPLOYMENT.md)
- **Step-by-step checklist:** See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

