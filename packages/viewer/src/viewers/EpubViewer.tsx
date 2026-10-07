import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import ePub from 'epubjs';
import { OpenedFile } from '@openanything/platform';
import { ChevronLeft, ChevronRight, LayoutList, BookOpen } from 'lucide-react';

export function EpubViewer({ file }: { file: OpenedFile }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaginated, setIsPaginated] = useState(true);

  useEffect(() => {
    if (!viewerRef.current) return;
    
    // Clean up previous renders
    viewerRef.current.innerHTML = '';
    
    // epub.js accepts an ArrayBuffer
    const book = ePub(file.buffer);
    
    // Render using dynamic flow based on user preference
    const rendition = book.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      flow: isPaginated ? 'paginated' : 'scrolled-doc'
    });
    renditionRef.current = rendition;

    rendition.display().then(() => {
      setLoading(false);
    }).catch((err: any) => {
      console.error("ePub display error:", err);
      setLoading(false);
    });

    return () => {
      book.destroy();
    };
  }, [file, isPaginated]); // re-render when isPaginated changes

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden relative">
      
      {/* Settings Bar */}
      <div className="absolute top-4 right-8 z-20 flex space-x-1 bg-white/90 backdrop-blur shadow-sm p-1 rounded-lg border border-slate-200">
        <button 
          onClick={() => setIsPaginated(true)}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 text-sm font-medium transition-colors ${isPaginated ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Paginated View"
        >
          <BookOpen className="w-4 h-4" />
          <span>Pages</span>
        </button>
        <button 
          onClick={() => setIsPaginated(false)}
          className={`px-3 py-1.5 rounded flex items-center space-x-2 text-sm font-medium transition-colors ${!isPaginated ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          title="Scroll View"
        >
          <LayoutList className="w-4 h-4" />
          <span>Scroll</span>
        </button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f8f9fa] z-10">
          <div className="animate-pulse flex items-center space-x-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Parsing EPUB...</span>
          </div>
        </div>
      )}
      
      {/* The container for epub.js */}
      <div className="flex-1 overflow-hidden p-8">
        <div 
          ref={viewerRef} 
          className={`w-full max-w-3xl mx-auto bg-white rounded shadow-lg overflow-hidden ${isPaginated ? 'h-full' : 'h-[calc(100vh-200px)]'}`} 
        />
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl z-20">
        <button 
          onClick={() => renditionRef.current?.prev()}
          className="p-2 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium px-2">{isPaginated ? 'Turn Page' : 'Next Chapter'}</span>
        <button 
          onClick={() => renditionRef.current?.next()}
          className="p-2 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
