# Cloudflare Worker

This directory contains the Cloudflare Worker that handles redirects at the edge for shortened URLs.

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

| Variable | Required | Description |
|----------|----------|-------------|
| `DEFAULT_URL` | Yes | URL to redirect to for unknown/invalid IDs (e.g., your app's homepage) |
| `AZURE_STORAGE_ACCOUNT` | Yes | Your Azure storage account name |
| `AZURE_STORAGE_SAS` | Yes | SAS token for Table Storage access |
| `AZURE_API_URL` | Yes | Azure Functions base URL for click tracking |
| `INTERNAL_API_KEY` | Yes | Secure key for calling click tracking API |

## Testing Locally

```bash
wrangler dev
# Visit http://localhost:8787/<id> to test
```

## Customizing for Your Domain

1. Update `wrangler.toml` with your Cloudflare account ID and domain routes
2. Set all environment variables via `wrangler secret put <VAR_NAME>`
3. Deploy with `npm run deploy`
