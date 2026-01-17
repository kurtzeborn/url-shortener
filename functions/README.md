# Azure Functions API

Backend API for the URL shortener built with Azure Functions.

## API Endpoints

### URL Management
- `POST /api/urls` - Create new shortened URL
- `GET /api/urls` - Get user's URLs (paginated, sortable, filterable)
- `PUT /api/urls/:id` - Update destination URL
- `DELETE /api/urls/:id` - Delete shortened URL

### Click Tracking
- `POST /api/click/:id` - Increment click count (internal, called by Worker)

### Authentication
- `POST /api/auth` - Validate JWT token and check user authorization

### User Management
- `POST /api/users` - Add user to allowlist (rate limited, 10/day)

## Development

```bash
npm install
npm run build
npm run start  # Start local Functions runtime
```

## Testing

Test endpoints locally at `http://localhost:7071/api/*`

## Environment Variables

Copy `local.settings.json.template` to `local.settings.json` and fill in:

- `AZURE_STORAGE_CONNECTION_STRING` - Connection string for Table Storage
- `INTERNAL_API_KEY` - Secure key for click tracking API
- `MICROSOFT_CLIENT_ID` - Microsoft OAuth app client ID (for auth)
- `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth app client secret
- `JWT_SECRET` - Secret for signing JWTs

## Deployment

Deploy via Azure CLI or GitHub Actions (see root README).
