"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { parseDocumentFile, SupportedFileType } from "@/lib/document-parser";

export type DocumentType = SupportedFileType;

export interface Document {
  id: string;
  userId?: string;
  title: string;
  filename: string;
  fileSize: number;
  fileType: DocumentType;
  content: string;
  fileUrl?: string;
  summary?: string;
  keyPoints?: string[];
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  tags?: string[];
}

export function useDocuments() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    return userId ? `contexta_documents_cache_${userId}` : "contexta_documents_cache";
  }, [userId]);

  const fetchDocuments = useCallback(async () => {
    if (!isAuthLoaded) return;

    if (!userId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check user-scoped localStorage first for instant display
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          try {
            setDocuments(JSON.parse(cached));
          } catch {
            // ignore cache parse error
          }
        }
      }

      // Fetch latest from API scoped to this user
      const data = await apiClient<Document[]>("/api/documents");
      if (Array.isArray(data)) {
        setDocuments(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
      }
    } catch (err: any) {
      console.warn("Falling back to local cache:", err);
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          try {
            setDocuments(JSON.parse(cached));
          } catch {
            setError(err.message || "Failed to fetch documents");
          }
        } else {
          setError(err.message || "Failed to fetch documents");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthLoaded, storageKey]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFile = async (file: File, customTitle?: string): Promise<Document> => {
    try {
      const parsed = await parseDocumentFile(file);

      let fileUrl: string | undefined = undefined;
      if (parsed.fileType === "pdf") {
        fileUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(file);
        });
      }

      const payload: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: userId || undefined,
        title: customTitle || parsed.title,
        filename: file.name,
        fileSize: file.size,
        fileType: parsed.fileType,
        content: parsed.content,
        fileUrl: fileUrl || undefined,
        summary: parsed.summary,
        keyPoints: parsed.keyPoints,
        wordCount: parsed.wordCount,
        readingTimeMinutes: parsed.readingTimeMinutes,
        createdAt: new Date().toISOString(),
        tags: [parsed.fileType.toUpperCase()]
      };

      const saved = await apiClient<Document>("/api/documents", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setDocuments((prev) => {
        const next = [saved, ...prev.filter((d) => d.id !== saved.id)];
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });

      return saved;
    } catch (err: any) {
      console.error("Upload error in hook:", err);
      throw err;
    }
  };

  const addDocument = async (docData: Partial<Document> & { title: string; content: string }): Promise<Document> => {
    const saved = await apiClient<Document>("/api/documents", {
      method: "POST",
      body: JSON.stringify({ ...docData, userId })
    });

    setDocuments((prev) => {
      const next = [saved, ...prev.filter((d) => d.id !== saved.id)];
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });

    return saved;
  };

  const deleteDocument = async (id: string) => {
    try {
      await apiClient(`/api/documents/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Delete API call failed, removing locally:", err);
    }
    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const getDocument = useCallback(
    (id: string): Document | undefined => {
      return documents.find((d) => d.id === id);
    },
    [documents]
  );

  return {
    documents,
    isLoading,
    error,
    refetch: fetchDocuments,
    uploadFile,
    addDocument,
    deleteDocument,
    getDocument
  };
}
