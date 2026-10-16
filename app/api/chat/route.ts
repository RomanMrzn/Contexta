import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  // Proxy the request to the Express backend (e.g., http://localhost:3001/api/chat)
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // We proxy to our backend, passing the userId via headers for Auth middleware
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return new Response(await response.text(), {
        status: response.status,
      });
    }

    // Return the readable stream exactly as it comes from the backend
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
