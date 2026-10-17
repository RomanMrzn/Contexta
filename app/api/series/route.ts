import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSeries, saveSeries, Series } from '@/lib/series-store';
import { getDocuments } from '@/lib/documents-store';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seriesList = getSeries(userId);
    const userDocs = getDocuments(userId);

    // Enrich each series with document count, total words, and books preview
    const enrichedSeries = seriesList.map((series) => {
      const seriesDocs = userDocs.filter((d) => d.seriesId === series.id);
      const totalWords = seriesDocs.reduce((acc, d) => acc + (d.wordCount || 0), 0);
      const totalReadingTime = seriesDocs.reduce((acc, d) => acc + (d.readingTimeMinutes || 0), 0);

      return {
        ...series,
        documentCount: seriesDocs.length,
        totalWords,
        totalReadingTime,
        documents: seriesDocs.map((d) => ({
          id: d.id,
          title: d.title,
          fileType: d.fileType,
          volumeNumber: d.volumeNumber,
          wordCount: d.wordCount,
          createdAt: d.createdAt,
        })),
      };
    });

    return NextResponse.json(enrichedSeries);
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Series title is required' }, { status: 400 });
    }

    const newSeries: Series = {
      id: `series-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      category: body.category?.trim() || 'General',
      colorTheme: body.colorTheme || 'indigo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = saveSeries(newSeries);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json({ error: 'Failed to create series' }, { status: 500 });
  }
}
