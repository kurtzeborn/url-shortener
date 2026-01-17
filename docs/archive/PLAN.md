# URL Shortener Project Plan (k61.dev)

## Core Requirements

1. **Hosting**: Azure (free tier only), new subscription + Cloudflare Workers (free tier)
2. **Domain**: k61.dev (purchased via Namecheap)
3. **Repo**: github.com/kurtzeborn/url-shortener
4. **Redirect**: `https://k61.dev/<id>` → Cloudflare Worker looks up ID in Azure Table Storage and redirects (or redirects to url.k61.dev if not found)
5. **Authentication**: Microsoft account login required to create/manage URLs
6. **Landing Page**: `https://www.k61.dev` → generic landing page for all projects (including link to URL shortener)
7. **URL Shortener App**: `https://url.k61.dev` → full application (login, dashboard, create URLs, settings)
8. **Dashboard**: After login at url.k61.dev, view your shortened URLs (paginated, 10 per page) with sorting/filtering by date and click count
9. **Access Control**: Only allowlisted email addresses can create URLs (separate AllowedUsers table)
10. **URL Management**: Users can view, create, edit, and delete their shortened URLs
11. **User Management**: Any allowed user can add other email addresses to the allowlist via settings page at url.k61.dev (max 10 invites per user per day, duplicate prevention)
12. **Analytics**: Track click count per URL using fire-and-forget async updates (no impact on redirect speed)
13. **Testing**: Comprehensive unit and integration tests for redirect logic, ID collision handling, and authorization

## Domain Architecture

- **`k61.dev/<id>`** - Apex domain, handled by **Cloudflare Worker** → looks up ID → redirects (shortest possible URLs, <10ms edge performance)
- **`www.k61.dev`** - Azure Static Web App → generic landing page for all k61.dev projects
- **`url.k61.dev`** - Azure Static Web App → URL shortener application (login, dashboard, URL management, user management)
- **`url.k61.dev/api/*`** - Azure Functions → backend API (auth, CRUD operations, click tracking)
- **Reserved IDs**: `favicon.ico`, `robots.txt`, `sitemap.xml` (minimal set)

## ID Generation

- **Strategy**: Random 4-character base62 IDs (not sequential)
- **Character set**: Case-sensitive alphanumeric (a-z, A-Z, 0-9) = 62 possibilities
- **Capacity**: 62^4 = **14,776,336** possible IDs (~14.7 million)
- **Collision handling**: Generate random ID, check existence in URLs table, retry if collision
- **Scaling**: Add logic to bump to 5-char IDs after 100k URLs created (5 chars = 916M IDs)
- **Future growth**: Variable length support for manual aliases

## Data Storage (Azure Table Storage)

### Table 1: URLs (optimized for redirect lookups)
- **Partition Key**: ID prefix (first 2 chars)
- **Row Key**: ID (full ID)
- **Columns**: URL, Owner, CreatedDate, ClickCount

### Table 2: UserURLs (optimized for dashboard queries)
- **Partition Key**: Owner (email)
- **Row Key**: ID
- **Columns**: URL, CreatedDate, ClickCount (denormalized for sorting)

### Table 3: AllowedUsers (access control)
- **Partition Key**: "users"
- **Row Key**: Email
- **Columns**: AddedDate, AddedBy (email of user who added them)

### Table 4: UserInvites (rate limiting)
- **Partition Key**: Email (inviter)
- **Row Key**: Date (YYYY-MM-DD)
- **Columns**: InviteCount

## Technical Stack

### Frontend
- **Azure Static Web Apps** (free tier) for url.k61.dev and www.k61.dev
- **Framework**: Vanilla JS or React (TBD)

### Backend
- **Cloudflare Workers** (free tier: 100,000 req/day) for apex domain redirects at edge
- **Azure Functions** (consumption plan, free tier: 1M executions/month) for API endpoints
- **Azure Table Storage** (free tier: 20k operations/month) for data persistence

