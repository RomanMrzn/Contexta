"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Library,
  FolderPlus,
  Layers,
  BookOpen,
  Search,
  X,
  Plus,
  Clock,
  FileText,
  Upload,
  MessageSquare,
  Edit3,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BookMarked,
  Folder,
  ArrowUpRight,
  FolderOpen
} from "lucide-react";
import { useSeries, Series } from "@/hooks/useSeries";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { CreateSeriesModal, COLOR_THEMES } from "@/components/library/CreateSeriesModal";
import { AssignSeriesModal } from "@/components/library/AssignSeriesModal";
import { DeleteSeriesModal } from "@/components/library/DeleteSeriesModal";

const CATEGORY_TABS = [
  "All",
  "Light Novel / Fiction",
  "Research Papers",
  "Textbooks & Study",
  "Technical Docs",
  "Work & Business",
  "Personal Archive",
];

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const initialSeriesId = searchParams.get("seriesId");

  const {
    series,
    isLoading: isSeriesLoading,
    createSeries,
    updateSeries,
    deleteSeries,
    assignDocument,
    unassignDocument,
    refetch: refetchSeries,
  } = useSeries();

  const {
    documents,
    isLoading: isDocsLoading,
    uploadFile,
    refetch: refetchDocs,
  } = useDocuments();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Active Series view (drilldown)
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [seriesToEdit, setSeriesToEdit] = useState<Series | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<Series | null>(null);
  const [docToAssign, setDocToAssign] = useState<Document | null>(null);

  // Direct upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadTargetSeriesId, setUploadTargetSeriesId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial query param
  useEffect(() => {
    if (initialSeriesId) {
      setActiveSeriesId(initialSeriesId);
    }
  }, [initialSeriesId]);

  // Find active series object
  const activeSeries = useMemo(() => {
    if (!activeSeriesId) return null;
    return series.find((s) => s.id === activeSeriesId) || null;
  }, [series, activeSeriesId]);

  // Filtered series
  const filteredSeries = useMemo(() => {
    return series.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === "All" ||
        s.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [series, searchQuery, selectedCategory]);

  // Unassigned documents (documents not in any series)
  const unassignedDocs = useMemo(() => {
    return documents.filter((doc) => !doc.seriesId);
  }, [documents]);

  // Documents belonging to the active series
  const activeSeriesDocs = useMemo(() => {
    if (!activeSeriesId) return [];
    return documents
      .filter((doc) => doc.seriesId === activeSeriesId)
      .sort((a, b) => {
        if (a.volumeNumber !== undefined && b.volumeNumber !== undefined) {
          return a.volumeNumber - b.volumeNumber;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [documents, activeSeriesId]);

  // Total stats
  const totalBooksInSeries = useMemo(() => {
    return documents.filter((d) => Boolean(d.seriesId)).length;
  }, [documents]);

  const totalWordsInSeries = useMemo(() => {
    return documents
      .filter((d) => Boolean(d.seriesId))
      .reduce((acc, d) => acc + (d.wordCount || 0), 0);
  }, [documents]);

  // Handle direct file upload
  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const targetSeries = uploadTargetSeriesId
        ? series.find((s) => s.id === uploadTargetSeriesId)
        : activeSeries;

      const fileList = Array.from(files);
      let count = 0;

      for (const file of fileList) {
        await uploadFile(file, undefined, targetSeries ? {
          seriesId: targetSeries.id,
          seriesTitle: targetSeries.title,
        } : undefined);
        count++;
      }

      await Promise.all([refetchSeries(), refetchDocs()]);
      setUploadSuccess(`Uploaded ${count} document${count > 1 ? "s" : ""}${targetSeries ? ` to "${targetSeries.title}"` : ""}!`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadTargetSeriesId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getThemeMeta = (themeId?: string) => {
    const found = COLOR_THEMES.find((t) => t.id === themeId);
    return found || COLOR_THEMES[0];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Library className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Library & Series
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {series.length} {series.length === 1 ? "Collection" : "Collections"}
                </span>
              </h1>
              <p className="text-neutral-400 text-sm mt-0.5">
                Organize light novels, books, and documents into Folders & Series with multiple volumes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setUploadTargetSeriesId(null);
              fileInputRef.current?.click();
            }}
            className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-sm font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4 text-neutral-400" />
            Upload Book
          </button>

          <button
            onClick={() => {
              setSeriesToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            New Series / Folder
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

      {/* Notifications */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-in fade-in duration-200">
          <Sparkles className="w-5 h-5 flex-shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-in fade-in duration-200">
          <X className="w-5 h-5 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Total Series / Folders</p>
            <p className="text-xl font-bold text-white mt-1">{series.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Books in Series</p>
            <p className="text-xl font-bold text-white mt-1">{totalBooksInSeries}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400">
            <BookMarked className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Unassigned Books</p>
            <p className="text-xl font-bold text-white mt-1">{unassignedDocs.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <FolderOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">Words in Collections</p>
            <p className="text-xl font-bold text-white mt-1">{totalWordsInSeries.toLocaleString()}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Series Drilldown View (If selected) */}
      {activeSeries && (
        <div className="rounded-2xl bg-neutral-950 border border-indigo-500/30 p-6 space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Drilldown Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSeriesId(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  ← Back to All Series
                </button>
                <span className="text-neutral-600">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-neutral-300 border border-neutral-800">
                  {activeSeries.category || "General"}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Folder className="w-6 h-6 text-indigo-400" />
                {activeSeries.title}
              </h2>

              {activeSeries.description && (
                <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                  {activeSeries.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
                <span>{activeSeriesDocs.length} Volumes / Books</span>
                <span>•</span>
                <span>
                  {activeSeriesDocs.reduce((acc, d) => acc + (d.wordCount || 0), 0).toLocaleString()} total words
                </span>
                <span>•</span>
                <span>
                  ~{activeSeriesDocs.reduce((acc, d) => acc + (d.readingTimeMinutes || 0), 0)} min total reading time
                </span>
              </div>
            </div>

            {/* Drilldown Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={`/chat?seriesId=${activeSeries.id}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Series
              </Link>

              <button
                onClick={() => {
                  setUploadTargetSeriesId(activeSeries.id);
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                Add Book to Series
              </button>

              <button
                onClick={() => {
                  setSeriesToEdit(activeSeries);
                  setIsCreateModalOpen(true);
                }}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 hover:text-white transition-all"
                title="Edit Series"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSeriesToDelete(activeSeries)}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-rose-500/10 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-all"
                title="Delete Series"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Volumes List inside this series */}
          <div className="pt-2 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Volumes & Documents ({activeSeriesDocs.length})
            </h3>

            {activeSeriesDocs.length === 0 ? (
              <div className="p-8 rounded-xl bg-neutral-900/40 border border-dashed border-neutral-800 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-sm text-neutral-400 font-medium">
                  No books or documents in this series yet.
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Upload a new book directly or choose from your unassigned documents below.
                </p>
                <button
                  onClick={() => {
                    setUploadTargetSeriesId(activeSeries.id);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Volume 1
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSeriesDocs.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-indigo-500/40 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {doc.volumeNumber !== undefined ? `Vol. ${doc.volumeNumber}` : `#${idx + 1}`}
                      </div>
                      <div className="truncate">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors truncate block"
                          title={doc.title}
                        >
                          {doc.title}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span className="uppercase text-neutral-500 font-mono font-medium">{doc.fileType}</span>
                          <span>•</span>
                          <span>{doc.wordCount.toLocaleString()} words</span>
                          <span>•</span>
                          <span>{doc.readingTimeMinutes} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-all"
                      >
                        Read
                      </Link>
                      <button
                        onClick={async () => {
                          await unassignDocument(activeSeries.id, doc.id);
                          await Promise.all([refetchSeries(), refetchDocs()]);
                        }}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 text-xs transition-colors"
                        title="Remove from series"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search series by title or category..."
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Series Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Series & Folders ({filteredSeries.length})
          </h2>
        </div>

        {isSeriesLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-neutral-400">Loading your series library...</p>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="p-12 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <FolderPlus className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-semibold text-white">
                {searchQuery ? "No matching series found" : "No series or folders yet"}
              </h3>
              <p className="text-neutral-400 text-xs mt-1">
                {searchQuery
                  ? `No series matched "${searchQuery}". Try adjusting your search query.`
                  : "Create your first series to organize multiple book volumes, chapters, or research papers together."}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => {
                  setSeriesToEdit(null);
                  setIsCreateModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all"
              >
                <FolderPlus className="w-4 h-4" />
                Create New Series
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSeries.map((s) => {
              const theme = getThemeMeta(s.colorTheme);
              const isActive = activeSeriesId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSeriesId(isActive ? null : s.id)}
                  className={`group relative rounded-2xl bg-neutral-950 border transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between ${
                    isActive
                      ? "border-indigo-500 ring-1 ring-indigo-500 shadow-xl shadow-indigo-500/10 -translate-y-1"
                      : "border-neutral-800/90 hover:border-neutral-700 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Category badge & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {s.category || "General"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 bg-neutral-900/60 px-2 py-0.5 rounded border border-neutral-800">
                          <BookOpen className="w-3 h-3 text-indigo-400" />
                          {s.documentCount || 0} {(s.documentCount || 0) === 1 ? "book" : "books"}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setSeriesToEdit(s);
                            setIsCreateModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit series"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSeriesToDelete(s)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete series"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Series Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {s.title}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {s.description || "No description provided for this collection."}
                      </p>
                    </div>

                    {/* Volume Preview Pills */}
                    {s.documents && s.documents.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                          Volumes Inside
                        </p>
                        <div className="space-y-1">
                          {s.documents.slice(0, 3).map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-neutral-900/60 text-neutral-300"
                            >
                              <span className="truncate max-w-[190px] font-medium">
                                {d.volumeNumber !== undefined ? `Vol. ${d.volumeNumber} - ` : ""}
                                {d.title}
                              </span>
                              <span className="text-[10px] text-neutral-500 uppercase font-mono">{d.fileType}</span>
                            </div>
                          ))}
                          {s.documents.length > 3 && (
                            <p className="text-[11px] text-indigo-400 font-medium pl-1">
                              +{s.documents.length - 3} more volumes...
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-3 px-3 rounded-xl bg-neutral-900/40 border border-neutral-900 text-center text-xs text-neutral-500">
                        Folder is currently empty.
                      </div>
                    )}

                    {/* Stats footer */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-2 border-t border-neutral-900">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{s.totalReadingTime || 0} min read
                      </span>
                      <span>•</span>
                      <span>{(s.totalWords || 0).toLocaleString()} words</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveSeriesId(isActive ? null : s.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-800 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                      {isActive ? "Close Folder" : "View Books"}
                    </button>

                    <Link
                      href={`/chat?seriesId=${s.id}`}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      title="Chat with entire series"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unassigned / Loose Documents Section */}
      <div className="pt-6 border-t border-neutral-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-400" />
              Unorganized Books & Documents ({unassignedDocs.length})
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              These documents are currently standalone. Assign them to a series or folder to keep your library structured.
            </p>
          </div>
        </div>

        {unassignedDocs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-950/60 border border-neutral-800/60 text-center text-xs text-neutral-500">
            All your documents are organized into series!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unassignedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {doc.fileType}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {doc.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1"
                    title={doc.title}
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                    {doc.summary || doc.content.slice(0, 100)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-900">
                  <button
                    onClick={() => setDocToAssign(doc)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add to Series
                  </button>

                  <Link
                    href={`/documents/${doc.id}`}
                    className="py-1.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    Read
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Series Modal */}
      <CreateSeriesModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSeriesToEdit(null);
        }}
        initialData={seriesToEdit}
        onSubmit={async (data) => {
          if (seriesToEdit) {
            await updateSeries(seriesToEdit.id, data);
          } else {
            const created = await createSeries(data);
            setActiveSeriesId(created.id);
          }
          await refetchSeries();
        }}
      />

      {/* Assign Document to Series Modal */}
      <AssignSeriesModal
        isOpen={Boolean(docToAssign)}
        onClose={() => setDocToAssign(null)}
        document={docToAssign}
        seriesList={series}
        onCreateNewSeries={() => {
          setSeriesToEdit(null);
          setIsCreateModalOpen(true);
        }}
        onAssign={async (seriesId, volumeNumber) => {
          if (!docToAssign) return;
          if (seriesId) {
            await assignDocument(seriesId, docToAssign.id, volumeNumber);
          } else if (docToAssign.seriesId) {
            await unassignDocument(docToAssign.seriesId, docToAssign.id);
          }
          await Promise.all([refetchSeries(), refetchDocs()]);
        }}
      />

      {/* Delete Series Modal */}
      <DeleteSeriesModal
        isOpen={Boolean(seriesToDelete)}
        onClose={() => setSeriesToDelete(null)}
        seriesTitle={seriesToDelete?.title || ""}
        documentCount={seriesToDelete?.documentCount || 0}
        onConfirm={async () => {
          if (!seriesToDelete) return;
          await deleteSeries(seriesToDelete.id);
          if (activeSeriesId === seriesToDelete.id) {
            setActiveSeriesId(null);
          }
          await Promise.all([refetchSeries(), refetchDocs()]);
        }}
      />
    </div>
  );
}
