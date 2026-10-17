import fs from 'fs';
import path from 'path';

export interface Series {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  colorTheme?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const SERIES_FILE = path.join(DATA_DIR, 'series.json');

function ensureSeriesFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SERIES_FILE)) {
    fs.writeFileSync(SERIES_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

export function getSeries(userId?: string): Series[] {
  try {
    ensureSeriesFile();
    const data = fs.readFileSync(SERIES_FILE, 'utf8');
    const allSeries: Series[] = JSON.parse(data);

    if (!userId) {
      return allSeries;
    }

    // Auto-claim any unassigned legacy series for the current user
    let updated = false;
    allSeries.forEach((s) => {
      if (!s.userId) {
        s.userId = userId;
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(SERIES_FILE, JSON.stringify(allSeries, null, 2), 'utf8');
    }

    return allSeries.filter((s) => s.userId === userId);
  } catch (error) {
    console.error('Failed to read series store:', error);
    return [];
  }
}

export function getSeriesById(id: string, userId?: string): Series | null {
  ensureSeriesFile();
  const allSeries = getSeries(userId);
  return allSeries.find((s) => s.id === id) || null;
}

export function saveSeries(series: Series): Series {
  ensureSeriesFile();
  const data = fs.readFileSync(SERIES_FILE, 'utf8');
  const allSeries: Series[] = JSON.parse(data);
  const existingIndex = allSeries.findIndex((s) => s.id === series.id);

  if (existingIndex >= 0) {
    allSeries[existingIndex] = {
      ...series,
      userId: series.userId || allSeries[existingIndex].userId,
      updatedAt: new Date().toISOString(),
    };
  } else {
    allSeries.unshift(series);
  }

  fs.writeFileSync(SERIES_FILE, JSON.stringify(allSeries, null, 2), 'utf8');
  return series;
}

export function deleteSeriesById(id: string, userId?: string): boolean {
  ensureSeriesFile();
  const data = fs.readFileSync(SERIES_FILE, 'utf8');
  const allSeries: Series[] = JSON.parse(data);
  const target = allSeries.find((s) => s.id === id);

  if (!target) return false;

  if (userId && target.userId && target.userId !== userId) {
    return false;
  }

  const filtered = allSeries.filter((s) => s.id !== id);
  fs.writeFileSync(SERIES_FILE, JSON.stringify(filtered, null, 2), 'utf8');
  return true;
}

export function updateSeriesById(
  id: string,
  updates: Partial<Series>,
  userId?: string
): Series | null {
  ensureSeriesFile();
  const data = fs.readFileSync(SERIES_FILE, 'utf8');
  const allSeries: Series[] = JSON.parse(data);
  const index = allSeries.findIndex((s) => s.id === id);

  if (index === -1) return null;

  if (userId && allSeries[index].userId && allSeries[index].userId !== userId) {
    return null;
  }

  allSeries[index] = {
    ...allSeries[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(SERIES_FILE, JSON.stringify(allSeries, null, 2), 'utf8');
  return allSeries[index];
}
