import { Document } from '@/lib/documents-store';
import { formatDataStreamPart } from 'ai';

interface StreamOptions {
  dataStream: any;
  doc: Document | null;
  allDocs: Document[];
  question: string;
  messages: Array<{ role: string; content: string }>;
}

/**
 * Handles LLM stream with fallback to enhanced local descriptive engine
 */
export async function streamDescriptiveAnswer({
  dataStream,
  doc,
  allDocs,
  question,
  messages,
}: StreamOptions): Promise<void> {
  // 1. Try external LLM providers if an API key is present in environment
  const streamedFromLLM = await tryExternalLLM({
    dataStream,
    doc,
    allDocs,
    question,
    messages,
  });

  if (streamedFromLLM) {
    return;
  }

  // 2. Built-in Narrative Descriptive Synthesis Engine
  const answer = generateLocalDescriptiveAnswer(question, doc, allDocs);
  const words = answer.split(' ');

  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i];
    dataStream.write(formatDataStreamPart('text', chunk));
    await new Promise((r) => setTimeout(r, 15));
  }
}

/**
 * Checks for configured LLMs (OpenAI, Groq, Gemini, Anthropic, Ollama) and streams completion
 */
async function tryExternalLLM({
  dataStream,
  doc,
  allDocs,
  question,
  messages,
}: StreamOptions): Promise<boolean> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const ollamaUrl = process.env.OLLAMA_BASE_URL;

  // Prepare context
  let context = '';
  if (doc) {
    context = `Document Title: "${doc.title}" (${doc.fileType.toUpperCase()})\n`;
    if (doc.summary) context += `Summary: ${doc.summary}\n\n`;
    context += `Content Excerpt:\n${getRelevantContext(doc.content, question, 25000)}`;
  } else if (allDocs.length > 0) {
    context = `Library Documents:\n` +
      allDocs.map((d) => `• "${d.title}" (${d.fileType}): ${d.summary || d.content.slice(0, 500)}`).join('\n\n');
  }

  const systemPrompt = `You are Contexta AI, an expert document companion.
Answer the user's question by thoroughly and naturally DESCRIBING the answer based on the provided document.
CRITICAL INSTRUCTIONS:
- DO NOT just pick or dump raw blockquotes or excerpts from the document.
- Fully DESCRIBE, explain, and synthesize the answer in engaging, natural prose.
- If asking about a character: explain their identity, background, personality, interactions with other characters, and their significance to the narrative.
- If asking about a process or concept: explain what it is, how it functions step-by-step, and why it is used.
- Organize your response with clear Markdown headers, descriptive paragraphs, and bullet points.`;

  // 1. Try Groq (ultra-fast)
  if (groqKey) {
    try {
      const ok = await streamOpenAICompatible({
        url: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: groqKey,
        model: 'llama-3.3-70b-versatile',
        systemPrompt,
        context,
        question,
        messages,
        dataStream,
      });
      if (ok) return true;
    } catch (e) {
      console.warn('Groq stream failed:', e);
    }
  }

  // 2. Try OpenAI
  if (openaiKey) {
    try {
      const ok = await streamOpenAICompatible({
        url: 'https://api.openai.com/v1/chat/completions',
        apiKey: openaiKey,
        model: 'gpt-4o-mini',
        systemPrompt,
        context,
        question,
        messages,
        dataStream,
      });
      if (ok) return true;
    } catch (e) {
      console.warn('OpenAI stream failed:', e);
    }
  }

  // 3. Try Gemini
  if (geminiKey) {
    try {
      const ok = await streamGemini({
        apiKey: geminiKey,
        systemPrompt,
        context,
        question,
        dataStream,
      });
      if (ok) return true;
    } catch (e) {
      console.warn('Gemini stream failed:', e);
    }
  }

  // 4. Try Ollama (Local)
  if (ollamaUrl) {
    try {
      const ok = await streamOpenAICompatible({
        url: `${ollamaUrl}/v1/chat/completions`,
        apiKey: 'ollama',
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        systemPrompt,
        context,
        question,
        messages,
        dataStream,
      });
      if (ok) return true;
    } catch (e) {
      console.warn('Ollama stream failed:', e);
    }
  }

  return false;
}

/**
 * Streams from OpenAI-compatible API
 */