### Infrastructure
- **DNS**: Cloudflare DNS (free)
- **SSL**: Cloudflare + Azure-managed certificates (required for .dev domains)
- **CI/CD**: GitHub Actions
- **Environment**: Single production environment (no dev/staging initially)

### Testing
- **Unit Tests**: Jest/Mocha for business logic
- **Integration Tests**: Test Azure Functions and Cloudflare Worker locally
- **Worker Testing**: Miniflare (local Cloudflare Worker simulator)

## Cloudflare Worker Implementation

**File**: `workers/redirect.js`

```javascript
// Cloudflare Worker for k61.dev/<id> redirects
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = url.pathname.slice(1); // Remove leading /
    
    // Handle reserved paths
    if (['favicon.ico', 'robots.txt', 'sitemap.xml', ''].includes(id)) {
      return Response.redirect('https://url.k61.dev', 302);
    }
    
    // Look up URL in Azure Table Storage
    const targetUrl = await lookupUrl(id, env.AZURE_STORAGE_CONNECTION);
    
    if (targetUrl) {
      // Fire-and-forget click tracking (don't await)
      fetch(`https://url.k61.dev/api/click/${id}`, { 
        method: 'POST',
        headers: { 'X-Internal-Key': env.INTERNAL_API_KEY }
      }).catch(() => {}); // Ignore errors
      
      return Response.redirect(targetUrl, 302);
    }
    
    // ID not found, redirect to app
    return Response.redirect('https://url.k61.dev', 302);
  }
};

