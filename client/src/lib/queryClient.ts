import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export async function apiRequest(
  url: string,
  options?: {
    method?: Method;
    body?: any;
    headers?: Record<string, string>;
  },
): Promise<any> {
  try {
    const method = options?.method || 'GET';
    const fullUrl = getApiUrl(url);
    const res = await fetch(fullUrl, {
      method,
      headers: options?.body ? { "Content-Type": "application/json", ...(options.headers || {}) } : options?.headers || {},
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Return the JSON if the response has content, otherwise return the response
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return res;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    // Return empty data instead of throwing
    return [];
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const fullUrl = getApiUrl(queryKey[0] as string);
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query failed: ${queryKey[0]}`, error);
      // Return empty data instead of throwing
      return [];
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // Add fallback data
      initialData: [],
    },
    mutations: {
      retry: false,
    },
  },
});
