import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSeriesById } from '@/lib/series-store';
import { assignDocumentToSeries } from '@/lib/documents-store';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { seriesId } = await params;
    const series = getSeriesById(seriesId, userId);
    if (!series) {
      return NextResponse.json({ error: 'Series not found or access denied' }, { status: 404 });
    }

    const body = await req.json();
    const { documentId, action, volumeNumber } = body;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    if (action === 'unassign') {
      const updated = assignDocumentToSeries(documentId, null, undefined, undefined, userId);
      return NextResponse.json({ success: true, document: updated });
    }

    // Default action: assign to this series
    const updated = assignDocumentToSeries(
      documentId,
      seriesId,
      series.title,
      volumeNumber !== undefined ? Number(volumeNumber) : undefined,
      userId
    );

    if (!updated) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error('Error modifying series document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
