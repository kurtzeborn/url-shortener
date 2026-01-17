# GitHub Actions CI/CD

This directory contains automated deployment workflows.

## Workflows

### deploy-worker.yml
Deploys Cloudflare Worker on changes to `workers/` directory.

**Required Secrets:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers deploy permissions
- `AZURE_STORAGE_ACCOUNT` - Azure storage account name
- `AZURE_STORAGE_KEY` - Azure storage account key
- `AZURE_API_URL` - Azure Functions API URL (e.g., https://my-func.azurewebsites.net)
- `INTERNAL_API_KEY` - Secure random key for internal API

### deploy-functions.yml
Deploys Azure Functions on changes to `functions/` directory.

**Required Secrets:**
- `AZURE_FUNCTIONAPP_NAME` - Name of Azure Function App
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` - Publish profile from Azure Portal

### deploy-web.yml
Deploys web app (url.k61.dev) on changes to `web/` directory.

**Required Secrets:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN_WEB` - Deployment token from Azure Static Web Apps

### deploy-landing.yml
Deploys landing page (www.k61.dev) on changes to `landing/` directory.

**Required Secrets:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN_LANDING` - Deployment token from Azure Static Web Apps

### test.yml
Runs tests and linting on all pushes and pull requests.

## Setup

1. Create Azure resources (Storage, Functions, Static Web Apps)
2. Get deployment credentials from Azure Portal
3. Add secrets to GitHub repository settings
4. Push to main branch to trigger deployments
