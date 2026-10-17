import fs from 'fs';
import path from 'path';

export type DocumentType =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'pptx'
  | 'ppt'
  | 'epub'
  | 'markdown'
  | 'text'
  | 'csv'
  | 'json';

export interface Document {
  id: string;
  userId: string;
  title: string;
  filename: string;
  fileSize: number;
  fileType: DocumentType;
  content: string;
  fileUrl?: string;
  summary?: string;
  keyPoints?: string[];
  wordCount: number;
  readingTimeMinutes: number;
  createdAt: string;
  tags?: string[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'documents.json');

const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc-rag-architecture',
    userId: 'system',
    title: 'Contexta RAG Architecture & Vector Pipeline',
    filename: 'contexta_rag_architecture.md',
    fileSize: 4280,
    fileType: 'markdown',
    wordCount: 520,
    readingTimeMinutes: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    tags: ['Architecture', 'Vector DB', 'RAG'],
    summary:
      'This document outlines the end-to-end technical architecture of Contexta. It covers the ingestion pipeline using UnPDF and Mammoth, recursive token chunking with 15% overlap, HNSW pgvector indexing, and low-latency hybrid retrieval with citation synthesis.',
    keyPoints: [
      'Ingestion utilizes format-specific parsers to preserve headings and table layouts.',
      'Chunking uses a recursive character splitter with dynamic window sizing (500 tokens, 75 token overlap).',
      'Embeddings are generated via OpenAI text-embedding-3-small yielding 1536-dimensional vectors.',
      'Search combines cosine similarity ranking with Reciprocal Rank Fusion (RRF) for precision.',
      'Streamed generation produces contextual citations directly mapping back to source page numbers.'
    ],
    content: `# Contexta RAG Architecture & Vector Pipeline

## 1. Executive Summary
Contexta is an enterprise-grade document intelligence platform designed to eliminate hallucinations in question-answering systems. By combining semantic dense retrieval with deterministic sparse filtering, Contexta provides verifiable source citations alongside synthesized insights.

## 2. Ingestion & Preprocessing
When an operator uploads a document (PDF, DOCX, Markdown, or raw text), the system executes a three-stage parsing workflow:
1. **Format-Aware Normalization**: Strips decorative headers/footers, extracts tabular schemas into Markdown tables, and converts mathematical formulas into LaTeX syntax.
2. **Deterministic Token Boundary Detection**: Implements a sliding window tokenizer designed to avoid cutting across sentence or bullet-point boundaries.
3. **Metadata Enrichment**: Automatically calculates document readability indexes, language detection, and extracts primary subject matter tags.

\`\`\`
[Upload Stream] -> [Parser Engine] -> [Metadata Extractor] -> [Chunker] -> [Embedder]
\`\`\`

## 3. Vector Storage & HNSW Indexing
All chunks are embedded using high-density vector representations and written to PostgreSQL with pgvector:
- Metric: Cosine Distance (\`<=>\` operator)
- Index Strategy: HNSW (Hierarchical Navigable Small World) with \`m = 16\` and \`ef_construction = 64\`
- Target Search Latency: Under 18ms for collections exceeding 500,000 document vectors.

## 4. Synthesis & Grounding
During conversational queries, retrieved chunks are reranked and packed into the context window with strict grounding instructions. The LLM is instructed to refuse questions that lack supporting document chunks, guaranteeing enterprise reliability.`
  },
  {
    id: 'doc-ai-whitepaper',
    userId: 'system',
    title: 'Modern Generative AI Foundations & Scalability',
    filename: 'generative_ai_scalability.txt',
    fileSize: 3840,
    fileType: 'text',
    wordCount: 460,
    readingTimeMinutes: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    tags: ['AI Research', 'Transformers', 'Inference'],
    summary:
      'A comprehensive review of self-attention mechanisms, KV-caching optimizations, and latency bottlenecks in modern large language models, emphasizing high-throughput inference techniques.',
    keyPoints: [
      'Transformer attention mechanisms scale quadratically with context length unless linear approximations are applied.',
      'KV cache memory bandwidth is the primary bottleneck during autoregressive token generation.',
      'Speculative decoding and continuous batching yield up to 3.8x throughput improvements on modern GPUs.',
      'Quantization down to FP8 or INT4 maintains 99% accuracy on knowledge benchmark tasks.'
    ],
    content: `MODERN GENERATIVE AI FOUNDATIONS & SCALABILITY
Published: October 2026
Research Group: AI Systems Laboratory

1. INTRODUCTION
Recent advancements in transformer-based autoregressive neural networks have unlocked human-level linguistic comprehension and logical synthesis. However, deploying these models at production scale introduces significant compute and memory challenges that require specialized engineering.

2. THE KV-CACHE BOTTLENECK
During the prefill phase, all prompt tokens are processed simultaneously in parallel matrix operations. However, during the decode phase, each new token must read every prior token's Key and Value states from high-bandwidth memory (HBM). As context lengths expand to 32k, 64k, and 128k tokens, memory bandwidth saturation becomes the dominant limiter of response latency.

3. OPTIMIZATION STRATEGIES
To maintain high responsiveness under concurrent workloads, production systems employ three primary mitigations:
- PagedAttention: Eliminates memory fragmentation by allocating virtual memory blocks dynamically.
- Speculative Decoding: Utilizes a smaller draft model to anticipate multiple future tokens, validated in a single forward pass by the primary model.
- Chunked Prefill: Interleaves prompt processing with token generation to maintain smooth streaming output.

4. CONCLUSION
Future architectures will increasingly balance local agentic compute with specialized cloud inference fabrics, making deterministic context retrieval paramount for enterprise deployments.`
  }
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_DOCUMENTS, null, 2), 'utf8');
  }
}

