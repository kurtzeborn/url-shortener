# Authentication Setup Guide

## Azure AD App Registration

To enable Microsoft authentication, you need to register an application in Azure AD:

### Step 1: Create App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: `URL Shortener (k61.dev)`
   - **Supported account types**: Select one of:
     - "Personal Microsoft accounts only" (if only personal accounts)
     - "Accounts in any organizational directory and personal Microsoft accounts" (if both work and personal)
   - **Redirect URI**: 
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173` (for local dev)

### Step 2: Configure Redirect URIs
After creation, go to **Authentication** and add:
- `http://localhost:5173` (local development)
- `https://url.k61.dev` (production)

### Step 3: Get Client ID
1. Go to the app's **Overview** page
2. Copy the **Application (client) ID**
3. Create `web/.env` file:
   ```
   VITE_MICROSOFT_CLIENT_ID=your-client-id-here
   ```

### Step 4: Add First User to AllowedUsers
For the application to work, add yourself to the AllowedUsers table:

**Using Azure Portal:**
1. Go to Storage Account > Tables
2. Open `AllowedUsers` table
3. Add entity:
   - PartitionKey: `users`
   - RowKey: `your@email.com`
   - AddedDate: `2026-01-16T00:00:00Z`
   - AddedBy: `system`

**Using Azurite (local):**
Use Azure Storage Explorer or add via API call.

## Local Development Without Auth

For quick local testing without setting up Azure AD, you can:

1. Set `VITE_SKIP_AUTH=true` in your `.env` file
2. The app will use a mock user

This is NOT for production use.
