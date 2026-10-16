// A simple fetch wrapper to communicate with the Express backend
// The Next.js frontend runs on localhost:3000, backend on localhost:3001

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Note: For authenticated requests from the client side, we usually use Clerk's useAuth() to get a token.
  // In a real app, you would pass the token here or use middleware.
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || 'API Error');
  }

  // If response is empty (e.g., 204 No Content), return empty object
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
