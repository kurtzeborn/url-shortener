/**
 * Custom hook for API calls with authentication
 */

import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, parseApiResponse, getErrorMessage } from '../api';

// Development mode mock data
const DEV_MODE = import.meta.env.MODE === 'development' && !import.meta.env.VITE_API_URL;
const MOCK_URLS = [
  {
    id: 'abc123',
    shortUrl: 'https://k61.dev/abc123',
    url: 'https://www.example.com/very/long/url/that/we/want/to/shorten',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    clickCount: 42
  },
  {
    id: 'def456',
    shortUrl: 'https://k61.dev/def456',
    url: 'https://github.com/kurtzeborn/url-shortener',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    clickCount: 17
  },
  {
    id: 'xyz789',
    shortUrl: 'https://k61.dev/xyz789',
    url: 'https://docs.microsoft.com/en-us/azure/azure-functions/',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    clickCount: 8
  }
];

/**
 * Hook that provides authenticated API methods
 */
export function useApi() {
  const { getAccessToken } = useAuth();

  /**
   * Make an authenticated API request
   */
  const request = useCallback(async (endpoint, options = {}) => {
    // Development mode mock responses
    if (DEV_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      if (endpoint.includes('/api/urls')) {
        if (options.method === 'DELETE') {
          return { success: true };
        }
        if (options.method === 'PUT') {
          return { success: true };
        }
        if (options.method === 'POST') {
          const newUrl = {
            id: 'new' + Date.now(),
            shortUrl: 'https://k61.dev/new' + Date.now(),
            url: options.body.url,
            createdAt: new Date().toISOString(),
            clickCount: 0
          };
          return newUrl;
        }
        // GET request
        return {
          urls: MOCK_URLS,
          pagination: { totalPages: 1, currentPage: 1 }
        };
      }
      return {};
    }

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
