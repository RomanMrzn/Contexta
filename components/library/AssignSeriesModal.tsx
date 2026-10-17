"use client";

import { useState, useEffect } from "react";
import { Folder, Layers, Hash, X, Check, Plus } from "lucide-react";
import { Series } from "@/hooks/useSeries";

interface AssignSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    seriesId?: string;
    volumeNumber?: number;
  } | null;
  seriesList: Series[];
  onAssign: (seriesId: string | null, volumeNumber?: number) => Promise<void>;
  onCreateNewSeries?: () => void;
}

export function AssignSeriesModal({
  isOpen,
  onClose,
  document,
  seriesList,
  onAssign,
  onCreateNewSeries,
}: AssignSeriesModalProps) {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [volumeNumber, setVolumeNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setSelectedSeriesId(document.seriesId || null);
      setVolumeNumber(document.volumeNumber !== undefined ? String(document.volumeNumber) : "");
    } else {
      setSelectedSeriesId(null);
      setVolumeNumber("");
    }
    setError(null);
  }, [document, isOpen]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const vol = volumeNumber.trim() !== "" ? parseInt(volumeNumber.trim(), 10) : undefined;
      await onAssign(selectedSeriesId, Number.isNaN(vol) ? undefined : vol);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update series assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Organize into Series</h3>
              <p className="text-xs text-neutral-400">
                Assign to a collection or specify volume number.
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

        {/* Selected Document Info */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          <p className="text-xs text-neutral-400 font-medium">Selected Document / Book:</p>
          <p className="text-sm font-semibold text-neutral-200 truncate mt-0.5">{document.title}</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Series Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Select Series / Folder
              </label>
              {onCreateNewSeries && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateNewSeries();
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Series
                </button>
              )}
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {/* Option to unassign / standalone */}
              <button
                type="button"
                onClick={() => setSelectedSeriesId(null)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                  selectedSeriesId === null
                    ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-400 flex items-center justify-center">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">None (Standalone Document)</p>
                    <p className="text-[11px] text-neutral-500">Not part of any series</p>
                  </div>
                </div>
                {selectedSeriesId === null && <Check className="w-4 h-4 text-indigo-400" />}
              </button>

              {seriesList.map((s) => {
                const isSelected = selectedSeriesId === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedSeriesId(s.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                        : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-[11px] text-neutral-500">
                          {s.category || "General"} • {s.documentCount || 0} books
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 ml-2" />}
                  </button>
                );
              })}

              {seriesList.length === 0 && (
                <div className="text-center py-4 text-xs text-neutral-500">
                  No series created yet. Click "+ New Series" above to make one!
                </div>
              )}
            </div>
          </div>

          {/* Volume / Part Number (Only if a series is selected) */}
          {selectedSeriesId !== null && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Volume / Order Number (Optional)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={volumeNumber}
                  onChange={(e) => setVolumeNumber(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Specifies reading or chronological order within the series.
              </p>
            </div>
          )}

          {/* Actions */}
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Assignment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
