# Deployment Guide

## Prerequisites
- Azure subscription (free tier works)
- Cloudflare account (free)
- GitHub account with repo access

---

## Step 1: Azure AD App Registration

Required for Microsoft authentication.

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: `URL Shortener (k61.dev)`
   - **Supported account types**: "Personal Microsoft accounts only"
   - **Redirect URI**: Single-page application (SPA) → `http://localhost:5173`
4. After creation, add production redirect URI:
   - Go to **Authentication** → Add `https://url.k61.dev`
5. Copy **Application (client) ID** for later

---

## Step 2: Azure Resources

### Storage Account
1. Create Storage Account (Standard, LRS, free tier eligible)
2. Go to **Tables** → Create tables:
   - `URLs`
   - `UserURLs`
   - `AllowedUsers`
   - `UserInvites`
3. Add yourself to AllowedUsers:
   - PartitionKey: `users`
   - RowKey: `your@email.com`
   - AddedAt: `2026-01-16T00:00:00Z`
   - AddedBy: `system`
4. Copy **Connection string** from Access keys

### Function App
1. Create Function App:
   - Runtime: Node.js 20
   - Plan: Consumption (Serverless)
   - Region: Same as Storage Account
2. Go to **Configuration** → Add:
   - `AZURE_STORAGE_CONNECTION_STRING`: (from step 2.4)
   - `INTERNAL_API_KEY`: (generate random 32-char string)
   - `SHORT_URL_DOMAIN`: `k61.dev`
3. Go to **Deployment Center** → Get **Publish Profile**

### Static Web App (url.k61.dev)
1. Create Static Web App:
   - Plan: Free
   - Source: GitHub → select repo
   - Build preset: React
   - App location: `/web`
   - API location: (leave empty, using separate Functions)
   - Output location: `dist`
2. Go to **Configuration** → Add:
   - `VITE_MICROSOFT_CLIENT_ID`: (from Step 1.5)
3. Copy **Deployment token** from Overview

### Static Web App (www.k61.dev)
1. Create another Static Web App for landing page
2. Build preset: Custom
3. App location: `/landing`
4. Output location: `dist`
5. Copy **Deployment token**

---

## Step 3: Cloudflare Worker

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → Create Worker
3. Name: `k61-redirect`
4. Add environment variables:
   - `AZURE_API_URL`: `https://<your-function-app>.azurewebsites.net`
   - `INTERNAL_API_KEY`: (same as Function App)
5. Get **API Token** with Workers:Edit permission

### DNS Setup
1. Add k61.dev to Cloudflare
2. Update nameservers at Namecheap
3. Add Worker route: `k61.dev/*` → `k61-redirect`
4. Add CNAME records:
   - `www` → `<static-web-app-url>.azurestaticapps.net`
   - `url` → `<static-web-app-url>.azurestaticapps.net`

---

## Step 4: GitHub Secrets

Go to repo **Settings** → **Secrets and variables** → **Actions** → Add:

| Secret | Value |
|--------|-------|
| `AZURE_FUNCTIONAPP_NAME` | Your Function App name |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Publish profile XML |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_WEB` | url.k61.dev deployment token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_LANDING` | www.k61.dev deployment token |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `AZURE_STORAGE_ACCOUNT` | Storage account name |
| `AZURE_STORAGE_KEY` | Storage account key |
| `AZURE_API_URL` | Function App URL (https://xxx.azurewebsites.net) |
| `INTERNAL_API_KEY` | Random 32-char key for internal API |

---

## Step 5: Deploy

Push to main branch to trigger all workflows:
```bash
git push origin main
```

Or manually trigger from GitHub Actions tab.

---

## Verification

1. **Functions**: `curl https://<function-app>.azurewebsites.net/api/auth/check?email=test@example.com`
2. **Web App**: Visit `https://url.k61.dev` - should show login page
3. **Worker**: Visit `https://k61.dev/test` - should redirect to url.k61.dev
4. **Landing**: Visit `https://www.k61.dev` - should show landing page
