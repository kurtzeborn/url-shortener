# Deployment Guide

Complete guide for deploying the URL shortener to production.

## Prerequisites

- Azure subscription (free tier works)
- Cloudflare account (free)
- GitHub account with repo access
- Node.js 20+ installed
- Azure CLI installed (optional, for CLI method)
- Wrangler CLI installed (optional, for CLI method): `npm install -g wrangler`

---

## Step 1: Azure AD App Registration

Required for Microsoft authentication.

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: `URL Shortener`
   - **Supported account types**: "Personal Microsoft accounts only"
   - **Redirect URI**: Single-page application (SPA) → `http://localhost:5173`
4. After creation, add production redirect URI:
   - Go to **Authentication** → Add `https://url.yourdomain.com`
5. Copy **Application (client) ID** for later

---

## Step 2: Azure Resources

### Storage Account

**Portal:**
1. Create Storage Account (Standard, LRS, free tier eligible)
2. Go to **Tables** → Create tables: `URLs`, `UserURLs`, `AllowedUsers`, `UserInvites`
3. Go to **Shared access signature** → Generate SAS token (save for later)
4. Copy **Storage account name**

**CLI:**
```bash
az login
az group create --name url-shortener-rg --location eastus
az storage account create \
  --name yoururlshortener \
  --resource-group url-shortener-rg \
  --location eastus \
  --sku Standard_LRS
```

### Add First User

In Azure Portal → Storage Account → **Tables** → `AllowedUsers`:
- Click "Add Entity"
- PartitionKey: `users`
- RowKey: `your@email.com`
- AddedAt: Current date/time (ISO format)
- AddedBy: `system`

### Function App

**Portal:**
1. Create Function App:
   - Runtime: Node.js 20
   - Plan: Consumption (Serverless)
   - Region: Same as Storage Account
2. Go to **Configuration** → Add:
   - `AZURE_STORAGE_CONNECTION_STRING`: Connection string from Storage Account
   - `INTERNAL_API_KEY`: Generate random 32-char string (e.g., `openssl rand -hex 32`)
   - `SHORT_URL_DOMAIN`: Your short domain (e.g., `yourdomain.com`)
3. Go to **Deployment Center** → Get **Publish Profile**

**CLI:**
```bash
az functionapp create \
  --resource-group url-shortener-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name your-url-functions \
  --storage-account yoururlshortener

# Get publish profile
az functionapp deployment list-publishing-profiles \
  --name your-url-functions \
  --resource-group url-shortener-rg \
  --xml
```

### Static Web App

**Portal:**
1. Create Static Web App:
   - Plan: Free
   - Source: GitHub → select your repo
   - Build preset: React
   - App location: `/web`
   - API location: (leave empty, using separate Functions)
   - Output location: `dist`
2. Go to **Configuration** → Add:
   - `VITE_MICROSOFT_CLIENT_ID`: Application ID from Step 1
3. Copy **Deployment token** from Overview

**CLI:**
```bash
az staticwebapp create \
  --name your-url-web \
  --resource-group url-shortener-rg \
  --location eastus2

# Get deployment token
az staticwebapp secrets list \
  --name your-url-web \
  --resource-group url-shortener-rg
```

---

## Step 3: Cloudflare Worker

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → Create Worker
3. Name: `url-redirect` (or your preferred name)
4. Environment variables are set via GitHub Actions deployment (see Step 4)
5. Go to **My Profile** → **API Tokens** → Create token with Workers:Edit permission

### DNS Setup
1. Add your domain to Cloudflare
2. Update nameservers at your registrar to Cloudflare's
3. Add Worker route: `yourdomain.com/*` → your worker
4. Add CNAME records:
   - `url` → `<static-web-app-url>.azurestaticapps.net`
   - `www` → `<static-web-app-url>.azurestaticapps.net` (optional)

---

## Step 4: GitHub Secrets

Go to repo **Settings** → **Secrets and variables** → **Actions** → Add:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers:Edit permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (from dashboard URL) |
| `DEFAULT_URL` | URL to redirect unknown/invalid IDs (e.g., `https://url.yourdomain.com`) |
| `AZURE_STORAGE_ACCOUNT` | Storage account name |
| `AZURE_STORAGE_SAS` | SAS token for Table Storage access |
| `AZURE_API_URL` | Function App URL (e.g., `https://your-func.azurewebsites.net`) |
| `INTERNAL_API_KEY` | Random 32-char key (same as Function App config) |
| `AZURE_FUNCTIONAPP_NAME` | Your Function App name |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Publish profile XML from Function App |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEB` | Static Web App deployment token |

**CLI option:**
```bash
gh secret set SECRET_NAME --body "value"
```

---

## Step 5: Deploy

Push to main branch to trigger all workflows:
```bash
git push origin main
```

Or manually trigger from GitHub Actions tab.

---

## Step 6: Configure Custom Domains

### In Azure Portal
For Static Web App:
1. Go to **Custom Domains**
2. Add your domain (e.g., `url.yourdomain.com`)
3. Follow validation instructions

### In Cloudflare
1. Ensure DNS records point correctly
2. Enable "Proxied" mode for your short domain
3. Verify Worker route is configured

---

## Verification

1. **Functions**: `curl https://<function-app>.azurewebsites.net/api/auth/check?email=test@example.com`
2. **Web App**: Visit `https://url.yourdomain.com` - should show login page
3. **Worker**: Visit `https://yourdomain.com/invalidid` - should redirect to DEFAULT_URL
4. Create a short URL and test the redirect
