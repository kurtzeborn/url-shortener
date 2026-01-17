# k61.dev URL Shortener

A modern, serverless URL shortener built on Azure and Cloudflare, providing lightning-fast redirects with comprehensive analytics.

## Features

- ⚡ **Sub-10ms redirects** via Cloudflare Workers at the edge
- 🔐 **Microsoft account authentication** with allowlist-based access control
- 📊 **Analytics dashboard** with click tracking, sorting, and filtering
- 🎯 **Short URLs** - Random 4-character base62 IDs (14.7M capacity)
- 🆓 **100% free tier** - Cloudflare Workers + Azure free tier
- 👥 **User management** - Self-service invitations with rate limiting

## Architecture

- **`k61.dev/<id>`** - Cloudflare Worker handles redirects at edge
- **`url.k61.dev`** - Azure Static Web App (dashboard, management UI)
- **`www.k61.dev`** - Generic landing page for all k61.dev projects
- **Backend** - Azure Functions (API, auth, CRUD)
- **Storage** - Azure Table Storage (URLs, users, analytics)

## Quick Links

- [Full Project Plan](PLAN.md) - Detailed requirements and architecture
- [Setup Guide](#setup) - Step-by-step deployment instructions
- [Development Guide](#development) - Local development setup

## Project Structure

```
url-shortener/
├── workers/          # Cloudflare Worker for redirects
├── functions/        # Azure Functions (API backend)
├── web/              # Frontend (url.k61.dev)
├── landing/          # Landing page (www.k61.dev)
├── tests/            # Unit and integration tests
└── docs/             # Documentation and screenshots
```

## Tech Stack

- **Edge**: Cloudflare Workers (redirects)
- **Frontend**: Azure Static Web Apps (React or Vanilla JS)
- **Backend**: Azure Functions (Node.js/TypeScript)
- **Database**: Azure Table Storage
- **Auth**: Microsoft OAuth 2.0
- **CI/CD**: GitHub Actions

## Setup

See [PLAN.md - Bootstrap Process](PLAN.md#bootstrap-process) for detailed setup instructions.

### Prerequisites

- Azure subscription (free tier)
- Cloudflare account (free tier)
- GitHub account
- k61.dev domain configured in Namecheap

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/kurtzeborn/url-shortener.git
   cd url-shortener
   ```

2. **Configure Cloudflare** (see PLAN.md for details)
   - Add k61.dev to Cloudflare
   - Deploy Worker
   - Configure DNS

3. **Configure Azure** (see PLAN.md for details)
   - Create Storage Account
   - Create Function App
   - Create Static Web Apps

4. **Bootstrap first user** (see PLAN.md for details)
   - Add your email to AllowedUsers table via Azure Portal

## Development

Coming soon...

## Testing

Coming soon...

## Deployment

GitHub Actions will automatically deploy:
- Cloudflare Worker on push to `main`
- Azure Functions on push to `main`
- Static Web Apps on push to `main`

## License

MIT
