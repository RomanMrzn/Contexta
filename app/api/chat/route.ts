import { auth } from '@clerk/nextjs/server';
import { getDocumentById, getDocuments, Document } from '@/lib/documents-store';
import { createDataStreamResponse, formatDataStreamPart } from 'ai';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const currentUserId = userId || 'demo-user';

    const body = await req.json();
    const { messages, documentId, docTitle: clientTitle, docContent: clientContent } = body;
    const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

    const backendUrl = process.env.BACKEND_URL;

    // If an external backend is configured and running, attempt to proxy
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUserId,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          return new Response(response.body, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Vercel-AI-Data-Stream': 'v1',
            },
          });
        }
      } catch {
        // Backend not reachable, fall through to built-in document intelligence
      }
    }

    // Retrieve target document or collection
    let targetDoc: Document | null = null;
    let allDocs: Document[] = [];

    if (documentId) {
      targetDoc = getDocumentById(documentId);
    }

    // Fallback if client passed content directly
    if (!targetDoc && clientContent) {
      targetDoc = {
        id: documentId || 'current-doc',
        title: clientTitle || 'Uploaded Document',
        filename: `${(clientTitle || 'document').toLowerCase().replace(/\s+/g, '_')}.txt`,
        fileSize: Buffer.byteLength(clientContent, 'utf8'),
        fileType: 'text',
        content: clientContent,
        wordCount: clientContent.split(/\s+/).length,
        readingTimeMinutes: Math.max(1, Math.ceil(clientContent.split(/\s+/).length / 200)),
        createdAt: new Date().toISOString(),
      };
    }

    if (!targetDoc) {
      allDocs = getDocuments();
    }

    // Generate grounded contextual answer
    const answer = generateGroundedAnswer(latestMessage, targetDoc, allDocs);

    // Stream response using Vercel AI SDK Data Stream protocol
    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Break answer into natural reading phrases/words
        const words = answer.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          dataStream.write(formatDataStreamPart('text', chunk));
          // Micro-delay for natural streaming animation
          await new Promise((r) => setTimeout(r, 16));
        }
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.write(
          formatDataStreamPart(
            'text',
            'I encountered an error analyzing the document. Please try asking your question again.'
          )
        );
      },
    });
  }
}

/**
 * Intelligent Grounded Question Answering Engine
 */
function generateGroundedAnswer(
  question: string,
  doc: Document | null,
  allDocs: Document[]
): string {
  const qClean = question.trim();
  const qLower = qClean.toLowerCase();

  // Case 1: Specific Single Document Q&A
  if (doc) {
    return answerSingleDocument(qClean, qLower, doc);
  }

  // Case 2: Multi-document / Library Q&A
  if (allDocs.length > 0) {
    return answerMultiDocument(qClean, qLower, allDocs);
  }

  return `I am ready to answer questions about your documents! Please upload or select a document from your library to begin.`;
}

/**
 * Answers questions grounded in a single document
 */
function answerSingleDocument(question: string, qLower: string, doc: Document): string {
  const content = doc.content || '';
  const title = doc.title;

  // Extract query keywords (excluding common stop words)
  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'who', 'whom', 'where', 'when', 'why', 'how', 'does', 'do', 'did', 'can',
    'could', 'would', 'should', 'will', 'tell', 'me', 'about', 'in', 'on',
    'at', 'to', 'for', 'of', 'and', 'or', 'with', 'from', 'by', 'as', 'it'
  ]);

  const rawKeywords = qLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Intent A: High-level Summary / Overview / What is this document about?
  if (
    qLower.includes('summar') ||
    qLower.includes('overview') ||
    qLower.includes('what is this document') ||
    qLower.includes('what is this book') ||
    qLower.includes('what is this presentation') ||
    qLower.includes('what is this file') ||
    qLower.includes('main point') ||
    qLower.includes('about?') ||
    rawKeywords.length === 0
  ) {
    let response = `### Overview of "${title}"\n\n`;

    if (doc.summary) {
      response += `${doc.summary}\n\n`;
    } else {
      const firstSection = extractFirstMeaningfulSection(content);
      response += `${firstSection}\n\n`;
    }

    if (doc.keyPoints && doc.keyPoints.length > 0) {
      response += `**Key Highlights & Takeaways:**\n`;
      doc.keyPoints.forEach((kp) => {
        response += `• ${kp}\n`;
      });
      response += `\n`;
    }

    response += `**Document Details:**\n`;
    response += `• **Format:** ${doc.fileType.toUpperCase()}\n`;
    response += `• **Word Count:** ${doc.wordCount?.toLocaleString() || 'N/A'} words\n`;
    response += `• **Estimated Reading Time:** ${doc.readingTimeMinutes || 1} min\n\n`;
    response += `Feel free to ask specific questions about any chapter, character, technical component, or concept mentioned in this document!`;

    return response;
  }

  // Intent B: Key Takeaways, Action Items, Recommendations
  if (
    qLower.includes('action') ||
    qLower.includes('recommend') ||
    qLower.includes('takeaway') ||
    qLower.includes('next step') ||
    qLower.includes('conclusion')
  ) {
    const listItems = extractBulletPoints(content);
    if (listItems.length > 0) {
      let resp = `### Key Points & Action Items from "${title}":\n\n`;
      listItems.slice(0, 6).forEach((item, i) => {
        resp += `${i + 1}. ${item}\n`;
      });
      return resp;
    }
  }

  // Intent C: Search for Relevant Passages (Paragraphs / Sections)
  const passages = extractPassages(content);
  const scored = passages
    .map((p) => {
      let score = 0;
      const pLower = p.text.toLowerCase();
      const hLower = (p.sectionHeader || '').toLowerCase();

      rawKeywords.forEach((kw) => {
        // Keyword matches in paragraph text
        const count = (pLower.match(new RegExp(`\\b${escapeRegExp(kw)}`, 'g')) || []).length;
        score += count * 3;

        // Keyword matches in header (higher weight)
        if (hLower.includes(kw)) {
          score += 10;
        }
      });

      // Bonus if exact phrase matches
      if (rawKeywords.length > 1) {
        const queryPhrase = rawKeywords.join(' ');
        if (pLower.includes(queryPhrase)) score += 15;
      }

      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const best = scored[0];
    const topPassages = scored.slice(0, 3);

    let answer = `Based on **"${title}"**`;
    if (best.sectionHeader) {
      answer += ` *(Section: ${best.sectionHeader})*`;
    }
    answer += `:\n\n`;

    // Direct grounded excerpt
    const cleanExcerpt = cleanPassageText(best.text);
    answer += `> "${cleanExcerpt.slice(0, 320)}${cleanExcerpt.length > 320 ? '...' : ''}"\n\n`;

    // Synthesized context explanation
    answer += `**Key Insight:**\n`;
    answer += `The document directly addresses your question regarding **${rawKeywords.join(', ')}**. `;
    if (topPassages.length > 1) {
      const secondExcerpt = cleanPassageText(topPassages[1].text);
      answer += `Furthermore, it notes:\n\n`;
      answer += `> "${secondExcerpt.slice(0, 240)}${secondExcerpt.length > 240 ? '...' : ''}"\n\n`;
    }

    answer += `Would you like me to elaborate further on this topic or cite related sections?`;
    return answer;
  }

  // Fallback: If no exact keyword match, explain document scope
  const headings = extractHeadings(content);
  let fallback = `I searched **"${title}"** for your query regarding "${question}", but did not find an explicit direct mention.\n\n`;
  if (headings.length > 0) {
    fallback += `**This document specifically covers the following sections:**\n`;
    headings.slice(0, 6).forEach((h) => {
      fallback += `• ${h}\n`;
    });
    fallback += `\nTry asking a question related to one of these sections!`;
  } else {
    fallback += `You can ask me to summarize the document, list key findings, or explain specific details from the text.`;
  }

  return fallback;
}

