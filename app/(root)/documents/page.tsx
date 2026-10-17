"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Trash2,
  Search,
  BookOpen,
  Download,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  X,
  Plus,
  LayoutGrid,
  List,
  ArrowRight,
  Presentation,
  Folder,
  Layers,
} from "lucide-react";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { useSeries } from "@/hooks/useSeries";
import { DeleteDocumentModal } from "@/components/DeleteDocumentModal";
import { AssignSeriesModal } from "@/components/library/AssignSeriesModal";

export default function DocumentsPage() {
  const { documents, isLoading, error, uploadFile, deleteDocument, addDocument, refetch: refetchDocs } = useDocuments();
  const { series, assignDocument, unassignDocument, refetch: refetchSeries } = useSeries();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "size" | "title">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete modal state
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [docToAssign, setDocToAssign] = useState<Document | null>(null);

  // Manual note modal
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Get file type badge styling
  const getTypeBadge = (type: Document["fileType"]) => {
    switch (type) {
      case "pdf":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          icon: FileText,
          label: "PDF"
        };
      case "docx":
      case "doc":
        return {
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
          icon: FileText,
          label: type.toUpperCase()
        };
      case "pptx":
      case "ppt":
        return {
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          icon: Presentation,
          label: type.toUpperCase()
        };
      case "epub":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          icon: BookOpen,
          label: "EPUB"
        };
      case "markdown":
        return {
          bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          icon: FileCode,
          label: "MD"
        };
      case "csv":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: FileSpreadsheet,
          label: "CSV"
        };
      case "json":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: FileCode,
          label: "JSON"
        };
      default:
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          icon: FileText,
          label: "TXT"
        };
    }
  };

  // Handle file uploads
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const fileList = Array.from(files);
      let count = 0;

      for (const file of fileList) {
        setUploadProgress(Math.round(((count + 0.5) / fileList.length) * 100));
        await uploadFile(file);
        count++;
        setUploadProgress(Math.round((count / fileList.length) * 100));
      }

      setUploadSuccess(`Successfully uploaded ${count} document${count > 1 ? "s" : ""}!`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Drag & Drop
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Save manual text note
  const handleSaveTextNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    try {
      setIsUploading(true);
      const words = noteContent.trim().split(/\s+/).filter(Boolean).length;
      await addDocument({
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: noteTitle.trim(),
        filename: `${noteTitle.toLowerCase().replace(/\s+/g, "_")}.md`,
        content: noteContent,
        fileType: "markdown",
        fileSize: Buffer.byteLength(noteContent, "utf8"),
        wordCount: words,
        readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
        createdAt: new Date().toISOString(),
        tags: ["NOTE", "MARKDOWN"]
      });

      setNoteTitle("");
      setNoteContent("");
      setIsTextModalOpen(false);
      setUploadSuccess("Custom document added to your library!");
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to create document");
    } finally {
      setIsUploading(false);
    }
  };

  // Download document content as file
  const handleDownload = (doc: Document, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (doc.fileUrl && doc.fileType === "pdf") {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.filename;
      link.click();
      return;
    }

    const blob = new Blob([doc.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const title = docToDelete.title;
    try {
      await deleteDocument(docToDelete.id);
      setUploadSuccess(`"${title}" was deleted.`);
      setTimeout(() => setUploadSuccess(null), 3500);
    } catch (err: any) {
      setUploadError(err.message || "Failed to delete document");
    } finally {
      setDocToDelete(null);
    }
  };

  // Filter & sort
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesSearch =
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType =
          selectedType === "all" ||
          (selectedType === "pdf" && doc.fileType === "pdf") ||
          (selectedType === "word" && (doc.fileType === "docx" || doc.fileType === "doc")) ||
          (selectedType === "slides" && (doc.fileType === "pptx" || doc.fileType === "ppt")) ||
          (selectedType === "epub" && doc.fileType === "epub") ||
          (selectedType === "markdown" && (doc.fileType === "markdown" || doc.fileType === "text")) ||
          (selectedType === "data" && (doc.fileType === "csv" || doc.fileType === "json"));

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "size") return b.fileSize - a.fileSize;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [documents, searchQuery, selectedType, sortBy]);

  // Aggregate stats
  const totalWords = useMemo(
    () => documents.reduce((acc, curr) => acc + (curr.wordCount || 0), 0),
    [documents]
  );
  const totalStorage = useMemo(
    () => documents.reduce((acc, curr) => acc + (curr.fileSize || 0), 0),
    [documents]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Document Library</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {documents.length} {documents.length === 1 ? "file" : "files"}
            </span>
          </div>
          <p className="text-neutral-400 mt-1 text-sm">
            Upload, read, and manage your documents with intelligent contextual AI summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTextModalOpen(true)}
            className="px-4 py-2.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-sm font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            Paste Text Note
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.epub,.txt,.md,.markdown,.csv,.json"
        className="hidden"
      />

      {/* Upload Notification Alerts */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Interactive Drag & Drop Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative overflow-hidden cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition-all duration-300 ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10 scale-[1.01]"
            : "border-neutral-800 bg-neutral-950/70 hover:border-neutral-700 hover:bg-neutral-900/40"
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            {isUploading ? (
              <div className="w-7 h-7 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {isUploading ? "Processing Document..." : "Drop your files here, or browse"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5">
              Supports <span className="text-neutral-300 font-medium">PDF, Word (.docx, .doc), PowerPoint (.pptx), EPUB eBooks, Markdown, TXT, CSV, JSON</span> up to 32MB
            </p>
          </div>

          {isUploading && uploadProgress !== null && (
            <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Documents are automatically indexed and ready for reading & AI analysis
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Total Documents</p>
            <p className="text-xl font-bold text-white mt-1">{documents.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Total Words Indexed</p>
            <p className="text-xl font-bold text-white mt-1">{totalWords.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Storage Used</p>
            <p className="text-xl font-bold text-white mt-1">{formatBytes(totalStorage)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Avg. Reading Time</p>
            <p className="text-xl font-bold text-white mt-1">
              {documents.length > 0
                ? `${Math.round(
                    documents.reduce((acc, curr) => acc + curr.readingTimeMinutes, 0) / documents.length
                  )} min`
                : "0 min"}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, keyword, or summary..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills, Sort & View Modes */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          {/* Format Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "pdf", label: "PDF" },
              { id: "word", label: "Word" },
              { id: "slides", label: "Slides" },
              { id: "epub", label: "eBooks" },
              { id: "markdown", label: "Text & MD" },
              { id: "data", label: "Data" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedType === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="size">Largest Size</option>
            <option value="title">Title (A-Z)</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-neutral-800 text-white" : "hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-neutral-800 text-white" : "hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid / Table / Empty States */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-400">Loading your document library...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-16 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white">
              {searchQuery ? "No matching documents found" : "Your document library is empty"}
            </h3>
            <p className="text-neutral-400 text-sm mt-1">
              {searchQuery
                ? `No documents matched "${searchQuery}". Try adjusting your search query or filters.`
                : "Upload a PDF, Markdown, or text file to start reading and chatting with your knowledge base."}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => {
            const badge = getTypeBadge(doc.fileType);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={doc.id}
                className="group relative rounded-2xl bg-neutral-950 border border-neutral-800/90 hover:border-indigo-500/40 p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-4">
                  {/* Top Bar with Badge & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                      {doc.seriesTitle && (
                        <Link
                          href={`/library?seriesId=${doc.seriesId}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/20 transition-colors"
                          title={`Series: ${doc.seriesTitle}`}
                        >
                          <Folder className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[100px]">{doc.seriesTitle}</span>
                          {doc.volumeNumber !== undefined && <span>• Vol. {doc.volumeNumber}</span>}
                        </Link>
                      )}
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {formatBytes(doc.fileSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDocToAssign(doc);
                        }}
                        title="Organize into Series / Folder"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDownload(doc, e)}
                        title="Download file"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDocToDelete(doc);
                        }}
                        title="Delete document"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Preview */}
                  <div>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="text-base font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1 block"
                      title={doc.title}
                    >
                      {doc.title}
                    </Link>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-3 leading-relaxed">
                      {doc.summary || doc.content.slice(0, 160)}
                    </p>
                  </div>

                  {/* Reading Metadata */}
                  <div className="flex items-center gap-3 text-xs text-neutral-500 pt-2 border-t border-neutral-900">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {doc.readingTimeMinutes} min read
                    </span>
                    <span>•</span>
                    <span>{doc.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                </div>

                {/* Primary Read Button */}
                <div className="mt-5 pt-3">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-indigo-600 text-neutral-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 group-hover:border group-hover:border-indigo-500/30"
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Document
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-400 text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Document Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Size</th>
                <th className="px-6 py-4 font-medium">Reading Time</th>
                <th className="px-6 py-4 font-medium">Uploaded</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70">
              {filteredDocuments.map((doc) => {
                const badge = getTypeBadge(doc.fileType);
                const BadgeIcon = badge.icon;

                return (
                  <tr key={doc.id} className="hover:bg-neutral-900/40 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-semibold text-white hover:text-indigo-400 transition-colors block max-w-sm truncate"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-xs text-neutral-500 truncate block mt-0.5">
                        {doc.filename}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-neutral-400">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {doc.readingTimeMinutes} min read ({doc.wordCount.toLocaleString()} w)
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Read
                        </Link>
                        <button
                          onClick={() => setDocToAssign(doc)}
                          title="Organize into Series"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(doc, e)}
                          title="Download"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDocToDelete(doc)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Text Note Modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Create Custom Document / Note</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Type or paste raw notes, markdown, or text to add to your library.
                </p>
              </div>
              <button
                onClick={() => setIsTextModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTextNote} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g., Q4 Product Strategy & Requirements"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Content (Markdown supported)
                </label>
                <textarea
                  required
                  rows={10}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write or paste your document content here..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsTextModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteTitle.trim() || !noteContent.trim() || isUploading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  Save to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      <DeleteDocumentModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDelete}
        documentTitle={docToDelete?.title || ""}
      />

      {/* Assign Document to Series Modal */}
      <AssignSeriesModal
        isOpen={Boolean(docToAssign)}
        onClose={() => setDocToAssign(null)}
        document={docToAssign}
        seriesList={series}
        onAssign={async (seriesId, volumeNumber) => {
          if (!docToAssign) return;
          if (seriesId) {
            await assignDocument(seriesId, docToAssign.id, volumeNumber);
          } else if (docToAssign.seriesId) {
            await unassignDocument(docToAssign.seriesId, docToAssign.id);
          }
          await Promise.all([refetchDocs(), refetchSeries()]);
        }}
      />
    </div>
  );
}
