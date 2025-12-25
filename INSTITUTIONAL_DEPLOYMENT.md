# Institutional Deployment Guide

This document provides specific guidance for deploying the Canvas QTI Quiz Generator in institutional environments (universities, schools, etc.) where data privacy, offline functionality, and minimal dependencies are priorities.

## Design Philosophy

This application was specifically designed with institutional use in mind:

1. **No External Dependencies**: Core functionality works without any API keys or external services
2. **Privacy-First**: No data is sent to external services unless explicitly configured
3. **Offline Capable**: Works completely offline after initial page load
4. **Optional AI**: AI enhancement is opt-in, not required

## Deployment Scenarios

### Scenario 1: Fully Offline (Recommended for Privacy-Sensitive Environments)

**Configuration**: No environment variables, no AI enhancement

**Benefits**:
- Zero external API dependencies
- Complete data privacy (nothing leaves your network)
- No ongoing costs
- Works on air-gapped networks

**Setup**:
```bash
# Build the application
npm run build

# Deploy the dist/ folder to your institutional web server
# No configuration needed - works immediately
```

**Limitations**:
- Uses template-based question generation
- Requires manual question input or pre-formatted question parsing
- No AI-assisted content generation

### Scenario 2: Local LLM (Privacy + AI Enhancement)

**Configuration**: Enable local LLM adapter

**Benefits**:
- AI-powered question generation
- Data never leaves your network (LLM runs locally)
- No external API costs
- Complete privacy control

**Setup**:
1. Install and run a local LLM server (e.g., [Ollama](https://ollama.ai/)):
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Run server
   ollama serve
   
   # In another terminal, pull a model
   ollama pull llama2
   ```

2. Build application with local LLM configuration:
   ```bash
   # Create .env.local
   echo "VITE_AI_ENHANCEMENT_ENABLED=true" > .env.local
   echo "VITE_AI_PROVIDER=local-llm" >> .env.local
   echo "VITE_LOCAL_LLM_ENDPOINT=http://localhost:11434" >> .env.local
   
   npm run build
   ```

3. Deploy `dist/` folder to your server
4. Ensure LLM server is accessible from the web server

**Requirements**:
- Local LLM server must be running
- Server must have sufficient resources (RAM/CPU) for LLM
- Network access between web server and LLM server

### Scenario 3: Cloud AI (If Permitted by Institution)

**Configuration**: Enable Gemini or other cloud AI

**Benefits**:
- High-quality AI-generated questions
- No local infrastructure required
- Always up-to-date AI models

**Setup**:
1. Obtain API key (if permitted by institutional policy)
2. Build with AI configuration:
   ```bash
   # Create .env.local
   echo "VITE_AI_ENHANCEMENT_ENABLED=true" > .env.local
   echo "VITE_AI_PROVIDER=gemini" >> .env.local
   echo "VITE_API_KEY=your_api_key_here" >> .env.local
   
   npm run build
   ```

**Considerations**:
- Data will be sent to external AI provider
- Requires institutional approval for external data sharing
- API costs may apply
- Check institutional data privacy policies

## Network Architecture

### Recommended Setup

```
┌─────────────────────────────────┐
│   Institutional Network         │
│                                 │
│  ┌──────────────┐              │
│  │  Web Server  │              │
│  │  (Static)    │              │
│  └──────┬───────┘              │
│         │                       │
│  ┌──────▼───────┐ (Optional)   │
│  │  Local LLM   │              │
│  │  Server      │              │
│  └──────────────┘              │
│                                 │
│  No External Connections        │
└─────────────────────────────────┘
```

## Security Considerations

### For Offline Deployment
- ✅ No external network connections
- ✅ No API keys in code
- ✅ Complete data privacy
- ✅ Can be deployed on air-gapped networks

### For Local LLM Deployment
- ✅ Data stays within institutional network
- ⚠️ Ensure LLM server is properly secured
- ⚠️ Consider firewall rules for LLM endpoint
- ✅ No external API dependencies

### For Cloud AI Deployment
- ⚠️ Data sent to external provider (check policies)
- ⚠️ API keys embedded in client bundle (visible to users)
- ⚠️ Consider backend proxy for production use
- ✅ More secure than hard-coding keys

## Compliance and Privacy

### FERPA Compliance (US Educational Institutions)
- **Offline Mode**: Fully compliant (no data sharing)
- **Local LLM**: Compliant if LLM server is on-premises
- **Cloud AI**: Requires careful review - student data may be sent to external provider

### GDPR Compliance (EU)
- **Offline Mode**: Compliant (no data processing outside your control)
- **Local LLM**: Compliant if server is within EU/your jurisdiction
- **Cloud AI**: Requires data processing agreement with provider

### Recommendation
For maximum compliance, use **Scenario 1 (Fully Offline)** or **Scenario 2 (Local LLM)**.

## Performance Considerations

### Static Hosting
- Very fast (CDN-compatible)
- Low server resource requirements
- Scales easily with CDN

### Local LLM
- Requires server with sufficient RAM (4GB+ for small models, 8GB+ for larger)
- Response time depends on model size and hardware
- Consider dedicated server for LLM if high usage expected

## Troubleshooting

### Application doesn't generate questions
- Check browser console for errors
- Verify source text format (see README for format examples)
- If using templates, ensure question count is set

### Local LLM not working
- Verify LLM server is running: `curl http://localhost:11434/api/tags`
- Check endpoint URL matches configuration
- Check network connectivity between servers
- Verify model is downloaded: `ollama list`

### Build fails
- Ensure all dependencies installed: `npm install`
- Check Node.js version (18+ required)
- Clear node_modules and reinstall if issues persist

## Support and Maintenance

### Updates
- Core functionality rarely needs updates
- QTI format is stable (IMS QTI 1.2 standard)
- Update dependencies periodically for security

### Monitoring
- Monitor disk space if using local LLM (models can be large)
- Monitor server resources if using local LLM
- Check application logs for errors

## Cost Analysis

### Offline Deployment
- **Infrastructure**: Standard web hosting (minimal)
- **Ongoing**: None
- **API Costs**: None

### Local LLM Deployment
- **Infrastructure**: Web hosting + LLM server (moderate)
- **Ongoing**: Server maintenance, electricity
- **API Costs**: None

### Cloud AI Deployment
- **Infrastructure**: Standard web hosting (minimal)
- **Ongoing**: API usage costs (varies by usage)
- **API Costs**: Per-request pricing from provider

## Recommended Configuration for Universities

**Primary**: Scenario 1 (Fully Offline)
- Provides all core functionality
- Zero ongoing costs
- Complete privacy

**Enhancement (Optional)**: Scenario 2 (Local LLM)
- Add AI capabilities if desired
- Keep data on-premises
- Requires IT support for LLM server

Avoid Scenario 3 (Cloud AI) unless:
- Explicitly permitted by institutional policy
- Data sharing agreements in place
- Budget approved for API costs