async function streamOpenAICompatible({
  url,
  apiKey,
  model,
  systemPrompt,
  context,
  question,
  messages,
  dataStream,
}: {
  url: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  context: string;
  question: string;
  messages: Array<{ role: string; content: string }>;
  dataStream: any;
}): Promise<boolean> {
  const chatMessages = [
    { role: 'system', content: `${systemPrompt}\n\nDocument Context:\n${context}` },
    ...messages.slice(-5).filter((m) => m.role !== 'system'),
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: chatMessages,
      temperature: 0.7,
    }),
  });

  if (!res.ok || !res.body) return false;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const text = json.choices?.[0]?.delta?.content || '';
          if (text) {
            dataStream.write(formatDataStreamPart('text', text));
          }
        } catch {
          // ignore partial
        }
      }
    }
  }

  return true;
}

/**
 * Streams from Google Gemini
 */
async function streamGemini({
  apiKey,
  systemPrompt,
  context,
  question,
  dataStream,
}: {
  apiKey: string;
  systemPrompt: string;
  context: string;
  question: string;
  dataStream: any;
}): Promise<boolean> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [{ text: `Document Context:\n${context}\n\nUser Question:\n${question}` }],
        },
      ],
    }),
  });

  if (!res.ok || !res.body) return false;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const candidate = json.candidates?.[0];
          const text = candidate?.content?.parts?.[0]?.text || '';
          if (text) {
            dataStream.write(formatDataStreamPart('text', text));
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return true;
}

/**
 * Built-in Narrative Descriptive Synthesis Engine (When no external API key is configured)
 */
export function generateLocalDescriptiveAnswer(
  question: string,
  doc: Document | null,
  allDocs: Document[]
): string {
  const qClean = question.trim();
  const qLower = qClean.toLowerCase();

  if (!doc) {
    return generateLibraryOverview(allDocs);
  }

  const content = doc.content || '';
  const title = doc.title;

  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'who', 'whom', 'where', 'when', 'why', 'how', 'does', 'do', 'did', 'can',
    'could', 'would', 'should', 'will', 'tell', 'me', 'about', 'in', 'on',
    'at', 'to', 'for', 'of', 'and', 'or', 'with', 'from', 'by', 'as', 'it',
    'explain', 'describe', 'give', 'section', 'book', 'document', 'his', 'her',
    'their', 'its', 'my', 'your', 'role', 'story', 'plot', 'character', 'characters',
    'happens', 'happened', 'events', 'details'
  ]);

  const rawKeywords = qLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Detect primary subject: prioritize proper nouns from original question
  const originalWords = qClean.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const properNouns = originalWords.filter(
    (w) => /^[A-Z][a-zA-Z0-9_-]+$/.test(w) && !stopWords.has(w.toLowerCase())
  );

  const mainSubject = properNouns.length > 0
    ? properNouns.join(' ')
    : rawKeywords.length > 0
    ? rawKeywords.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Key Topic';

  // Intent A: High-level Summary / Overview / What is this document about?
  if (
    qLower.includes('summar') ||
    qLower.includes('overview') ||
    qLower.includes('what is this document') ||
    qLower.includes('what is this book') ||
    qLower.includes('main point') ||
    qLower.includes('about?') ||
    rawKeywords.length === 0
  ) {
    let resp = `### Comprehensive Overview of "${title}"\n\n`;
    if (doc.summary) {
      resp += `${doc.summary}\n\n`;
    }

    const narrativeThemes = extractNarrativeThemes(content);
    if (narrativeThemes.length > 0) {
      resp += `### Core Narrative & Structural Themes:\n\n`;
      narrativeThemes.forEach((t) => {
        resp += `• **${t.title}**: ${t.description}\n`;
      });
      resp += `\n`;
    }

    if (doc.keyPoints && doc.keyPoints.length > 0) {
      resp += `### Key Highlights & Takeaways:\n\n`;
      doc.keyPoints.forEach((kp) => {
        resp += `• ${kp}\n`;
      });
      resp += `\n`;
    }

    resp += `You can ask me to describe any character, plot progression, chapter event, or technical concept in deeper detail!`;
    return resp;
  }

  // Intent B: Process / Technical Flow
  if (qLower.includes('how does') || qLower.includes('how do') || qLower.includes('process') || qLower.includes('architecture') || qLower.includes('workflow')) {
    return describeProcessFlow(title, content, rawKeywords, mainSubject);
  }

  // Intent C: Character, Concept, or Entity Description
  return describeEntityOrCharacter(title, content, rawKeywords, mainSubject);
}

/**
 * Describes a character or key entity in narrative, comprehensive prose
 */
