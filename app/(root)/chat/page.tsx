"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { DeleteChatModal } from "@/components/DeleteChatModal";

export default function GlobalChatPage() {
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);
  const isChatHydrated = useRef(false);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    setMessages,
  } = useChat({
    api: "/api/chat",
  });

  // Hydrate global chat from localStorage on client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("contexta_global_chat");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load global chat history:", err);
    } finally {
      isChatHydrated.current = true;
    }
  }, [setMessages]);

  // Persist global chat to localStorage
  useEffect(() => {
    if (!isChatHydrated.current || typeof window === "undefined") return;
    try {
      if (messages.length > 0) {
        localStorage.setItem("contexta_global_chat", JSON.stringify(messages));
      } else {
        localStorage.removeItem("contexta_global_chat");
      }
    } catch (err) {
      console.error("Failed to save global chat history:", err);
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("contexta_global_chat");
    }
  };

  const handleDeleteSingleMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const renderFormattedInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderChatMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-white text-sm mt-3 mb-1.5">
            {renderFormattedInline(line.replace("### ", ""))}
          </h4>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-2 border-indigo-500 pl-3 my-2 italic text-neutral-300 text-xs bg-indigo-500/10 py-1.5 px-2.5 rounded-r">
            {renderFormattedInline(line.replace(/^>\s*/, ""))}
          </blockquote>
        );
      }
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-5 list-disc text-neutral-300 my-1 text-xs">
            {renderFormattedInline(line.replace(/^[•\-]\s*/, ""))}
          </li>
        );
      }
      if (/^\d+\.\s+/.test(line)) {
        return (
          <li key={idx} className="ml-5 list-decimal text-neutral-300 my-1 text-xs">
            {renderFormattedInline(line.replace(/^\d+\.\s+/, ""))}
          </li>
        );
      }
      if (!line.trim()) return <div key={idx} className="h-2" />;
      return (
        <p key={idx} className="my-1 leading-relaxed">
          {renderFormattedInline(line)}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Library Chat</h1>
          <p className="text-sm text-neutral-400">Ask questions across all documents in your library.</p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setIsDeleteChatModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all shadow-sm"
            title="Delete chat conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px]">
              {messages.length}
            </span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 text-neutral-400">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Explore Your Knowledge Base</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Ask cross-document questions, request synthesis, or compare findings from your uploaded files.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              {[
                "Summarize all documents in my library",
                "What key technical takeaways are documented?",
                "What topics and subjects are covered?",
                "List action items and recommendations"
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="w-full text-left text-xs p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-indigo-500/40 text-neutral-300 hover:text-white transition-all flex items-center gap-2"
                >
                  <span className="text-indigo-400">👉</span>
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`group flex items-start gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role !== "user" && (
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              {/* Delete button (user side) */}
              {m.role === "user" && (
                <button
                  onClick={() => handleDeleteSingleMessage(m.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-900 transition-all self-center"
                  title="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-200"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                ) : (
                  <div>{renderChatMessage(m.content)}</div>
                )}
              </div>

              {/* Delete button (bot side) */}
              {m.role !== "user" && (
                <button
                  onClick={() => handleDeleteSingleMessage(m.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-neutral-900 transition-all self-center"
                  title="Delete response"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-neutral-300" />
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

      {/* Delete Chat Confirmation Modal */}
      <DeleteChatModal
        isOpen={isDeleteChatModalOpen}
        onClose={() => setIsDeleteChatModalOpen(false)}
        onConfirm={handleClearChat}
        conversationName="Library Chat"
        messageCount={messages.length}
      />
    </div>
  );
}
