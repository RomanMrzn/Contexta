import React, { useEffect, useState } from 'react';
// @ts-ignore
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { OpenedFile } from '@openanything/platform';

export function DocxViewer({ file }: { file: OpenedFile }) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function renderDocx() {
      try {
        setLoading(true);
        // mammoth expects an ArrayBuffer
        const result = await mammoth.convertToHtml({ arrayBuffer: file.buffer });
        
        // Sanitize the output to prevent XSS
        const sanitized = DOMPurify.sanitize(result.value);
        setHtml(sanitized);
      } catch (err) {
        console.error(err);
        setHtml('<p class="text-red-500">Failed to render DOCX file.</p>');
      } finally {
        setLoading(false);
      }
    }
    
    renderDocx();
  }, [file]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Parsing Document...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F3F4F6] p-8 custom-scrollbar">
      <div 
        className="max-w-4xl mx-auto bg-white text-slate-900 rounded-sm shadow-xl p-12 min-h-[1056px]"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          // Basic reset for DOCX elements since Tailwind strips them
          fontFamily: 'Calibri, Arial, sans-serif',
          lineHeight: '1.6',
        }}
      />
    </div>
  );
}