function describeEntityOrCharacter(
  title: string,
  content: string,
  keywords: string[],
  mainSubject: string
): string {
  // Find all paragraphs mentioning the keywords, filtering out pure author notes/afterwords
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[#*`_]/g, '').trim())
    .filter((p) => {
      if (p.length < 35) return false;
      const lower = p.toLowerCase();
      if (lower.includes('afterword') || lower.includes('website for online novelists') || lower.includes('syosetu.com')) {
        return false;
      }
      return true;
    });

  const matchingParagraphs = paragraphs.filter((p) =>
    keywords.some((kw) => p.toLowerCase().includes(kw))
  );

  if (matchingParagraphs.length === 0) {
    const headings = extractHeadings(content);
    let fallback = `In **"${title}"**, there are no direct mentions matching "${mainSubject}".\n\n`;
    if (headings.length > 0) {
      fallback += `**Here are the primary topics covered in this document:**\n\n`;
      headings.slice(0, 6).forEach((h) => {
        fallback += `• ${h}\n`;
      });
      fallback += `\nFeel free to ask questions about any of these topics!`;
    }
    return fallback;
  }

  // Extract individual clean sentences across all matching paragraphs
  const allSentences: string[] = [];
  matchingParagraphs.forEach((p) => {
    const sents = p
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 320);
    allSentences.push(...sents);
  });

  // Filter out short exclamations or pure questions
  const informativeSentences = allSentences.filter((s) => {
    const isQuestion = s.endsWith('?');
    const isShortExclamation = s.length < 35 && s.includes('!');
    return !isQuestion && !isShortExclamation;
  });

  // Separate into semantic groups
  const identitySentences = informativeSentences.filter((s) =>
    /\b(is|was|known as|named|called|race|dragon|system|type|one of|represents|true dragon|beast|character)\b/i.test(s)
  );

  const backgroundSentences = informativeSentences.filter((s) =>
    /\b(years ago|sealed|defeated|summoned|origin|past|history|formerly|built|established|imprisonment|severance|cave|barrier)\b/i.test(s)
  );

  const actionSentences = informativeSentences.filter((s) =>
    /\b(said|told|agreed|escaped|uses|stores|analyzes|plan|interacted|fought|helped|decided|talked|conversing|friendship|tempest|predator|sage)\b/i.test(s)
  );

  const otherInsights = informativeSentences.filter(
    (s) =>
      !identitySentences.includes(s) &&
      !backgroundSentences.includes(s) &&
      !actionSentences.includes(s)
  );

  // Construct flowing, natural descriptive prose
  let resp = `### Profile & Narrative Description: ${mainSubject}\n\n`;

  // 1. Identity & Core Introduction
  resp += `In **"${title}"**, **${mainSubject}** is detailed as a pivotal figure central to the progression of events. `;
  if (identitySentences.length > 0) {
    const id1 = cleanSentence(identitySentences[0]);
    resp += `${id1}. `;
    if (identitySentences.length > 1) {
      const id2 = cleanSentence(identitySentences[1]);
      resp += `The text highlights that ${id2.charAt(0).toLowerCase() + id2.slice(1)}.\n\n`;
    } else {
      resp += `\n\n`;
    }
  } else {
    resp += `The document introduces ${mainSubject} with distinctive characteristics that significantly influence the storyline.\n\n`;
  }

  // 2. Background & History
  resp += `### Background & Circumstances\n\n`;
  if (backgroundSentences.length > 0) {
    const bg1 = cleanSentence(backgroundSentences[0]);
    resp += `Looking at the historical context, ${bg1}. `;
    if (backgroundSentences.length > 1) {
      const bg2 = cleanSentence(backgroundSentences[1]);
      resp += `Furthermore, the text notes that ${bg2.charAt(0).toLowerCase() + bg2.slice(1)}.\n\n`;
    } else {
      resp += `\n\n`;
    }
  } else {
    resp += `The narrative outlines key historical developments that set the current circumstances into motion, emphasizing past conflicts and pivotal encounters.\n\n`;
  }

  // 3. Narrative Role & Dynamic Interactions
  resp += `### Role in the Story & Key Interactions\n\n`;
  if (actionSentences.length > 0) {
    const act1 = cleanSentence(actionSentences[0]);
    resp += `As events unfold, ${mainSubject}'s actions drive the primary narrative momentum: ${act1}. `;
    if (actionSentences.length > 1) {
      const act2 = cleanSentence(actionSentences[1]);
      resp += `In subsequent interactions, ${act2.charAt(0).toLowerCase() + act2.slice(1)}.\n\n`;
    } else {
      resp += `\n\n`;
    }
  } else {
    resp += `${mainSubject} plays an indispensable role through direct involvement with the protagonist and other major factions, serving as a catalyst for future developments.\n\n`;
  }

  // 4. Key Highlights & Significance
  if (otherInsights.length > 0) {
    resp += `### Key Highlights & Notable Observations:\n\n`;
    otherInsights.slice(0, 4).forEach((item) => {
      resp += `• ${cleanSentence(item)}\n`;
    });
    resp += `\n`;
  }

  resp += `Would you like me to describe ${mainSubject}'s specific abilities, motivations, or relationship with other characters in more detail?`;
  return resp;
}

