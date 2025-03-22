import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export interface ApiRequestOptions {
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  on401?: "returnNull" | "throw";
}

export async function apiRequest<T = any>(options: ApiRequestOptions): Promise<T> {
  const { url, method, body, headers = {}, withCredentials = true, on401 = "throw" } = options;
  
  const requestHeaders: Record<string, string> = { ...headers };
  
  // If no Content-Type is set and we have a body that's not FormData, default to JSON
  if (!requestHeaders["Content-Type"] && body && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: withCredentials ? "include" : "same-origin"
  };
  
  // Only add the body if it exists
  if (body) {
    // Don't stringify FormData objects
    fetchOptions.body = body instanceof FormData ? body : 
                        requestHeaders["Content-Type"] === "application/json" ? 
                        JSON.stringify(body) : body;
  }
  
  const res = await fetch(url, fetchOptions);
  
  // Handle unauthorized response based on parameter
  if (res.status === 401 && on401 === "returnNull") {
    return null as T;
  }
  
  await throwIfResNotOk(res);
  
  // Check if the response is empty
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await res.json();
  }
  
  return res as unknown as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
