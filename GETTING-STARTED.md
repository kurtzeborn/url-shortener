# Getting Started Guide

This guide will walk you through setting up the URL shortener from scratch.

## Prerequisites

- Azure subscription (free tier)
- Cloudflare account (free tier)
- GitHub account
- Node.js 20+ installed
- Azure CLI installed
- Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Clone and Install

```bash
git clone https://github.com/kurtzeborn/url-shortener.git
cd url-shortener
npm ci  # Install dependencies from lock file
```

## Step 2: Azure Setup

### 2.1 Create Storage Account

```bash
# Login to Azure
az login

# Create resource group
az group create --name url-shortener-rg --location eastus

# Create storage account
az storage account create \
  --name k61urlshortener \
  --resource-group url-shortener-rg \
  --location eastus \
  --sku Standard_LRS

# Get connection string (save this!)
az storage account show-connection-string \
  --name k61urlshortener \
  --resource-group url-shortener-rg
```

### 2.2 Create Tables

Go to Azure Portal → Storage Account → Table Storage and create:
- `URLs`
- `UserURLs`
- `AllowedUsers`
- `UserInvites`

### 2.3 Add First User

In Azure Portal → Table Storage → `AllowedUsers` table:
- Click "Add Entity"
- PartitionKey: `users`
- RowKey: `your@email.com`
- AddedDate: Current date/time
- AddedBy: `system`

### 2.4 Create Function App

```bash
az functionapp create \
  --resource-group url-shortener-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name k61-url-functions \
  --storage-account k61urlshortener

# Get publish profile (save for GitHub secrets)
az functionapp deployment list-publishing-profiles \
  --name k61-url-functions \
  --resource-group url-shortener-rg \
  --xml
```

### 2.5 Create Static Web Apps

```bash
# For url.k61.dev (web app)
az staticwebapp create \
  --name k61-url-web \
  --resource-group url-shortener-rg \
  --location eastus2

# For www.k61.dev (landing page)
az staticwebapp create \
  --name k61-landing \
  --resource-group url-shortener-rg \
  --location eastus2

# Get deployment tokens (save for GitHub secrets)
az staticwebapp secrets list \
  --name k61-url-web \
  --resource-group url-shortener-rg

az staticwebapp secrets list \
  --name k61-landing \
  --resource-group url-shortener-rg
```

## Step 3: Cloudflare Setup

### 3.1 Add Domain to Cloudflare

1. Go to Cloudflare Dashboard
2. Click "Add a Site"
3. Enter `k61.dev`
4. Choose Free plan
5. Update Namecheap nameservers to Cloudflare's

### 3.2 Configure DNS

Add these DNS records in Cloudflare:
- `k61.dev` → CNAME to your Worker (will be set after deployment)
- `url` → CNAME to Azure Static Web App (from Step 2.5)
- `www` → CNAME to Azure Static Web App (from Step 2.5)

### 3.3 Get API Token

1. Cloudflare Dashboard → My Profile → API Tokens
2. Create Token → Edit Cloudflare Workers template
3. Save token for GitHub secrets

## Step 4: GitHub Secrets

Add these secrets in GitHub repository settings:

### Cloudflare Worker
- `CLOUDFLARE_API_TOKEN` - API token from Step 3.3
- `AZURE_STORAGE_ACCOUNT` - Storage account name (k61urlshortener)
- `AZURE_STORAGE_SAS` - SAS token from Azure Portal → Storage Account → Shared access signature
- `AZURE_API_URL` - Azure Functions URL (e.g., https://k61-url-functions.azurewebsites.net)
- `INTERNAL_API_KEY` - Generate a random secure key (e.g., `openssl rand -hex 32`)

### Azure Functions
- `AZURE_FUNCTIONAPP_NAME` - Function app name (k61-url-functions)
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` - XML from Step 2.4

### Azure Static Web Apps
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEB` - Token from Step 2.5
- `AZURE_STATIC_WEB_APPS_API_TOKEN_LANDING` - Token from Step 2.5
- `VITE_MICROSOFT_CLIENT_ID` - Microsoft Entra app registration client ID
- `VITE_API_URL` - Azure Functions URL (e.g., https://k61-url-functions.azurewebsites.net)

## Step 5: Local Development

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

### Cloudflare Worker

```bash
cd workers
npm install
wrangler dev  # Runs on http://localhost:8787
```

## Step 6: Deploy

Push to main branch to trigger automatic deployments:

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

GitHub Actions will automatically deploy:
- Cloudflare Worker
- Azure Functions
- Web App (url.k61.dev)
- Landing Page (www.k61.dev)

## Step 7: Configure Custom Domains

### In Azure Portal

For each Static Web App:
1. Go to Custom Domains
2. Add domain (url.k61.dev and www.k61.dev)
3. Follow validation instructions

### In Cloudflare

1. Ensure DNS records are set correctly
2. Enable "Proxied" mode for k61.dev
3. Configure Worker route: `k61.dev/*`

## Testing

1. Visit `https://url.k61.dev` - Should show login page
2. Login with your allowlisted email
3. Create a test shortened URL
4. Visit `https://k61.dev/<id>` - Should redirect
5. Check dashboard - Click count should increment

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

## Next Steps

- [x] ~~Implement Microsoft OAuth authentication~~ (Done)
- [x] ~~Add comprehensive tests~~ (Done - 51 tests)
- [ ] Set up monitoring/alerts
- [ ] [Add URL analytics dashboard](https://github.com/kurtzeborn/url-shortener/issues/4)
- [ ] [Implement custom aliases](https://github.com/kurtzeborn/url-shortener/issues/3)
- [ ] [Add QR code generation](https://github.com/kurtzeborn/url-shortener/issues/8)

## Support

For issues, check:
- GitHub Issues: https://github.com/kurtzeborn/url-shortener/issues
- [docs/archive/PLAN.md](docs/archive/PLAN.md) for original architecture details
- Individual component READMEs
