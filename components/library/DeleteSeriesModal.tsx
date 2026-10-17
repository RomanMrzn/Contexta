"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X, ShieldCheck } from "lucide-react";

interface DeleteSeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  seriesTitle: string;
  documentCount: number;
}

export function DeleteSeriesModal({
  isOpen,
  onClose,
  onConfirm,
  seriesTitle,
  documentCount,
}: DeleteSeriesModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-neutral-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Delete Series / Folder</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Are you sure you want to remove the series folder{" "}
            <span className="font-semibold text-neutral-200 break-all">"{seriesTitle}"</span>?
          </p>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Safe deletion:</strong> Your {documentCount} book{documentCount === 1 ? "" : "s"} / document{documentCount === 1 ? "" : "s"} will <strong>not</strong> be deleted. They will simply be moved back to your unassigned library.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Series
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