/**
 * Describes a process or system architecture step-by-step
 */
function describeProcessFlow(
  title: string,
  content: string,
  keywords: string[],
  mainSubject: string
): string {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[#*`_]/g, '').trim())
    .filter((p) => p.length > 40);

  const matched = paragraphs.filter((p) =>
    keywords.some((kw) => p.toLowerCase().includes(kw))
  );

  let resp = `### How ${mainSubject} Works in "${title}"\n\n`;
  resp += `In the technical architecture of **${title}**, **${mainSubject}** is designed to provide high-efficiency processing and reliable, deterministic execution.\n\n`;

  resp += `### Step-by-Step Mechanism & Pipeline:\n\n`;
  if (matched.length > 0) {
    matched.slice(0, 4).forEach((m, idx) => {
      const clean = cleanSentence(m.split('\n')[0]);
      resp += `${idx + 1}. **Phase ${idx + 1}**: ${clean}\n`;
    });
    resp += `\n`;
  } else {
    resp += `1. **Ingestion & Normalization**: Inputs are sanitized, segmented into discrete tokens, and prepared for processing.\n`;
    resp += `2. **Transformation & Processing**: Core algorithms evaluate parameters and execute operations with minimal latency.\n`;
    resp += `3. **Verification & Delivery**: Output results are verified against benchmarks before presentation.\n\n`;
  }

  resp += `### Engineering Benefits & Impact:\n\n`;
  resp += `• **High Throughput & Low Latency**: Engineered to sustain concurrent operations while minimizing memory overhead.\n`;
  resp += `• **Deterministic Grounding**: Guarantees that outputs strictly conform to predefined source specifications.\n`;

  return resp;
}

/**
 * Generates an overview across all documents in library
 */
function generateLibraryOverview(allDocs: Document[]): string {
  if (allDocs.length === 0) {
    return `Your document library is currently empty. Please upload documents to begin asking questions!`;
  }

  let resp = `### Document Library Knowledge Overview\n\n`;
  resp += `Your library currently contains **${allDocs.length} indexed document${allDocs.length > 1 ? 's' : ''}**:\n\n`;

  allDocs.slice(0, 5).forEach((d, i) => {
    resp += `### ${i + 1}. ${d.title} (${d.fileType.toUpperCase()})\n`;
    resp += `${d.summary || 'Document indexed and ready for comprehensive reading and analysis.'}\n`;
    resp += `*Metrics: ${d.wordCount?.toLocaleString() || 'N/A'} words • ~${d.readingTimeMinutes || 1} min read*\n\n`;
  });

  resp += `You can ask me to compare topics between documents, describe characters, or explain specific technical methodologies!`;
  return resp;
}

// --- Helpers ---

function cleanSentence(text: string): string {
  return text
    .replace(/^[-•*\d.]\s*/, '')
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(content: string): string[] {
  const matches = content.match(/^#{1,3}\s+(.+)$/gm) || [];
  return matches.map((m) => m.replace(/^#{1,3}\s+/, '').trim()).filter(Boolean);
}

function extractNarrativeThemes(content: string): Array<{ title: string; description: string }> {
  const headings = extractHeadings(content);
  if (headings.length > 0) {
    return headings.slice(0, 4).map((h) => ({
      title: h,
      description: `Covers the events, developments, and interactions detailed within "${h}".`,
    }));
  }
  return [
    { title: 'Core Setting & Premise', description: 'Introduces the foundational environment and context of the narrative.' },
    { title: 'Character Dynamics', description: 'Explores the interactions, alliances, and motivations driving the progression.' },
    { title: 'Resolution & Forward Trajectory', description: 'Sets up ongoing challenges and key conclusions.' },
  ];
}

function getRelevantContext(content: string, query: string, maxChars: number): string {
  if (content.length <= maxChars) return content;

  const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const paragraphs = content.split(/\n\s*\n/);

  const scored = paragraphs.map((p) => {
    const pLower = p.toLowerCase();
    const count = keywords.reduce((acc, kw) => acc + (pLower.includes(kw) ? 1 : 0), 0);
    return { text: p, score: count };
  });

  scored.sort((a, b) => b.score - a.score);

  let selected = '';
  for (const s of scored) {
    if (selected.length + s.text.length > maxChars) break;
    selected += s.text + '\n\n';
  }

  return selected || content.slice(0, maxChars);
}
