# Cloudflare Worker

This directory contains the Cloudflare Worker that handles redirects at the edge for `k61.dev/<id>`.

## Features

- Sub-10ms redirect performance at Cloudflare's global edge network
- Direct lookup from Azure Table Storage using REST API
- Fire-and-forget click tracking to Azure Functions
- Graceful error handling (always redirects somewhere)

## Development

```bash
npm install
npm run dev  # Start local development server
```

## Deployment

```bash
npm run deploy  # Deploy to Cloudflare
```

## Environment Variables

Set these via Cloudflare dashboard or `wrangler secret put`:

- `AZURE_STORAGE_ACCOUNT` - Your Azure storage account name
- `AZURE_STORAGE_SAS` - SAS token for Table Storage access
- `AZURE_API_URL` - Azure Functions base URL
- `INTERNAL_API_KEY` - Secure key for calling click tracking API

## Testing Locally

```bash
wrangler dev
# Visit http://localhost:8787/<id> to test
```
