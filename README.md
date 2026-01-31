# k61.dev URL Shortener

[![functions](https://img.shields.io/github/actions/workflow/status/kurtzeborn/url-shortener/deploy-functions.yml?label=functions)](https://github.com/kurtzeborn/url-shortener/actions/workflows/deploy-functions.yml)
[![web](https://img.shields.io/github/actions/workflow/status/kurtzeborn/url-shortener/deploy-web.yml?label=web)](https://github.com/kurtzeborn/url-shortener/actions/workflows/deploy-web.yml)
[![worker](https://img.shields.io/github/actions/workflow/status/kurtzeborn/url-shortener/deploy-worker.yml?label=worker)](https://github.com/kurtzeborn/url-shortener/actions/workflows/deploy-worker.yml)
[![tests](https://img.shields.io/github/actions/workflow/status/kurtzeborn/url-shortener/test.yml?label=tests)](https://github.com/kurtzeborn/url-shortener/actions/workflows/test.yml)

A serverless URL shortener built on Azure and Cloudflare with sub-10ms edge redirects.

## Architecture

```mermaid
flowchart LR
    subgraph Internet
        User([User])
    end
    
    subgraph Cloudflare
        Worker[Cloudflare Worker<br/>k61.dev/*]
    end
    
    subgraph Azure
        SWA[Static Web App<br/>url.k61.dev]
        Functions[Azure Functions<br/>API]
        Storage[(Table Storage<br/>URLs, Users)]
    end
    
    User -->|k61.dev/abc| Worker
    Worker -->|lookup| Storage
    Worker -.->|track click| Functions
    Worker -->|302 redirect| User
    
    User -->|url.k61.dev| SWA
    SWA -->|API calls| Functions
    Functions -->|CRUD| Storage
```

## Table Schema

```mermaid
erDiagram
    AllowedUsers {
        string PartitionKey "always 'user'"
        string RowKey "email (lowercase)"
        string addedBy "inviter email"
        datetime addedAt
    }
    
    URLs {
        string PartitionKey "first 2 chars of shortcode"
        string RowKey "shortcode (e.g. 2Tn3)"
        string URL "destination URL"
        string Owner "creator email"
        int ClickCount
        datetime CreatedAt
    }
    
    UserURLs {
        string PartitionKey "owner email"
        string RowKey "shortcode"
        string URL "destination URL"
        int ClickCount
        datetime CreatedAt
    }
    
    UserInvites {
        string PartitionKey "inviter email"
        string RowKey "date (YYYY-MM-DD)"
        int InviteCount "invites sent that day"
    }
    
    AllowedUsers ||--o{ URLs : "owns"
    AllowedUsers ||--o{ UserURLs : "owns"
    AllowedUsers ||--o{ UserInvites : "sent"
```

## Features

- ⚡ **Sub-10ms redirects** via Cloudflare Workers edge network
- 🔐 **Microsoft account auth** with allowlist access control
- 📊 **Dashboard** with click tracking, sorting, pagination
- 🎯 **Short 4-char IDs** - 14.7M capacity (base62)
- 🆓 **Free tier** - All services within free limits

## Cost

All services run within free tier limits:

| Service | Free Limit |
|---------|------------|
| Azure Functions | 1M executions/month |
| Azure Table Storage | ~$0.045/GB + $0.00036/10K transactions |
| Azure Static Web Apps | 100GB bandwidth/month |
| Cloudflare Workers | 100K requests/day |
| GitHub Actions | 2000 min/month (public repo) |

## Project Structure

```
├── workers/      # Cloudflare Worker (redirects)
├── functions/    # Azure Functions (API)
├── web/          # Dashboard app (url.k61.dev)
└── docs/         # Documentation
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint
```

### Local Development

```bash
# Functions (requires Azure Functions Core Tools)
cd functions && npm start

# Web dashboard
cd web && npm run dev
```

## Deployment

All deployments are automatic via GitHub Actions on push to `main`:

| Component | Workflow | Destination |
|-----------|----------|-------------|
| Worker | deploy-worker.yml | Cloudflare Workers |
| Functions | deploy-functions.yml | Azure Functions |
| Web | deploy-web.yml | Azure Static Web Apps |

## Data Model

**Azure Table Storage tables:**

- `URLs` - Short ID → destination URL mapping
- `UserURLs` - Per-user URL index for dashboard
- `AllowedUsers` - Email allowlist
- `UserInvites` - Daily invite rate limiting

## License

MIT
