import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSeriesById, updateSeriesById, deleteSeriesById } from '@/lib/series-store';
import { getDocumentsBySeriesId, unassignDocumentsFromSeries } from '@/lib/documents-store';

export async function GET(
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

    const documents = getDocumentsBySeriesId(seriesId, userId);
    // Sort by volumeNumber if present, else by createdAt asc
    documents.sort((a, b) => {
      if (a.volumeNumber !== undefined && b.volumeNumber !== undefined) {
        return a.volumeNumber - b.volumeNumber;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({
      ...series,
      documents,
      documentCount: documents.length,
      totalWords: documents.reduce((acc, d) => acc + (d.wordCount || 0), 0),
      totalReadingTime: documents.reduce((acc, d) => acc + (d.readingTimeMinutes || 0), 0),
    });
  } catch (error) {
    console.error('Error fetching series details:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { seriesId } = await params;
    const body = await req.json();

    const updated = updateSeriesById(seriesId, body, userId);
    if (!updated) {
      return NextResponse.json({ error: 'Series not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating series:', error);
    return NextResponse.json({ error: 'Failed to update series' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { seriesId } = await params;

    // Unassign documents first so books/documents are preserved
    unassignDocumentsFromSeries(seriesId, userId);

    const deleted = deleteSeriesById(seriesId, userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Series not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }
}
