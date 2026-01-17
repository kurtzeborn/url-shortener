/**
 * Centralized API configuration
 */

// API base URL - use environment variable in production, empty string for local dev with proxy
export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Parse API response, handling both success and error cases
 * @param {Response} response - Fetch response
 * @returns {Promise<{data: any, ok: boolean}>}
 */
export async function parseApiResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  return { data, ok: response.ok };
}

/**
 * Extract error message from API error response
 * @param {any} data - Parsed response data
 * @param {string} fallback - Fallback error message
 * @returns {string}
 */
export function getErrorMessage(data, fallback = 'An error occurred') {
  if (typeof data.error === 'string') {
    return data.error;
  }
  return data.error?.message || fallback;
}
