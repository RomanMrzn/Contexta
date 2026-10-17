"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

export interface SeriesDocumentSummary {
  id: string;
  title: string;
  fileType: string;
  volumeNumber?: number;
  wordCount: number;
  createdAt: string;
}

export interface Series {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  colorTheme?: string;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
  totalWords?: number;
  totalReadingTime?: number;
  documents?: SeriesDocumentSummary[];
}

export function useSeries() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    return userId ? `contexta_series_cache_${userId}` : "contexta_series_cache";
  }, [userId]);

  const fetchSeries = useCallback(async () => {
    if (!isAuthLoaded) return;

    if (!userId) {
      setSeries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check user-scoped local cache
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          try {
            setSeries(JSON.parse(cached));
          } catch {
            // ignore cache parse error
          }
        }
      }

      const data = await apiClient<Series[]>("/api/series");
      if (Array.isArray(data)) {
        setSeries(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      }
    } catch (err: any) {
      console.warn("Falling back to series local cache:", err);
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          try {
            setSeries(JSON.parse(cached));
          } catch {
            setError(err.message || "Failed to fetch series");
          }
        } else {
          setError(err.message || "Failed to fetch series");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthLoaded, storageKey]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const createSeries = async (payload: {
    title: string;
    description?: string;
    category?: string;
    colorTheme?: string;
  }): Promise<Series> => {
    try {
      const created = await apiClient<Series>("/api/series", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const enriched: Series = {
        ...created,
        documentCount: 0,
        totalWords: 0,
        totalReadingTime: 0,
        documents: [],
      };

      setSeries((prev) => {
        const next = [enriched, ...prev.filter((s) => s.id !== enriched.id)];
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });

      return enriched;
    } catch (err: any) {
      console.error("Create series error:", err);
      throw err;
    }
  };

  const updateSeries = async (id: string, updates: Partial<Series>): Promise<Series> => {
    try {
      const updated = await apiClient<Series>(`/api/series/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      setSeries((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updated } : s));
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });

      return updated;
    } catch (err: any) {
      console.error("Update series error:", err);
      throw err;
    }
  };

  const deleteSeries = async (id: string): Promise<boolean> => {
    try {
      await apiClient(`/api/series/${id}`, { method: "DELETE" });
      setSeries((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });
      return true;
    } catch (err: any) {
      console.error("Delete series error:", err);
      throw err;
    }
  };

  const assignDocument = async (
    seriesId: string,
    documentId: string,
    volumeNumber?: number
  ): Promise<boolean> => {
    try {
      await apiClient(`/api/series/${seriesId}/documents`, {
        method: "POST",
        body: JSON.stringify({ documentId, volumeNumber }),
      });
      await fetchSeries();
      return true;
    } catch (err: any) {
      console.error("Assign document to series error:", err);
      throw err;
    }
  };

  const unassignDocument = async (seriesId: string, documentId: string): Promise<boolean> => {
    try {
      await apiClient(`/api/series/${seriesId}/documents`, {
        method: "POST",
        body: JSON.stringify({ documentId, action: "unassign" }),
      });
      await fetchSeries();
      return true;
    } catch (err: any) {
      console.error("Unassign document from series error:", err);
      throw err;
    }
  };

  return {
    series,
    isLoading,
    error,
    refetch: fetchSeries,
    createSeries,
    updateSeries,
    deleteSeries,
    assignDocument,
    unassignDocument,
  };
}
