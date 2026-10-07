import React, { useState, useEffect } from 'react';
import { useAppStore, usePlatform } from '@openanything/app';
import { TabStrip } from './components/TabStrip';
import { ViewerHost } from './components/ViewerHost';

export function ViewerLayout() {
  const { activeFiles, addFiles } = useAppStore();
  const { files } = usePlatform();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Auto-select the first tab if none is active
  useEffect(() => {
    if (activeFiles.length > 0 && (!activeTabId || !activeFiles.find(f => f.id === activeTabId))) {
      setActiveTabId(activeFiles[activeFiles.length - 1].id); // Select most recently added
    } else if (activeFiles.length === 0) {
      setActiveTabId(null);
    }
  }, [activeFiles, activeTabId]);

  const activeFile = activeFiles.find(f => f.id === activeTabId);

  if (activeFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-400 h-screen">
        <p className="text-xl text-slate-200 mb-6 font-medium">No files open.</p>
        <button 
          onClick={async () => {
            try {
              const openedFiles = await files.pickFiles();
              if (openedFiles.length > 0) addFiles(openedFiles);
            } catch (err) {
              console.error(err);
            }
          }}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
        >
          Open a file
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Top Toolbar (Placeholder for Stage 6 full implementation) */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
        <div className="font-semibold text-slate-200">OpenAnything Viewer</div>
        <div className="text-sm text-slate-400">
          {activeFile ? `${(activeFile.size / 1024).toFixed(1)} KB` : ''}
        </div>
      </div>
      
      <TabStrip activeId={activeTabId} onSelect={setActiveTabId} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Placeholder) */}
        <div className="w-64 bg-slate-900 border-r border-slate-800 hidden md:block">
          <div className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Outline</div>
        </div>
        
        {/* Main Viewer Area */}
        {activeFile ? <ViewerHost file={activeFile} key={activeFile.id} /> : null}
      </div>
    </div>
  );
}
