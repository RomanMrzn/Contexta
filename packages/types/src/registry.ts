import { z } from 'zod';

export const ViewerCategorySchema = z.enum([
  'pdf',
  'document',
  'spreadsheet',
  'presentation',
  'epub',
  'image',
  'text',
  'code',
  'unknown'
]);

export type ViewerCategory = z.infer<typeof ViewerCategorySchema>;

export const SupportLevelSchema = z.enum(['full', 'partial', 'download-only']);
export type SupportLevel = z.infer<typeof SupportLevelSchema>;

export interface FormatDefinition {
  category: ViewerCategory;
  viewer: string;
  supportLevel: SupportLevel;
  limitations?: string;
  mimes: string[];
}

export const formatRegistry: Record<string, FormatDefinition> = {
  '.pdf': {
    category: 'pdf',
    viewer: 'pdfjs',
    supportLevel: 'full',
    mimes: ['application/pdf']
  },
  '.docx': {
    category: 'document',
    viewer: 'mammoth',
    supportLevel: 'full',
    limitations: 'Complex layouts may differ from Word.',
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  '.epub': {
    category: 'epub',
    viewer: 'epubjs',
    supportLevel: 'full',
    mimes: ['application/epub+zip']
  },
  '.xlsx': {
    category: 'spreadsheet',
    viewer: 'sheetjs',
    supportLevel: 'full',
    limitations: 'Huge sheets will have a row cap applied.',
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  },
  '.csv': {
    category: 'spreadsheet',
    viewer: 'sheetjs',
    supportLevel: 'full',
    mimes: ['text/csv']
  },
  '.md': {
    category: 'text',
    viewer: 'markdown',
    supportLevel: 'full',
    mimes: ['text/markdown']
  },
  '.json': {
    category: 'code',
    viewer: 'json-tree',
    supportLevel: 'full',
    mimes: ['application/json']
  },
  '.png': {
    category: 'image',
    viewer: 'image',
    supportLevel: 'full',
    mimes: ['image/png']
  },
  '.doc': {
    category: 'document',
    viewer: 'none',
    supportLevel: 'download-only',
    limitations: 'Legacy format. Please download the original.',
    mimes: ['application/msword']
  }
};
