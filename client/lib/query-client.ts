import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Debug log (visible in browser console)
  if (typeof window !== "undefined") {
    // console.log("Determining API URL...");
  }

  // Priority 1: Check standard Expo env var for API URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priority 2: Check standard Vite env var (if used in web context)
  // @ts-ignore - process.env might not be typed for VITE_
  if (process.env.VITE_API_URL) {
    // @ts-ignore
    return process.env.VITE_API_URL;
  }

  // Priority 3: Check window location (Most reliable for web deployments)
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (origin.includes("localhost:8081")) {
      return "http://localhost:5000";
    }
    // If we are on a production domain (e.g. onrender.com), use it as the API base
    return origin;
  }

  const host = process.env.EXPO_PUBLIC_DOMAIN;
  if (host && host.trim()) {
    if (host.startsWith("http://") || host.startsWith("https://")) {
      return host;
    }
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return `http://${host}`;
    }
    const url = new URL(`https://${host}`);
    return url.href;
  }
  
  return "http://localhost:5000";
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error: any) {
    console.error(`API Request failed: ${method} ${url}`, error);
    // Enhance error message with URL for debugging
    throw new Error(`${error.message} (URL: ${url.toString()})`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      console.error(`Query failed: ${url}`, error);
      throw new Error(`${error.message} (URL: ${url.toString()})`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
