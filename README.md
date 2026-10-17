# Contexta 📚✨

**Contexta** is a document intelligence and knowledge management platform designed for reading, organizing, and querying complex documents, research papers, light novels, and books.

Built with **Next.js 16 (App Router & Turbopack)**, **Clerk Authentication**, and the **Vercel AI SDK**, Contexta pairs an immersive dark-mode reader with deep semantic retrieval, volume-ordered series organization, and narrative AI question-answering.

---

## 🌟 Key Features

### 1. 🗂️ Library, Series & Folders
- **Multi-Document Collections**: Group related books, light novels, lecture notes, or research papers into organized Series and Folders.
- **Volume & Chapter Ordering**: Assign explicit volume numbers (e.g., `Vol. 1`, `Vol. 2`) or chronological order to books in a series.
- **Aggregated Analytics**: Real-time roll-ups of total books, cumulative word count, and estimated reading time across each collection.
- **Category Tags & Accent Themes**: Color-code series (Indigo, Violet, Emerald, Amber, Rose, Cyan, Blue) and categorize by *Light Novel / Fiction*, *Research Papers*, *Textbooks & Study*, *Technical Docs*, *Work & Business*, or *Personal Archive*.
- **Safe Folder Deletion**: Deleting a folder unassigns the member books cleanly back to your standalone library without deleting the underlying documents.

### 2. 📖 Universal Document Ingestion & Reader
- **Multi-Format Support**:
  - **PDFs**: Full text parsing and integrated PDF preview.
  - **EPUB eBooks**: Multi-chapter extraction and eBook reading.
  - **Word Documents**: `.docx` and `.doc` parsing with formatting preservation.
  - **PowerPoint**: `.pptx` and `.ppt` slide-by-slide structure detection.
  - **Markdown & Plain Text**: Native rendering with syntax highlighting.
  - **Data Files**: CSV and JSON tabular previews.
- **Interactive Reader**:
  - Focus mode & adjustable typography (Sans, Serif, Monospace, variable font size).
  - In-document text search with live match navigation.
  - Real-time reading progress indicator.
  - Auto-generated key points, executive summaries, and reading time estimates.

### 3. 💬 Grounded AI Question Answering & Synthesis
- **Series-Grounded Chat**: Ask questions strictly scoped to a specific series or folder (e.g., asking about plot developments across Volumes 1–3 of a novel).
- **Document-Specific Chat**: Chat directly alongside any open document with instant context grounding.
- **Global Library Chat**: Cross-document query synthesis and knowledge discovery across your entire personal library.
- **Descriptive Narrative Answers**: Generates rich, explanatory, step-by-step answers that synthesize insights rather than simply regurgitating raw text chunks.
- **Chat Management**: Clear full conversation history or remove individual messages with confirmation modals.

### 4. 🔒 Single-Account Isolation & Security
- **Clerk Authentication**: Seamless, secure authentication.
- **Strict Data Scoping**: All documents, series, and chat histories are strictly isolated to the authenticated user ID (`auth.userId`).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (Node.js 20+ recommended)
- **npm**, **pnpm**, or **yarn**

### Environment Configuration
Create a `.env` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# AI / LLM Integration (Optional fallback or external service)
GEMINI_API_KEY=AIzaSy...
# or OPENAI_API_KEY=sk-...
```

### Installation & Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in your browser
# Visit http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16.4 (App Router, Turbopack, React 19) |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **AI / Streaming** | Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`) |
| **Styling & UI** | Tailwind CSS, Lucide React Icons |
| **Parsers** | `pdf-parse`, `unpdf`, `mammoth`, `epub2`, `jszip` |
| **Data Layer** | Server-side user-isolated storage engine with local caching |

---

## 📄 License
MIT License. Built with ❤️ for document intelligence.
