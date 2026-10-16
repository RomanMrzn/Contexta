"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Bot, User } from "lucide-react";

export default function GlobalChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-neutral-800 bg-neutral-900/50">
        <h1 className="text-xl font-bold text-white">Library Chat</h1>
        <p className="text-sm text-neutral-400">Ask questions across all documents in your library.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-neutral-500">
            <Bot className="w-12 h-12 text-neutral-700" />
            <p>I am Contexta AI. How can I help you explore your documents today?</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role !== "user" && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-200"}`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-neutral-300" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-neutral-800 text-neutral-200">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-neutral-900 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask anything about your documents..."
            className="flex-1 bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg px-6 flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
