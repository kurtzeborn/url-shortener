/**
 * Shared utilities for Azure Functions
 */

import { TableClient } from '@azure/data-tables';

// Get Table Storage clients
export function getTableClient(tableName: string): TableClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING not configured');
  }
  return TableClient.fromConnectionString(connectionString, tableName);
}

// Base62 character set for ID generation
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a random base62 ID
 */
export function generateId(length: number = 4): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += BASE62_CHARS[Math.floor(Math.random() * BASE62_CHARS.length)];
  }
  return id;
}

/**
 * Validate ID format (base62 only)
 */
export function isValidId(id: string): boolean {
  if (!id || id.length === 0 || id.length > 10) {
    return false;
  }
  return /^[a-zA-Z0-9]+$/.test(id);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Extract user email from auth token (simplified - implement proper JWT validation)
 */
export function getUserFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  // TODO: Implement proper JWT validation with Microsoft OAuth
  // For now, return null (auth not implemented yet)
  return null;
}

/**
 * Check if user is in AllowedUsers table
 */
export async function isUserAllowed(email: string): Promise<boolean> {
  try {
    const client = getTableClient('AllowedUsers');
    const entity = await client.getEntity('users', email);
    return !!entity;
  } catch {
    return false;
  }
}

/**
 * Get partition key for URL (first 2 chars of ID)
 */
export function getUrlPartitionKey(id: string): string {
  return id.length >= 2 ? id.substring(0, 2) : id;
}

/**
 * HTTP response helpers
 */
export const responses = {
  ok: (data: any) => ({
    status: 200,
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }),
  created: (data: any) => ({
    status: 201,
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }),
  noContent: () => ({
    status: 204,
  }),
  badRequest: (message: string) => ({
    status: 400,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  }),
  unauthorized: (message: string = 'Unauthorized') => ({
    status: 401,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  }),
  forbidden: (message: string = 'Forbidden') => ({
    status: 403,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  }),
  notFound: (message: string = 'Not found') => ({
    status: 404,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  }),
  conflict: (message: string) => ({
    status: 409,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  }),
  serverError: (message: string = 'Internal server error') => ({
    status: 500,
    body: JSON.stringify({ error: message }),
    headers: { 'Content-Type': 'application/json' },
  }),
};
