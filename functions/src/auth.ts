/**
 * Authentication utilities for validating Microsoft ID tokens
 */

import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getTableClient, ensureTableExists } from './utils';

// JWKS client for fetching Microsoft's public keys (common endpoint for multi-tenant)
const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
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
    // First decode without verification to check issuer format
    const unverified = jwt.decode(token, { complete: true }) as jwt.Jwt | null;
    if (!unverified) {
      reject(new Error('Invalid token format'));
      return;
    }

    const payload = unverified.payload as jwt.JwtPayload;
    const issuer = payload.iss;

    // Validate issuer format (multi-tenant + personal accounts)
    if (!issuer || !issuer.startsWith('https://login.microsoftonline.com/') || !issuer.endsWith('/v2.0')) {
      reject(new Error('Invalid token issuer'));
      return;
    }

    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: issuer, // Use the issuer from the token
      },
      (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        const verifiedPayload = decoded as jwt.JwtPayload;
        
        // Extract email from various possible claims
        const email = verifiedPayload.email || verifiedPayload.preferred_username || verifiedPayload.upn;
        
        if (!email) {
          reject(new Error('No email claim found in token'));
          return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        console.log(`[AUTH] Token validated for email: ${normalizedEmail}`);

        resolve({
          email: normalizedEmail,
          name: verifiedPayload.name,
          oid: verifiedPayload.oid,
          sub: verifiedPayload.sub,
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
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Checking if user is allowed: ${normalizedEmail}`);
    await client.getEntity('users', normalizedEmail);
    console.log(`[AUTH] User ${normalizedEmail} found in AllowedUsers table`);
    return true;
  } catch (error) {
    console.log(`[AUTH] User ${email.toLowerCase().trim()} NOT found in AllowedUsers table:`, error);
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
    const normalizedEmail = email.toLowerCase().trim();
    const entity = await client.getEntity('users', normalizedEmail);
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
