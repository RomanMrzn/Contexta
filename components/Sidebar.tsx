import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Book, LayoutDashboard, MessageSquare } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col h-screen fixed">
      <div className="h-16 flex items-center px-6 border-b border-neutral-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Book className="w-6 h-6 text-indigo-500" />
          Contexta
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link href="/documents" className="flex items-center gap-3 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors">
          <Book className="w-5 h-5" />
          Documents
        </Link>
        <Link href="/chat" className="flex items-center gap-3 px-3 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors">
          <MessageSquare className="w-5 h-5" />
          Library Chat
        </Link>
      </nav>

      <div className="p-4 border-t border-neutral-800 flex items-center gap-3">
        <UserButton />
        <span className="text-sm text-neutral-400">Account</span>
      </div>
    </aside>
  );
}
