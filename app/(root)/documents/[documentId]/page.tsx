"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Bot,
  User,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Type,
  FileCode,
  FileSpreadsheet,
  Clock,
  Share2,
  ListOrdered,
  Eye,
  Sliders,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useDocuments, Document } from "@/hooks/useDocuments";
import { useChat } from "@ai-sdk/react";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;

  const { documents, getDocument, isLoading: isDocsLoading } = useDocuments();
  const [doc, setDoc] = useState<Document | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);

  // Reader Customizations
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");
  const [fontFamily, setFontFamily] = useState<"sans" | "serif" | "mono">("sans");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"reader" | "pdf" | "metadata">("reader");
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "summary">("summary");

  // In-document text search
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // UI state
  const [isCopied, setIsCopied] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Chat with Document using @ai-sdk/react
  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading, setInput } = useChat({
    api: "/api/chat",
    body: { documentId },
  });

  // Load document from cache or API
  useEffect(() => {
    const existing = getDocument(documentId);
    if (existing) {
      setDoc(existing);
      setIsLoadingDoc(false);
    } else {
      // Fetch directly from API
      fetch(`/api/documents/${documentId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Document not found");
          return res.json();
        })
        .then((data) => {
          setDoc(data);
          setIsLoadingDoc(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoadingDoc(false);
        });
    }
  }, [documentId, getDocument, documents]);

  // If document is PDF, default to PDF tab if url exists
  useEffect(() => {
    if (doc?.fileType === "pdf" && doc?.fileUrl) {
      setActiveTab("pdf");
    }
  }, [doc]);

  // Calculate reading scroll progress
  const handleScroll = () => {
    if (!contentScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentScrollRef.current;
    if (scrollHeight <= clientHeight) {
      setReadProgress(100);
      return;
    }
    const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
    setReadProgress(progress);
  };

  // Copy document text
  const handleCopy = () => {
    if (!doc) return;
    navigator.clipboard.writeText(doc.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download document
  const handleDownload = () => {
    if (!doc) return;
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

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Get typography styling classes
  const typographyClass = useMemo(() => {
    let font = "font-sans";
    if (fontFamily === "serif") font = "font-serif";
    if (fontFamily === "mono") font = "font-mono";

    let size = "text-base leading-relaxed";
    if (fontSize === "sm") size = "text-sm leading-normal";
    if (fontSize === "lg") size = "text-lg leading-loose";
    if (fontSize === "xl") size = "text-xl leading-loose";

    return `${font} ${size}`;
  }, [fontFamily, fontSize]);

  // Highlight search occurrences
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Split by lines to render markdown headers and lists cleanly
    const lines = content.split("\n");

    return lines.map((line, idx) => {
      // Header 1
      if (line.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl md:text-3xl font-extrabold text-white mt-8 mb-4 border-b border-neutral-800 pb-2">
            {highlightText(line.replace("# ", ""))}
          </h1>
        );
      }
      // Header 2
      if (line.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl md:text-2xl font-bold text-neutral-100 mt-6 mb-3">
            {highlightText(line.replace("## ", ""))}
          </h2>
        );
      }
      // Header 3
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg md:text-xl font-semibold text-neutral-200 mt-5 mb-2">
            {highlightText(line.replace("### ", ""))}
          </h3>
        );
      }
      // Bullet items
      if (/^[•\-\*]\s+/.test(line)) {
        return (
          <li key={idx} className="ml-6 list-disc text-neutral-300 my-1.5 pl-1 marker:text-indigo-400">
            {highlightText(line.replace(/^[•\-\*]\s+/, ""))}
          </li>
        );
      }
      // Numbered items
      if (/^\d+\.\s+/.test(line)) {
        return (
          <li key={idx} className="ml-6 list-decimal text-neutral-300 my-1.5 pl-1 marker:text-indigo-400">
            {highlightText(line.replace(/^\d+\.\s+/, ""))}
          </li>
        );
      }
      // Code fence blocks
      if (line.startsWith("```")) {
        return (
          <div key={idx} className="my-2 py-1 px-3 bg-neutral-900 border border-neutral-800 rounded font-mono text-xs text-indigo-300">
            {line}
          </div>
        );
      }
      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={idx} className="h-4" />;
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-neutral-300 my-2.5">
          {highlightText(line)}
        </p>
      );
    });
  };

  const highlightText = (text: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-amber-400/30 text-amber-200 px-1 py-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (isLoadingDoc) {
    return (
      <div className="max-w-6xl mx-auto h-[calc(100vh-10rem)] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Opening document reader...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-xl mx-auto h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-neutral-900 text-neutral-500">
          <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Document Not Found</h2>
        <p className="text-sm text-neutral-400">
          The requested document could not be located in your library.
        </p>
        <Link
          href="/documents"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Return to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col gap-4">
      {/* Top Header & Reader Controls */}
      <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Left: Back Link & Document Details */}
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/documents"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors flex-shrink-0"
            title="Back to Document Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base md:text-lg font-bold text-white truncate max-w-md" title={doc.title}>
                {doc.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase flex-shrink-0">
                {doc.fileType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>{doc.filename}</span>
              <span>•</span>
              <span>{formatBytes(doc.fileSize)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500" />
                {doc.readingTimeMinutes} min read
              </span>
            </div>
          </div>
        </div>

        {/* Right: Reader Customizations & Actions */}
        <div className="flex items-center gap-2">
          {/* In-Document Search Toggle */}
          <div className="relative">
            {isSearchOpen ? (
              <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs">
                <Search className="w-3.5 h-3.5 text-neutral-400 mr-2" />
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Find in document..."
                  className="bg-transparent text-white placeholder-neutral-500 focus:outline-none w-36"
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchTerm("");
                  }}
                  className="text-neutral-400 hover:text-white ml-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                title="Search in document"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Typography Controls */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            {/* Font Size */}
            <button
              onClick={() => setFontSize(fontSize === "xl" ? "base" : fontSize === "lg" ? "xl" : fontSize === "base" ? "lg" : "base")}
              className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white font-medium flex items-center gap-1"
              title="Change Font Size"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px]">{fontSize}</span>
            </button>

            <span className="text-neutral-700">|</span>

            {/* Font Family */}
            <button
              onClick={() => setFontFamily(fontFamily === "sans" ? "serif" : fontFamily === "serif" ? "mono" : "sans")}
              className="px-2 py-1 rounded hover:bg-neutral-800 hover:text-white font-medium capitalize text-[11px]"
              title="Change Font Style"
            >
              {fontFamily}
            </button>
          </div>

          {/* Copy Content */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors relative"
            title="Copy Text"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download Original */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-2 rounded-lg transition-colors ${
              isFocusMode
                ? "bg-indigo-600 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
            title={isFocusMode ? "Exit Focus Mode" : "Focus Reader (Full Width)"}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Side: Document Reader Container */}
        <div
          className={`bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isFocusMode ? "w-full" : "w-full lg:w-7/12 xl:w-2/3"
          }`}
        >
          {/* Reading Mode Tabs & Reading Progress */}
          <div className="border-b border-neutral-800 bg-neutral-900/40 px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setActiveTab("reader")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "reader"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Reader Mode
              </button>

              {doc.fileType === "pdf" && doc.fileUrl && (
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    activeTab === "pdf"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                  Native PDF Viewer
                </button>
              )}

              <button
                onClick={() => setActiveTab("metadata")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === "metadata"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Details & Tags
              </button>
            </div>

            {/* Reading progress indicator */}
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
              <span>{readProgress}% read</span>
              <div className="w-16 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${readProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Reader Body */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === "reader" ? (
              <div
                ref={contentScrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto px-6 md:px-12 py-8 selection:bg-indigo-500/30"
              >
                <div className={`max-w-3xl mx-auto ${typographyClass}`}>
                  {renderFormattedContent(doc.content)}
                </div>
              </div>
            ) : activeTab === "pdf" && doc.fileUrl ? (
              <div className="w-full h-full bg-neutral-900">
                <iframe
                  src={doc.fileUrl}
                  title={doc.title}
                  className="w-full h-full border-none"
                />
              </div>
            ) : (
              /* Metadata Tab */
              <div className="p-8 max-w-xl mx-auto space-y-6 text-sm text-neutral-300">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Document Information</h3>
                  <p className="text-xs text-neutral-400">Properties extracted during ingestion</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Document ID</p>
                    <p className="text-xs font-mono text-white mt-1 break-all">{doc.id}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs text-neutral-500">File Type</p>
                    <p className="text-xs font-semibold text-indigo-400 mt-1 uppercase">{doc.fileType}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Word Count</p>
                    <p className="text-base font-bold text-white mt-1">{doc.wordCount.toLocaleString()}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Character Count</p>
                    <p className="text-base font-bold text-white mt-1">{doc.content.length.toLocaleString()}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Estimated Reading Time</p>
                    <p className="text-base font-bold text-white mt-1">{doc.readingTimeMinutes} Minutes</p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                    <p className="text-xs text-neutral-500">Uploaded Date</p>
                    <p className="text-xs text-white mt-1">
                      {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-400 mb-2">Subject Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {doc.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Assistant & Insights Panel */}
        {!isFocusMode && (
          <div className="w-full lg:w-5/12 xl:w-1/3 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {/* Side Tabs */}
            <div className="border-b border-neutral-800 bg-neutral-900/50 p-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSideTab("summary")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeSideTab === "summary"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  AI Summary
                </button>

                <button
                  onClick={() => setActiveSideTab("chat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeSideTab === "chat"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  Chat with Doc
                  {messages.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Side Tab Content */}
            {activeSideTab === "summary" ? (
              /* Summary Tab */
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Executive Summary
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                      AI Generated
                    </span>
                  </div>
                  <div className="mt-3 p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/80 text-sm text-neutral-200 leading-relaxed">
                    {doc.summary ||
                      "This document has been parsed and indexed. You can generate custom insights and chat with the document using the assistant."}
                  </div>
                </div>

                {doc.keyPoints && doc.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                      Key Takeaways & Findings
                    </h3>
                    <ul className="space-y-2.5">
                      {doc.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs text-neutral-300 p-2.5 rounded-lg bg-neutral-900/40 border border-neutral-800/50"
                        >
                          <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick actions for AI */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveSideTab("chat");
                      setInput("Summarize the key points and implications of this document.");
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Ask AI deeper questions about this document
                  </button>
                </div>
              </div>
            ) : (
              /* Chat Tab */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 text-neutral-400">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Ask about "{doc.title}"</h4>
                        <p className="text-xs text-neutral-500 mt-1">
                          The assistant will answer with strict grounding from this document.
                        </p>
                      </div>

                      {/* Prompt suggestion chips */}
                      <div className="space-y-1.5 w-full pt-2">
                        {[
                          "What is the main thesis of this document?",
                          "Summarize in 3 bullet points",
                          "What are the key technical takeaways?",
                          "List any action items or recommendations"
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            onClick={() => setInput(prompt)}
                            className="w-full text-left text-xs p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-indigo-500/30 text-neutral-300 transition-colors truncate"
                          >
                            👉 {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {m.role !== "user" && (
                          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-4 h-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            m.role === "user"
                              ? "bg-indigo-600 text-white"
                              : "bg-neutral-900 border border-neutral-800 text-neutral-200"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                        {m.role === "user" && (
                          <div className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {isChatLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="rounded-2xl px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-neutral-900/60 border-t border-neutral-800">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask anything about this document..."
                      className="flex-1 bg-neutral-950 border border-neutral-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-neutral-500"
                      disabled={isChatLoading}
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !input.trim()}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
