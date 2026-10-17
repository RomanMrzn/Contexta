"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

export interface Document {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  fileType: "pdf" | "markdown" | "text" | "csv" | "json";
  content: string;
  fileUrl?: string;
  summary?: string;
  keyPoints?: string[];
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  tags?: string[];
}

const STORAGE_KEY = "contexta_documents_cache";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check localStorage first for instant display
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            setDocuments(JSON.parse(cached));
          } catch {
            // ignore cache parse error
          }
        }
      }

      // Fetch latest from API
      const data = await apiClient<Document[]>("/api/documents");
      if (Array.isArray(data)) {
        setDocuments(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      }
    } catch (err: any) {
      console.warn("Falling back to local cache:", err);
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEY);
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
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadFile = async (file: File, customTitle?: string): Promise<Document> => {
    return new Promise((resolve, reject) => {
      const filename = file.name;
      const ext = filename.split(".").pop()?.toLowerCase() || "txt";

      let fileType: Document["fileType"] = "text";
      if (ext === "md" || ext === "markdown") fileType = "markdown";
      else if (ext === "pdf") fileType = "pdf";
      else if (ext === "csv") fileType = "csv";
      else if (ext === "json") fileType = "json";

      const title =
        customTitle ||
        filename
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .trim();

      const fileUrl = URL.createObjectURL(file);

      // Read text content
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          let text = (e.target?.result as string) || "";
          if (fileType === "pdf" && !text) {
            text = `[PDF Document: ${filename}]\nThis document was uploaded and is rendered via Contexta's embedded document viewer.\nFile size: ${(file.size / 1024).toFixed(1)} KB.`;
          }

          const words = text.trim().split(/\s+/).filter(Boolean).length;
          const readingTime = Math.max(1, Math.ceil(words / 200));

          const payload = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title,
            filename,
            fileSize: file.size,
            fileType,
            content: text,
            fileUrl,
            wordCount: words,
            readingTimeMinutes: readingTime,
            createdAt: new Date().toISOString(),
            tags: [fileType.toUpperCase()]
          };

          const saved = await apiClient<Document>("/api/documents", {
            method: "POST",
            body: JSON.stringify(payload)
          });

          setDocuments((prev) => {
            const next = [saved, ...prev.filter((d) => d.id !== saved.id)];
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }
            return next;
          });

          resolve(saved);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));

      if (fileType === "pdf") {
        // Read as arrayBuffer or data URL
        const dataReader = new FileReader();
        dataReader.onload = async (ev) => {
          try {
            const dataUrl = ev.target?.result as string;
            const payload = {
              id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              title,
              filename,
              fileSize: file.size,
              fileType: "pdf",
              content: `# ${title}\n\n[Interactive PDF Preview Active]\nFilename: ${filename}\nSize: ${(file.size / 1024).toFixed(1)} KB\nUploaded: ${new Date().toLocaleDateString()}\n\nUse the Native PDF Viewer tab above to read the document with full layout, fonts, and images.`,
              fileUrl: dataUrl,
              wordCount: Math.round(file.size / 10),
              readingTimeMinutes: Math.max(1, Math.ceil(file.size / 2000)),
              createdAt: new Date().toISOString(),
              tags: ["PDF", "DOCUMENT"]
            };

            const saved = await apiClient<Document>("/api/documents", {
              method: "POST",
              body: JSON.stringify(payload)
            });

            setDocuments((prev) => {
              const next = [saved, ...prev.filter((d) => d.id !== saved.id)];
              if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              }
              return next;
            });

            resolve(saved);
          } catch (err) {
            reject(err);
          }
        };
        dataReader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const addDocument = async (docData: Partial<Document> & { title: string; content: string }): Promise<Document> => {
    const saved = await apiClient<Document>("/api/documents", {
      method: "POST",
      body: JSON.stringify(docData)
    });

    setDocuments((prev) => {
      const next = [saved, ...prev.filter((d) => d.id !== saved.id)];
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const getDocument = (id: string): Document | undefined => {
    return documents.find((d) => d.id === id);
  };

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
