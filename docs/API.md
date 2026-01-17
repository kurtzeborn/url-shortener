# URL Shortener API Documentation

Base URL: `https://api.k61.dev` (production) or `http://localhost:7071` (development)

## Authentication

All endpoints except `/api/auth/check` and `/api/click/{id}` require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <Microsoft ID Token>
```

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_TOKEN` | 401 | Missing or invalid authentication token |
| `USER_NOT_ALLOWED` | 403 | User not in AllowedUsers list |
| `NOT_OWNER` | 403 | User doesn't own this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `URL_NOT_FOUND` | 404 | Shortened URL not found |
| `MISSING_URL` | 400 | Required `url` field not provided |
| `INVALID_URL` | 400 | URL format is invalid |
| `URL_TOO_LONG` | 400 | URL exceeds 2048 character limit |
| `RATE_LIMITED` | 429 | Too many requests |

---

## Endpoints

### URLs

#### Create URL
```
POST /api/urls
```

**Request Body:**
```json
{
  "url": "https://example.com/long/url"
}
```

**Response (201 Created):**
```json
{
  "id": "aBc1",
  "shortUrl": "https://k61.dev/aBc1",
  "url": "https://example.com/long/url",
  "createdAt": "2026-01-16T12:00:00.000Z",
  "clickCount": 0
}
```

---

#### List URLs
```
GET /api/urls
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `pageSize` | number | 10 | Items per page |
| `sortBy` | string | "date" | Sort field: "date" or "clicks" |
| `sortOrder` | string | "desc" | Sort order: "asc" or "desc" |

**Response (200 OK):**
```json
{
  "urls": [
    {
      "id": "aBc1",
      "shortUrl": "https://k61.dev/aBc1",
      "url": "https://example.com/long/url",
      "createdAt": "2026-01-16T12:00:00.000Z",
      "clickCount": 42
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

#### Get URL
```
GET /api/urls/{id}
```

**Response (200 OK):**
```json
{
  "id": "aBc1",
  "shortUrl": "https://k61.dev/aBc1",
  "url": "https://example.com/long/url",
  "createdAt": "2026-01-16T12:00:00.000Z",
  "clickCount": 42
}
```

---

#### Update URL
```
PUT /api/urls/{id}
```

**Request Body:**
```json
{
  "url": "https://example.com/new/url"
}
```

**Response (200 OK):**
```json
{
  "id": "aBc1",
  "shortUrl": "https://k61.dev/aBc1",
  "url": "https://example.com/new/url",
  "updatedAt": "2026-01-16T13:00:00.000Z"
}
```

---

#### Delete URL
```
DELETE /api/urls/{id}
```

**Response:** `204 No Content`

---

### Users

#### Invite User
```
POST /api/users
```

**Request Body:**
```json
{
  "email": "newuser@example.com"
}
```

**Response (201 Created):**
```json
{
  "email": "newuser@example.com",
  "addedAt": "2026-01-16T12:00:00.000Z",
  "addedBy": "inviter@example.com",
  "remainingInvites": 9
}
```

**Rate Limit:** 10 invites per user per day.

---

### Auth

#### Check User Access
```
GET /api/auth/check?email={email}
```

**Response (200 OK):**
```json
{
  "allowed": true,
  "email": "user@example.com"
}
```

---

### Internal APIs

These endpoints are for internal use only (Cloudflare Worker).

#### Track Click
```
POST /api/click/{id}
```

**Headers:**
```
X-Internal-Key: <INTERNAL_API_KEY>
```

**Response (200 OK):**
```json
{
  "clickCount": 43
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SHORT_URL_DOMAIN` | Domain for short URLs (default: `k61.dev`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Table Storage connection |
| `INTERNAL_API_KEY` | Key for internal API authentication |