async function lookupUrl(id, connectionString) {
  // Query Azure Table Storage REST API
  // Implementation details...
}
```

**Environment Variables (Cloudflare):**
- `AZURE_STORAGE_CONNECTION` - Connection string for Table Storage
- `INTERNAL_API_KEY` - Secure key for click tracking API

## Application Pages (url.k61.dev)

1. **/** - Home/login page
2. **/dashboard** - View your shortened URLs (paginated, sortable by date/clicks, filterable)
3. **/create** - Create new shortened URL
4. **/settings** - Manage allowlist (add users, view who added you)

## API Endpoints (url.k61.dev/api/*)

**Azure Functions:**
- `POST /api/auth/login` - Initiate Microsoft OAuth flow
- `POST /api/auth/callback` - Handle OAuth callback, check AllowedUsers
- `GET /api/urls` - Get user's URLs (paginated, filtered, sorted)
- `POST /api/urls` - Create new shortened URL (generate ID, check collision)
- `PUT /api/urls/:id` - Edit destination URL
- `DELETE /api/urls/:id` - Delete shortened URL
- `POST /api/click/:id` - Increment click count (internal, called by Worker)
- `GET /api/users` - Get AllowedUsers list (for current user)
- `POST /api/users/add` - Add user to allowlist (rate limited)

## Dashboard Features

**Sorting options:**
- Date: Newest first / Oldest first
- Clicks: Most clicked / Least clicked

**Filtering options:**
- Date range (created between X and Y)
- Minimum click count

**Display:**
- 10 URLs per page
- Show: Short URL, Full URL, Click count, Created date
- Actions: Edit, Delete, Copy link

## User Management Authorization

**Add User Flow (POST /api/users/add):**
1. Validate auth token → extract current user email
2. Check if current user exists in AllowedUsers table (403 if not)
3. Validate new email format (400 if invalid)
4. Check if new email already exists in AllowedUsers (409 if duplicate)
5. Check UserInvites table for current user + today's date (403 if >= 10 invites today)
6. Insert new user into AllowedUsers (AddedBy = current user)
7. Increment InviteCount in UserInvites table (or create entry if first invite today)

**Rate Limiting:**
- Maximum 10 invites per user per day
- Reset at midnight UTC
- Display remaining invites on settings page

## Testing Requirements

### Unit Tests
- Random ID generation (format, uniqueness, length)
- ID collision retry logic (max retries, eventual success)
- URL validation (format, max length, protocol requirements)
- Authorization checks (allowed user verification)
- Rate limit calculation (daily invite count)
- Duplicate email detection

### Integration Tests
- Full redirect flow (Worker → Table Storage → redirect → async click update)
- Auth flow (login → check allowlist → allow/deny)
- CRUD operations on URLs table (create, read, update, delete)
- User invitation flow (add user → verify AllowedUsers entry → verify rate limit)
- ID collision handling under concurrent requests

### Cloudflare Worker Tests
- Use **Miniflare** for local testing
- Test reserved path handling
- Test redirect logic
- Test error handling (Table Storage unavailable)

### Load Tests (optional but recommended)
- Redirect performance under load (< 100ms target, should be <10ms with Workers)
- Concurrent ID generation (verify no collisions)

## Performance Target

- **Redirects complete in < 100ms** (realistically <10ms with Cloudflare edge network)
- Click count updates happen asynchronously to avoid slowing redirects
- Azure Functions cold starts acceptable (only affect API calls, not redirects)

## Bootstrap Process

**Initial Setup Documentation (README + screenshots):**

### Step 1: Configure Cloudflare
1. Add k61.dev to Cloudflare (free plan)
2. Update Namecheap nameservers to Cloudflare's
3. Enable "Proxied" mode for apex domain
4. Deploy Cloudflare Worker
5. Add Worker route: `k61.dev/*` → redirect worker

### Step 2: Configure Azure
1. Create Storage Account → Table Storage
2. Create Static Web App for url.k61.dev
3. Create Function App (consumption plan)
4. Configure custom domains + SSL certificates

### Step 3: Add First User
1. Navigate to Azure Portal → Storage Account → Table Storage
2. Open `AllowedUsers` table (create if doesn't exist)
3. Click "Add Entity"
4. Enter values:
   - **PartitionKey**: `users`
   - **RowKey**: `your@email.com`
   - **AddedDate** (DateTime): `2026-01-16T12:00:00Z`
   - **AddedBy** (String): `system`
5. Click "Insert"
6. Navigate to url.k61.dev and log in with that email

### Step 4: Create Tables
Ensure all 4 tables exist:
- `URLs`
- `UserURLs`
- `AllowedUsers`
- `UserInvites`

*Include screenshots in repo README for each step*

## Cost Breakdown (All Free Tier)

- **Cloudflare Workers**: 100,000 requests/day (free forever)
- **Azure Functions**: 1,000,000 executions/month (free)
- **Azure Table Storage**: 20,000 operations/month (free - note: may need to verify if sufficient)
- **Azure Static Web Apps**: Free tier (100 GB bandwidth/month)
- **Cloudflare DNS**: Free
- **SSL Certificates**: Free (Cloudflare + Azure managed)

**Scaling considerations**: If you exceed free tiers, costs are minimal:
- Cloudflare Workers: $5/month for 10M requests
- Azure Functions: $0.20 per million executions
- Table Storage: $0.045 per 10k operations

## Future Considerations

1. **Custom aliases**: Add ability to specify custom ID instead of random generation (reserved word validation required)
2. **Email support**: DNS/architecture allows for future email at k61.dev
3. **Multiple projects**: Other projects can be added as additional subdomains (e.g., blog.k61.dev, tools.k61.dev)
4. **Advanced analytics**: Click-through rates, geographic data, referrer tracking (Cloudflare Analytics available)
5. **QR codes**: Generate QR codes for shortened URLs
6. **Cloudflare KV**: Cache frequently accessed URLs in Workers KV for even faster lookups

## Security Considerations

- **Input validation**: All URLs validated before storage
- **Rate limiting**: 10 invites per user per day
- **Authorization**: Every endpoint checks AllowedUsers table
- **Duplicate prevention**: Email uniqueness enforced in AllowedUsers
- **Audit trail**: AddedBy column tracks who invited whom
- **HTTPS only**: Required for .dev domains (enforced by Cloudflare + Azure)
- **DDoS protection**: Cloudflare provides free DDoS protection
- **API key**: Internal API for click tracking (Worker → Functions)

---

**Status**: Plan complete, ready for implementation.
