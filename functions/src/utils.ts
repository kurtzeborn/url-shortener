/**
 * Shared utilities for Azure Functions
 */

import { TableClient, TableServiceClient } from '@azure/data-tables';

// Cache for initialized table clients
const tableClients: Map<string, TableClient> = new Map();
const tablesInitialized: Set<string> = new Set();

// Get Table Storage clients (creates table if not exists)
export function getTableClient(tableName: string): TableClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING not configured');
  }
  
  if (!tableClients.has(tableName)) {
    const client = TableClient.fromConnectionString(connectionString, tableName);
    tableClients.set(tableName, client);
  }
  
  return tableClients.get(tableName)!;
}

/**
 * Ensure a table exists (call this before first use)
 */
export async function ensureTableExists(tableName: string): Promise<void> {
  if (tablesInitialized.has(tableName)) {
    return;
  }
  
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING not configured');
  }
  
  const serviceClient = TableServiceClient.fromConnectionString(connectionString);
  try {
    await serviceClient.createTable(tableName);
  } catch (error: any) {
    // Ignore "TableAlreadyExists" error
    if (error?.statusCode !== 409) {
      throw error;
    }
  }
  
  tablesInitialized.add(tableName);
}

// Base62 character set for ID generation
const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Profanity filter for ID generation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const leoProfanity = require('leo-profanity');

/**
 * Check if an ID contains inappropriate content
 */
function isInappropriateId(id: string): boolean {
  return leoProfanity.check(id);
}

/**
 * Generate a random base62 ID (filters inappropriate content)
 */
export function generateId(length: number = 4): string {
  let id = '';
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    id = '';
    for (let i = 0; i < length; i++) {
      id += BASE62_CHARS[Math.floor(Math.random() * BASE62_CHARS.length)];
    }
    attempts++;
  } while (isInappropriateId(id) && attempts < maxAttempts);
  
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
  badRequest: (message: string, code: string = 'BAD_REQUEST') => ({
    status: 400,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
  unauthorized: (message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') => ({
    status: 401,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
  forbidden: (message: string = 'Forbidden', code: string = 'FORBIDDEN') => ({
    status: 403,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
  notFound: (message: string = 'Not found', code: string = 'NOT_FOUND') => ({
    status: 404,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
  conflict: (message: string, code: string = 'CONFLICT') => ({
    status: 409,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
  tooManyRequests: (message: string, code: string = 'RATE_LIMITED') => ({
    status: 429,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
  serverError: (message: string = 'Internal server error', code: string = 'INTERNAL_ERROR') => ({
    status: 500,
    body: JSON.stringify({ error: { code, message } }),
    headers: { 'Content-Type': 'application/json' },
  }),
};

/**
 * Get the short URL domain from environment or default
 */
export function getShortUrlDomain(): string {
  return process.env.SHORT_URL_DOMAIN || 'k61.dev';
}

/**
 * Build a short URL from an ID
 */
export function buildShortUrl(id: string): string {
  return `https://${getShortUrlDomain()}/${id}`;
}

/**
 * Maximum allowed URL length (2048 is common browser limit)
 */
export const MAX_URL_LENGTH = 2048;
