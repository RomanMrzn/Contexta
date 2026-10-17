import { auth } from '@clerk/nextjs/server';
import { getDocumentById, getDocuments, Document } from '@/lib/documents-store';
import { createDataStreamResponse, formatDataStreamPart } from 'ai';
import { streamDescriptiveAnswer } from '@/lib/llm-service';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const currentUserId = userId || 'demo-user';

    const body = await req.json();
    const { messages, documentId, docTitle: clientTitle, docContent: clientContent } = body;
    const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

    const backendUrl = process.env.BACKEND_URL;

    // If an external backend is configured and running, attempt to proxy
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUserId,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return new Response(response.body, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Vercel-AI-Data-Stream': 'v1',
            },
          });
        }
      } catch {
        // Backend not reachable, fall through to built-in document intelligence
      }
    }

    // Retrieve target document or collection
    let targetDoc: Document | null = null;
    let allDocs: Document[] = [];

    if (documentId) {
      targetDoc = getDocumentById(documentId);
    }

    // Fallback if client passed content directly
    if (!targetDoc && clientContent) {
      targetDoc = {
        id: documentId || 'current-doc',
        title: clientTitle || 'Uploaded Document',
        filename: `${(clientTitle || 'document').toLowerCase().replace(/\s+/g, '_')}.txt`,
        fileSize: Buffer.byteLength(clientContent, 'utf8'),
        fileType: 'text',
        content: clientContent,
        wordCount: clientContent.split(/\s+/).length,
        readingTimeMinutes: Math.max(1, Math.ceil(clientContent.split(/\s+/).length / 200)),
        createdAt: new Date().toISOString(),
      };
    }

    if (!targetDoc) {
      allDocs = getDocuments();
    }

    // Stream descriptive, narrative answer with optional LLM integration
    return createDataStreamResponse({
      execute: async (dataStream) => {
        await streamDescriptiveAnswer({
          dataStream,
          doc: targetDoc,
          allDocs,
          question: latestMessage,
          messages: messages || [],
        });
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.write(
          formatDataStreamPart(
            'text',
            'I encountered an error analyzing the document. Please try asking your question again.'
          )
        );
      },
    });
  }
}
