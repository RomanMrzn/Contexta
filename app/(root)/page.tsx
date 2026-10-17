"use client";

import { FileText, MessageSquare, Plus, ArrowRight, Clock, BookOpen, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useDocuments } from "@/hooks/useDocuments";

export default function DashboardPage() {
  const { documents, isLoading } = useDocuments();

  const recentDocs = documents.slice(0, 4);
  const totalWords = documents.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Welcome to Contexta Document Intelligence. Manage, read, and chat with your knowledge base.
          </p>
        </div>
        <Link
          href="/documents"
          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 self-start md:self-auto transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Upload className="w-4 h-4" />
          Upload New Document
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quick Upload Card */}
        <Link
          href="/documents"
          className="p-6 bg-neutral-950 border border-neutral-800 hover:border-indigo-500/50 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-3 transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Upload Document</h3>
            <p className="text-xs text-neutral-400 mt-1">PDF, Markdown, TXT, CSV, JSON</p>
          </div>
        </Link>

        {/* Library Stats Card */}
        <Link
          href="/documents"
          className="p-6 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-3 transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {isLoading ? "..." : `${documents.length} Documents`}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {isLoading ? "Counting words..." : `${totalWords.toLocaleString()} Words Indexed`}
            </p>
          </div>
        </Link>

        {/* Global Chat Card */}
        <Link
          href="/chat"
          className="p-6 bg-neutral-950 border border-neutral-800 hover:border-blue-500/50 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-3 transition-all hover:-translate-y-0.5 group"
        >
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Library Chat</h3>
            <p className="text-xs text-neutral-400 mt-1">Ask questions across all documents</p>
          </div>
        </Link>
      </div>

      {/* Recent Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Recent Documents
          </h2>
          <Link
            href="/documents"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            View All ({documents.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 bg-neutral-950 border border-neutral-800 rounded-2xl text-center space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Loading recent documents...</p>
          </div>
        ) : recentDocs.length === 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 text-center space-y-3">
            <p className="text-neutral-400 text-sm">No documents in your library yet.</p>
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload First Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/90 hover:border-indigo-500/40 flex flex-col justify-between space-y-4 transition-all hover:shadow-lg hover:shadow-indigo-500/5 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                      {doc.fileType}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doc.readingTimeMinutes} min read
                    </span>
                  </div>

                  <Link
                    href={`/documents/${doc.id}`}
                    className="font-bold text-white hover:text-indigo-400 transition-colors line-clamp-1 block text-base"
                  >
                    {doc.title}
                  </Link>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {doc.summary || doc.content.slice(0, 120)}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-900 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    {doc.wordCount.toLocaleString()} words
                  </span>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    Read Document
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
