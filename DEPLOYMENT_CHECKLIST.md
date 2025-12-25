# Deployment Checklist

Use this checklist to ensure the application is properly prepared for deployment.

## Pre-Deployment Verification

### Build Verification
- [ ] Run `npm run build` successfully
- [ ] Verify `dist/` folder contains:
  - [ ] `index.html`
  - [ ] `assets/` directory with JavaScript bundles
- [ ] Test production build locally: `npm run preview`
- [ ] Verify application works in preview mode

### Code Quality
- [ ] No build errors or warnings (except harmless chunk optimization warnings)
- [ ] TypeScript compilation succeeds
- [ ] All environment variables are optional (app works without them)
- [ ] No hardcoded API keys or secrets in source code

### Dependencies
- [ ] `node_modules/` is in `.gitignore`
- [ ] `dist/` is in `.gitignore` (build output)
- [ ] `package-lock.json` is committed (for reproducible builds)
- [ ] Optional dependencies (e.g., `@google/genai`) are in `optionalDependencies`

## Deployment Steps

### 1. Static Hosting (Recommended)

#### Option A: GitHub Pages
```bash
# Install gh-pages if not already installed
npm install --save-dev gh-pages

# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

#### Option B: Netlify
1. Push code to GitHub
2. Connect repository in Netlify dashboard
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. (Optional) Add environment variables if using AI enhancement

#### Option C: Vercel
1. Push code to GitHub
2. Import repository in Vercel
3. Framework preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. (Optional) Add environment variables if using AI enhancement

#### Option D: Institutional Web Server
1. Run `npm run build`
2. Upload contents of `dist/` folder to web server
3. Configure server to serve `index.html` for all routes (SPA routing)
4. Ensure proper MIME types for JavaScript files

### 2. Server Configuration

#### Apache (.htaccess)
Create `.htaccess` in `dist/` folder:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### 3. Environment Variables (Optional - Only if using AI)

If deploying with AI enhancement enabled:

1. **Vercel/Netlify:**
   - Add environment variables in dashboard:
     - `VITE_AI_ENHANCEMENT_ENABLED=true`
     - `VITE_AI_PROVIDER=gemini` (or `local-llm`)
     - `VITE_API_KEY=...` (if using Gemini)

2. **Static Server:**
   - Set environment variables before build:
     ```bash
     export VITE_AI_ENHANCEMENT_ENABLED=true
     export VITE_AI_PROVIDER=gemini
     export VITE_API_KEY=your_key
     npm run build
     ```
   - Variables are embedded in build at compile time

### 4. Post-Deployment Verification

- [ ] Application loads correctly
- [ ] Quiz generation works (core functionality)
- [ ] QTI ZIP download works
- [ ] No console errors
- [ ] Test quiz import into Canvas LMS
- [ ] (If AI enabled) Verify AI enhancement works
- [ ] Verify app works with AI disabled (default)

## Security Checklist

- [ ] No API keys in source code
- [ ] No secrets in version control
- [ ] `.env.local` is in `.gitignore`
- [ ] Environment variables are optional
- [ ] App functions without external services

## Performance Checklist

- [ ] Production build is optimized
- [ ] Assets are minified and compressed
- [ ] Bundle size is reasonable (check `dist/assets/`)
- [ ] No unnecessary dependencies
- [ ] Images/assets are optimized (if any)

## Documentation

- [ ] README.md is up to date
- [ ] DEPLOYMENT.md has correct instructions
- [ ] INSTITUTIONAL_DEPLOYMENT.md is accurate
- [ ] `.env.example` file exists for reference

## Final Steps

1. **Tag Release** (optional):
   ```bash
   git tag -a v1.0.0 -m "Production release"
   git push origin v1.0.0
   ```

2. **Update Version** in `package.json`:
   ```json
   {
     "version": "1.0.0"
   }
   ```

3. **Document Deployment**:
   - Note deployment location
   - Document any custom configurations
   - Update internal documentation

## Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

### App Doesn't Load
- Verify server is configured for SPA routing
- Check browser console for errors
- Verify all assets are being served correctly

### Environment Variables Not Working
- Remember: Vite only exposes `VITE_*` prefixed variables
- Variables must be set at build time (embedded in bundle)
- For runtime configuration, use a different approach

## Support

For issues or questions, refer to:
- README.md - General documentation
- DEPLOYMENT.md - Deployment options
- INSTITUTIONAL_DEPLOYMENT.md - Institutional-specific guidance

