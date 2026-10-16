import { FileText, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-neutral-400 mt-2">Welcome to Contexta. Upload documents and start chatting with them.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Upload Card */}
        <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-500/50 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Upload Document</h3>
            <p className="text-sm text-neutral-400 mt-1">PDF, DOCX, TXT</p>
          </div>
        </div>

        {/* Library Stats Card */}
        <Link href="/documents" className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 hover:border-neutral-700 transition-colors">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">0 Documents</h3>
            <p className="text-sm text-neutral-400 mt-1">View Library</p>
          </div>
        </Link>

        {/* Global Chat Card */}
        <Link href="/chat" className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl shadow-sm flex flex-col items-center justify-center text-center space-y-4 hover:border-neutral-700 transition-colors">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Library Chat</h3>
            <p className="text-sm text-neutral-400 mt-1">Query across all docs</p>
          </div>
        </Link>
      </div>
      
      {/* Recent Documents Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Recent Documents</h2>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center">
          <p className="text-neutral-500">No documents found. Upload one to get started.</p>
        </div>
      </div>
    </div>
  );
}
