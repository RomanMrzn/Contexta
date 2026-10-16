"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export type Document = {
  id: string;
  title: string;
  key: string;
  url: string;
  createdAt: string;
  summary?: string | null;
};

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Calls our backend API GET /api/documents
      const data = await apiClient<Document[]>('/api/documents');
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    isLoading,
    error,
    refetch: fetchDocuments
  };
}
