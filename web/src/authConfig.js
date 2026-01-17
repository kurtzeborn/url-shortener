/**
 * MSAL Configuration for Microsoft Authentication
 * 
 * To set up your Azure AD App Registration:
 * 1. Go to Azure Portal > Azure Active Directory > App registrations
 * 2. Click "New registration"
 * 3. Name: "URL Shortener (k61.dev)"
 * 4. Supported account types: "Personal Microsoft accounts only" or "Accounts in any organizational directory and personal Microsoft accounts"
 * 5. Redirect URI: Select "Single-page application (SPA)" and enter:
 *    - http://localhost:5173 (for local dev)
 *    - https://url.k61.dev (for production)
 * 6. Copy the Application (client) ID and paste below
 */

// For local development, you need to register an app in Azure AD
// Replace this with your actual client ID from Azure AD App Registration
const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';

export const msalConfig = {
  auth: {
    clientId,
    authority: 'https://login.microsoftonline.com/common', // Multi-tenant + personal accounts
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scopes for ID token (basic profile info)
export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

// Scopes for access token (if calling Microsoft Graph API)
export const graphRequest = {
  scopes: ['User.Read'],
};
