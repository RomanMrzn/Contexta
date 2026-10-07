# Contexta Task Tracker

## Phase 0 - Setup
- [x] Create task.md
- [x] Scaffold Next.js app (App Router, TS, Tailwind, shadcn/ui init)
- [x] Scaffold /server Express TS project with exact folder structure
- [x] Configure tsconfigs, eslint, prettier, scripts
- [x] Create .env.example for root and /server

## Phase 1 - Database
- [ ] Write schema.prisma
- [ ] Enable pgvector
- [ ] Run initial migration
- [ ] Add HNSW index migration
- [ ] Set up Prisma client singleton
- [ ] Write seed/health-check script for vector insert and cosine query

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
- [ ] Clerk auth pages
- [ ] (root) layout with sidebar/header
- [ ] Dashboard
- [ ] Document Library (upload dropzone, list, delete)
- [ ] Document detail page (viewer + chat + summary)
- [ ] Library-wide chat page
- [ ] Multi-doc summaries page
- [ ] app/api/chat/route.ts proxy
- [ ] lib/api client
- [ ] hooks, loading/error/empty states

## Phase 7 - Hardening
- [ ] Rate limiting
- [ ] Upload limits
- [ ] Logging
- [ ] Tests for chunker/retrieval
- [ ] README with setup and deployment notes
