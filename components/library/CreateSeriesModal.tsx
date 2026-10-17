"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Edit3, X, Sparkles, Check } from "lucide-react";

export interface SeriesFormData {
  title: string;
  description: string;
  category: string;
  colorTheme: string;
}

interface CreateSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SeriesFormData) => Promise<void>;
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    category?: string;
    colorTheme?: string;
  } | null;
}

const CATEGORY_PRESETS = [
  "Light Novel / Fiction",
  "Research Papers",
  "Textbooks & Study",
  "Technical Docs",
  "Work & Business",
  "Personal Archive",
];

export const COLOR_THEMES = [
  { id: "indigo", name: "Indigo", bg: "bg-indigo-500", border: "border-indigo-500", ring: "ring-indigo-500", glow: "from-indigo-600/20 to-indigo-900/10" },
  { id: "violet", name: "Violet", bg: "bg-violet-500", border: "border-violet-500", ring: "ring-violet-500", glow: "from-violet-600/20 to-violet-900/10" },
  { id: "emerald", name: "Emerald", bg: "bg-emerald-500", border: "border-emerald-500", ring: "ring-emerald-500", glow: "from-emerald-600/20 to-emerald-900/10" },
  { id: "amber", name: "Amber", bg: "bg-amber-500", border: "border-amber-500", ring: "ring-amber-500", glow: "from-amber-600/20 to-amber-900/10" },
  { id: "rose", name: "Rose", bg: "bg-rose-500", border: "border-rose-500", ring: "ring-rose-500", glow: "from-rose-600/20 to-rose-900/10" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500", border: "border-cyan-500", ring: "ring-cyan-500", glow: "from-cyan-600/20 to-cyan-900/10" },
  { id: "blue", name: "Blue", bg: "bg-blue-500", border: "border-blue-500", ring: "ring-blue-500", glow: "from-blue-600/20 to-blue-900/10" },
];

export function CreateSeriesModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CreateSeriesModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Light Novel / Fiction");
  const [colorTheme, setColorTheme] = useState("indigo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setCategory(initialData.category || "Light Novel / Fiction");
      setColorTheme(initialData.colorTheme || "indigo");
    } else {
      setTitle("");
      setDescription("");
      setCategory("Light Novel / Fiction");
      setColorTheme("indigo");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a name or title for this series / folder");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        colorTheme,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save series. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              {isEditMode ? <Edit3 className="w-6 h-6" /> : <FolderPlus className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEditMode ? "Edit Series / Folder" : "Create New Series / Folder"}
              </h3>
              <p className="text-xs text-neutral-400">
                Group multiple books, volumes, or related documents together.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Series / Folder Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Slime Isekai, Quantum Physics, Q4 Quarterly Reports"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    category === cat
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_THEMES.map((theme) => {
                const isSelected = colorTheme === theme.id;
                return (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => setColorTheme(theme.id)}
                    className={`w-7 h-7 rounded-full ${theme.bg} flex items-center justify-center transition-all ${
                      isSelected
                        ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-950 scale-110"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    title={theme.name}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional summary of what this collection covers..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isEditMode ? "Save Changes" : "Create Series"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
