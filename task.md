# Contexta Task Tracker

## Phase 0 - Setup
- [x] Create task.md
- [x] Scaffold Next.js app (App Router, TS, Tailwind, shadcn/ui init)
- [x] Scaffold /server Express TS project with exact folder structure
- [x] Configure tsconfigs, eslint, prettier, scripts
- [x] Create .env.example for root and /server

## Phase 1 - Database
- [x] Write schema.prisma (Added Document and DocumentChunk with vector)
- [x] Enable pgvector (Enabled in schema via postgresqlExtensions)
- [ ] Run initial migration (Blocked: needs Neon DB URL)
- [ ] Add HNSW index migration (Blocked: needs initial migration)
- [x] Set up Prisma client singleton
- [x] Write seed/health-check script for vector insert and cosine query

## Phase 2 - Server Foundation
- [ ] Env config
- [ ] app.ts / server.ts
- [ ] OpenAI client
- [ ] Auth middleware (Clerk JWT)
- [ ] Error handler
- [ ] Health route

## Phase 3 - Ingestion Pipeline
- [ ] Parsers (unpdf, mammoth)
- [ ] Chunker (with unit tests)
- [ ] Embeddings util (batching + retry)
- [ ] Uploadthing storage
- [ ] ingestion.service
- [ ] Documents routes (POST upload, GET list, GET one, DELETE)

## Phase 4 - Retrieval + QA
- [ ] vector-search.ts
- [ ] retrieval.service
- [ ] prompts.ts
- [ ] Chat route with streaming (single-doc and library-wide)

## Phase 5 - Summarization
- [ ] summary.service (single + multi-doc, map-reduce)
- [ ] Summaries routes

## Phase 6 - Frontend
- [x] Clerk auth pages
- [x] (root) layout with sidebar/header
- [x] Dashboard
- [x] Document Library (upload dropzone, list, delete)
- [x] Document detail page (viewer + chat + summary)
- [x] Library-wide chat page
- [x] Multi-doc summaries page
- [x] app/api/chat/route.ts proxy
- [x] lib/api client
- [x] hooks, loading/error/empty states

## Phase 7 - Hardening
- [ ] Rate limiting
- [ ] Upload limits
- [ ] Logging
- [ ] Tests for chunker/retrieval
- [ ] README with setup and deployment notes
