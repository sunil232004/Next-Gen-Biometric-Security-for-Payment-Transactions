// API Base URL Configuration
// In development, Vite proxy handles /api requests
// In production, use the VITE_API_URL environment variable

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Constructs the full API URL for a given endpoint
 * @param endpoint - The API endpoint (e.g., '/api/users' or 'api/users')
 * @returns The full URL with the base URL prepended
 */
export function getApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If API_BASE_URL is empty (development with proxy), just return the endpoint
  if (!API_BASE_URL) {
    return normalizedEndpoint;
  }
  
  // Remove trailing slash from base URL if present
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Helper to make API requests with the correct base URL
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}
