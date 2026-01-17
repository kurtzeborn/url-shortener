/**
 * Custom hook for API calls with authentication
 */

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, parseApiResponse, getErrorMessage } from '../api';

/**
 * Hook that provides authenticated API methods
 */
export function useApi() {
  const { getAccessToken } = useAuth();

  /**
   * Make an authenticated API request
   */
  const request = useCallback(async (endpoint, options = {}) => {
    const token = await getAccessToken();
    const { method = 'GET', body, ...rest } = options;

    const headers = {
      Authorization: `Bearer ${token}`,
      ...rest.headers,
    };

    if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    const { data, ok } = await parseApiResponse(response);

    if (!ok) {
      throw new Error(getErrorMessage(data, 'Request failed'));
    }

    return data;
  }, [getAccessToken]);

  /**
   * GET request
   */
  const get = useCallback((endpoint) => request(endpoint), [request]);

  /**
   * POST request
   */
  const post = useCallback((endpoint, body) => request(endpoint, { method: 'POST', body }), [request]);

  /**
   * PUT request
   */
  const put = useCallback((endpoint, body) => request(endpoint, { method: 'PUT', body }), [request]);

  /**
   * DELETE request
   */
  const del = useCallback((endpoint) => request(endpoint, { method: 'DELETE' }), [request]);

  return { get, post, put, del, request };
}
