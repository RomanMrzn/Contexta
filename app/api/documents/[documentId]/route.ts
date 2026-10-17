import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDocumentById, deleteDocumentById, updateDocumentById } from '@/lib/documents-store';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const doc = getDocumentById(documentId, userId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const deleted = deleteDocumentById(documentId, userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await params;
    const body = await req.json();
    const updated = updateDocumentById(documentId, body, userId);
    if (!updated) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}
