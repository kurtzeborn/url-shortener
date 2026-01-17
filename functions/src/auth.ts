/**
 * Authentication utilities for validating Microsoft ID tokens
 */

import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getTableClient, ensureTableExists } from './utils';

// JWKS client for fetching Microsoft's public keys
const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/consumers/discovery/v2.0/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Get signing key from JWKS
function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export interface DecodedToken {
  email: string;
  name?: string;
  oid?: string;
  sub?: string;
}

/**
 * Validate a Microsoft ID token and extract user info
 */
export function validateToken(token: string): Promise<DecodedToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0', // Consumer tenant
        // Note: audience validation should match your client ID
      },
      (err, decoded) => {
        if (err) {
          reject(err);
          return;
        }

        const payload = decoded as jwt.JwtPayload;
        
        // Extract email from various possible claims
        const email = payload.email || payload.preferred_username || payload.upn;
        
        if (!email) {
          reject(new Error('No email claim found in token'));
          return;
        }

        resolve({
          email: email.toLowerCase(),
          name: payload.name,
          oid: payload.oid,
          sub: payload.sub,
        });
      }
    );
  });
}

/**
 * Extract and validate token from Authorization header
 */
export async function getUserFromAuthHeader(authHeader: string | null): Promise<DecodedToken | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  try {
    return await validateToken(token);
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

/**
 * Check if a user is in the AllowedUsers table
 */
export async function isUserAllowed(email: string): Promise<boolean> {
  try {
    await ensureTableExists('AllowedUsers');
    const client = getTableClient('AllowedUsers');
    await client.getEntity('users', email.toLowerCase());
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user info from AllowedUsers table
 */
export async function getAllowedUserInfo(email: string): Promise<{ addedDate: string; addedBy: string } | null> {
  try {
    await ensureTableExists('AllowedUsers');
    const client = getTableClient('AllowedUsers');
    const entity = await client.getEntity('users', email.toLowerCase());
    return {
      addedDate: entity.AddedDate as string,
      addedBy: entity.AddedBy as string,
    };
  } catch {
    return null;
  }
}

/**
 * Authentication result - either success with user info, or failure with error response
 */
export type AuthResult = 
  | { success: true; user: DecodedToken }
  | { success: false; response: { status: number; body: string; headers: { 'Content-Type': string } } };

/**
 * Authenticate and authorize a request in one call.
 * Returns the user if authenticated and allowed, or an error response if not.
 * 
 * Usage:
 *   const auth = await authenticateRequest(request.headers.get('Authorization'));
 *   if (!auth.success) return auth.response;
 *   const userEmail = auth.user.email;
 */
export async function authenticateRequest(authHeader: string | null): Promise<AuthResult> {
  const user = await getUserFromAuthHeader(authHeader);
  if (!user) {
    return {
      success: false,
      response: {
        status: 401,
        body: JSON.stringify({ error: { code: 'INVALID_TOKEN', message: 'Invalid or missing authentication token' } }),
        headers: { 'Content-Type': 'application/json' },
      },
    };
  }

  const allowed = await isUserAllowed(user.email);
  if (!allowed) {
    return {
      success: false,
      response: {
        status: 403,
        body: JSON.stringify({ error: { code: 'USER_NOT_ALLOWED', message: 'User not authorized to access this application' } }),
        headers: { 'Content-Type': 'application/json' },
      },
    };
  }

  return { success: true, user };
}
