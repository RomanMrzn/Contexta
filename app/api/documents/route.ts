import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDocuments, saveDocument, Document } from '@/lib/documents-store';
import { parseDocumentFile } from '@/lib/document-parser';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const docs = getDocuments(userId);
    return NextResponse.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    // If client sends JSON payload
    if (contentType.includes('application/json')) {
      const body = await req.json();
      if (!body.title || !body.content) {
        return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
      }

      const id = body.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const words = body.content.trim().split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.ceil(words / 200));

      const newDoc: Document = {
        id,
        userId,
        title: body.title,
        filename: body.filename || `${body.title.toLowerCase().replace(/\s+/g, '_')}.txt`,
        fileSize: body.fileSize || Buffer.byteLength(body.content, 'utf8'),
        fileType: body.fileType || 'text',
        content: body.content,
        fileUrl: body.fileUrl || undefined,
        summary: body.summary || generateAutoSummary(body.content),
        keyPoints: body.keyPoints || extractAutoKeyPoints(body.content),
        wordCount: words,
        readingTimeMinutes: readingTime,
        createdAt: body.createdAt || new Date().toISOString(),
        tags: body.tags || [body.fileType ? body.fileType.toUpperCase() : 'DOCUMENT']
      };

      const saved = saveDocument(newDoc);
      return NextResponse.json(saved, { status: 201 });
    }

    // If client sends FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const customTitle = formData.get('title') as string | null;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const parsed = await parseDocumentFile({
        name: file.name,
        arrayBuffer: () => file.arrayBuffer(),
      });

      const newDoc: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: customTitle || parsed.title,
        filename: file.name,
        fileSize: file.size,
        fileType: parsed.fileType,
        content: parsed.content,
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        wordCount: parsed.wordCount,
        readingTimeMinutes: parsed.readingTimeMinutes,
        createdAt: new Date().toISOString(),
        tags: [parsed.fileType.toUpperCase()]
      };

      const saved = saveDocument(newDoc);
      return NextResponse.json(saved, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
  } catch (error) {
    console.error('Error processing document upload:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateAutoSummary(text: string): string {
  const clean = text.replace(/[#*`_]/g, '').trim();
  const sentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.length > 20);
  if (sentences.length === 0) return 'Document uploaded and indexed successfully.';
  return sentences.slice(0, 3).join(' ');
}

function extractAutoKeyPoints(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim());
  const bulletLines = lines.filter((l) => /^[•\-\*\d\.]\s+/.test(l));
  if (bulletLines.length >= 3) {
    return bulletLines.slice(0, 5).map((l) => l.replace(/^[•\-\*\d\.]\s+/, ''));
  }
  const clean = text.replace(/[#*`_]/g, '').trim();
  const sentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.length > 30);
  return sentences.slice(0, 4);
}
