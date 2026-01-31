# Getting Started Guide

This guide will help you set up the URL shortener for local development or production deployment.

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/url-shortener.git
   cd url-shortener
   npm ci  # Install dependencies from lock file
   ```

2. **For Local Development** → Continue to [Local Development](#local-development) below

3. **For Production Deployment** → See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## Local Development

### Functions

```bash
cd functions
npm install
cp local.settings.json.template local.settings.json
# Edit local.settings.json with your Azure connection string
npm run build
npm start  # Runs on http://localhost:7071
```

### Web App

```bash
cd web
npm install
npm run dev  # Runs on http://localhost:5173
```

---

## Testing Locally

1. Ensure Functions are running (`http://localhost:7071`)
2. Visit web app (`http://localhost:5173`)
3. Login with your allowlisted email
4. Create a test shortened URL

---

## Troubleshooting

### Worker not redirecting
- Check Cloudflare Worker logs
- Verify environment variables are set
- Check DNS propagation

### Functions returning errors
- Check Application Insights logs in Azure Portal
- Verify storage connection string is correct
- Check that tables exist

### Static Web Apps not deploying
- Check GitHub Actions logs
- Verify deployment tokens are correct
- Check build output in Actions