/**
 * Answers questions across the entire document library
 */
function answerMultiDocument(question: string, qLower: string, allDocs: Document[]): string {
  const stopWords = new Set(['what', 'is', 'are', 'the', 'a', 'in', 'of', 'and', 'to', 'for', 'about']);
  const keywords = qLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const matchingDocs = allDocs.filter((d) => {
    const text = (d.title + ' ' + (d.summary || '') + ' ' + d.content.slice(0, 1000)).toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });

  if (matchingDocs.length > 0) {
    let resp = `I found relevant information across **${matchingDocs.length} document${
      matchingDocs.length > 1 ? 's' : ''
    }** in your library:\n\n`;

    matchingDocs.slice(0, 4).forEach((d, idx) => {
      resp += `### ${idx + 1}. ${d.title} (${d.fileType.toUpperCase()})\n`;
      if (d.summary) {
        resp += `${d.summary}\n\n`;
      } else {
        resp += `${d.content.slice(0, 180)}...\n\n`;
      }
    });

    resp += `You can click into any of these documents to read them or have an in-depth conversation with their full contents.`;
    return resp;
  }

  return `Your library contains **${allDocs.length} documents**:\n\n${allDocs
    .slice(0, 5)
    .map((d) => `• **${d.title}** (${d.fileType.toUpperCase()})`)
    .join('\n')}\n\nYou can ask about any of these documents, or open a specific document to explore it in depth!`;
}

// --- Helper Functions ---

interface Passage {
  text: string;
  sectionHeader?: string;
}

function extractPassages(content: string): Passage[] {
  const lines = content.split('\n');
  const passages: Passage[] = [];
  let currentHeader = '';
  let currentParagraph = '';

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (currentParagraph.trim()) {
        passages.push({ text: currentParagraph.trim(), sectionHeader: currentHeader });
        currentParagraph = '';
      }
      currentHeader = line.replace(/^#+\s*/, '').trim();
    } else if (line.trim() === '') {
      if (currentParagraph.trim()) {
        passages.push({ text: currentParagraph.trim(), sectionHeader: currentHeader });
        currentParagraph = '';
      }
    } else {
      currentParagraph += (currentParagraph ? ' ' : '') + line.trim();
    }
  }

  if (currentParagraph.trim()) {
    passages.push({ text: currentParagraph.trim(), sectionHeader: currentHeader });
  }

  return passages;
}

function extractHeadings(content: string): string[] {
  const matches = content.match(/^#{1,3}\s+(.+)$/gm) || [];
  return matches.map((m) => m.replace(/^#{1,3}\s+/, '').trim()).filter(Boolean);
}

function extractBulletPoints(content: string): string[] {
  const lines = content.split('\n').map((l) => l.trim());
  const bullets = lines.filter((l) => /^[•\-\*\d\.]\s+/.test(l));
  return bullets.map((l) => l.replace(/^[•\-\*\d\.]\s+/, '').trim()).filter((l) => l.length > 15);
}

function extractFirstMeaningfulSection(content: string): string {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[#*`_]/g, '').trim())
    .filter((p) => p.length > 50);

  return paragraphs[0] || content.slice(0, 300);
}

function cleanPassageText(text: string): string {
  return text.replace(/[#*`_]/g, '').replace(/\s+/g, ' ').trim();
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

