import React, { useState, useEffect } from 'react';
import { OpenedFile } from '@openanything/platform';
import { formatRegistry } from '@openanything/types';
import { DocxViewer } from '../viewers/DocxViewer';
import { EpubViewer } from '../viewers/EpubViewer';

export function ViewerHost({ file }: { file: OpenedFile }) {
  const [content, setContent] = useState<string>('');
  const formatDef = formatRegistry[file.extension.toLowerCase()];

  useEffect(() => {
    // Only decode for text/json/md fallbacks
    if (file.extension === '.docx' || file.extension === '.epub') return;
    
    const decodeText = async () => {
      try {
        // Only decode the first 50KB to avoid crashing the browser with massive files
        const maxBytes = 50 * 1024;
        const bufferToDecode = file.buffer.byteLength > maxBytes 
          ? file.buffer.slice(0, maxBytes) 
          : file.buffer;
          
        const text = new TextDecoder().decode(bufferToDecode);
        setContent(text + (file.buffer.byteLength > maxBytes ? '\n\n... (file truncated for MVP viewer)' : ''));
      } catch (e) {
        setContent("Binary file or unsupported encoding.");
      }
    };
    decodeText();
  }, [file]);

  if (!formatDef) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
        <div>
          <h3 className="text-xl font-medium mb-2 text-slate-200">Unsupported File Type</h3>
          <p>OpenAnything doesn't know how to render {file.extension} files yet.</p>
        </div>
      </div>
    );
  }

  if (file.extension === '.docx') {
    return <DocxViewer file={file} />;
  }

  if (file.extension === '.epub') {
    return <EpubViewer file={file} />;
  }

  // Very basic text rendering for the initial engine
  return (
    <div className="flex-1 overflow-auto bg-slate-950 p-8 custom-scrollbar">
      <div className="max-w-4xl mx-auto bg-slate-900 rounded-lg shadow-xl border border-slate-800 p-6 whitespace-pre-wrap font-mono text-sm text-slate-300">
        {content}
      </div>
    </div>
  );
}