export function getDocuments(userId?: string): Document[] {
  try {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const docs: Document[] = JSON.parse(data);

    if (!userId) {
      return docs;
    }

    // Auto-claim legacy unassigned documents for the active user so existing uploads are preserved
    let updated = false;
    docs.forEach((doc) => {
      if (!doc.userId) {
        doc.userId = userId;
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), 'utf8');
    }

    // Return strictly documents belonging to this user
    return docs.filter((d) => d.userId === userId);
  } catch (error) {
    console.error('Failed to read documents store:', error);
    return [];
  }
}

export function getDocumentById(id: string, userId?: string): Document | null {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  const docs: Document[] = JSON.parse(data);
  const found = docs.find((d) => d.id === id);
  if (!found) return null;

  // If document had no userId yet, associate it with this requesting user
  if (!found.userId && userId) {
    found.userId = userId;
    saveDocument(found);
    return found;
  }

  // If a userId is specified, strictly enforce single-account ownership
  if (userId && found.userId !== userId) {
    return null;
  }

  return found;
}

export function saveDocument(document: Document): Document {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  const docs: Document[] = JSON.parse(data);
  const existingIndex = docs.findIndex((d) => d.id === document.id);

  if (existingIndex >= 0) {
    // Retain original owner unless explicitly provided
    docs[existingIndex] = {
      ...document,
      userId: document.userId || docs[existingIndex].userId,
    };
  } else {
    docs.unshift(document);
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), 'utf8');
  return document;
}

export function deleteDocumentById(id: string, userId?: string): boolean {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  const docs: Document[] = JSON.parse(data);
  const docToDelete = docs.find((d) => d.id === id);

  if (!docToDelete) return false;

  // Prevent another account from deleting someone else's document
  if (userId && docToDelete.userId && docToDelete.userId !== userId) {
    return false;
  }

  const filtered = docs.filter((d) => d.id !== id);
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf8');
  return true;
}

export function updateDocumentById(id: string, updates: Partial<Document>, userId?: string): Document | null {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  const docs: Document[] = JSON.parse(data);
  const index = docs.findIndex((d) => d.id === id);

  if (index === -1) return null;

  // Prevent another account from updating someone else's document
  if (userId && docs[index].userId && docs[index].userId !== userId) {
    return null;
  }

  docs[index] = { ...docs[index], ...updates };
  fs.writeFileSync(DATA_FILE, JSON.stringify(docs, null, 2), 'utf8');
  return docs[index];
}
