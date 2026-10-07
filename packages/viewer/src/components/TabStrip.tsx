import React from 'react';
import { useAppStore, usePlatform } from '@openanything/app';
import { X, File as FileIcon, Plus } from 'lucide-react';
import { cn } from '@openanything/ui';

export function TabStrip({ activeId, onSelect }: { activeId: string | null, onSelect: (id: string) => void }) {
  const { activeFiles, removeFile, addFiles } = useAppStore();
  const { files } = usePlatform();

  if (activeFiles.length === 0) return null;

  return (
    <div className="flex bg-slate-900 border-b border-slate-800 overflow-x-auto custom-scrollbar">
      {activeFiles.map(file => (
        <div 
          key={file.id}
          onClick={() => onSelect(file.id)}
          className={cn(
            "flex items-center space-x-2 px-4 py-2 text-sm border-r border-slate-800 cursor-pointer min-w-[150px] max-w-[250px] group transition-colors",
            activeId === file.id 
              ? "bg-slate-800 text-slate-100 border-t-2 border-t-blue-500" 
              : "bg-slate-900 text-slate-400 hover:bg-slate-800/50"
          )}
        >
          <FileIcon className="h-4 w-4 shrink-0" />
          <span className="truncate flex-1">{file.name}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
            className="p-1 rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button 
        onClick={async () => {
          try {
            const opened = await files.pickFiles();
            if (opened.length > 0) {
              addFiles(opened);
              onSelect(opened[opened.length - 1].id);
            }
          } catch (e) {
            console.error(e);
          }
        }}
        className="ml-2 p-1.5 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors shrink-0 flex items-center justify-center"
        title="Open new file"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
