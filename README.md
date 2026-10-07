# OpenAnything

A universal file viewer and file manager that runs as a web app (PWA) and a desktop app (Windows, macOS, Linux) from one shared React + TypeScript codebase, backed by Supabase.

## Overview
OpenAnything allows you to view and manage your files securely across devices. It features:
- **Universal Viewing**: Support for PDF, DOCX, EPUB, Spreadsheets, Markdown, and more.
- **Guest Mode**: Open local files instantly without an account, processing entirely locally.
- **Cloud Sync**: Save files securely to your account for cross-device access.
- **Cross-Platform**: Run as a modern web app, an offline-capable PWA, or a native desktop app.

## Architecture

```mermaid
graph TD
    A[Web App / PWA (apps/web)] --> C[Shared UI & Logic (packages/app)]
    B[Desktop App (apps/desktop)] --> C
    C --> D[Supabase Backend]
    C --> E[Platform Adapters (Web / Electron)]
```

- **Monorepo**: Powered by `pnpm` workspaces and Turborepo.
- **Shared App (`packages/app`)**: Contains 95% of the codebase (React, Zustand, TanStack Query, Tailwind).
- **Apps**: `apps/web` (Vite shell) and `apps/desktop` (Electron shell) simply consume the shared app and inject platform-specific capabilities.
- **Backend**: Supabase provides Auth, Database (Postgres), Storage, and Row Level Security.
- **API (`apps/api`)**: A minimal Node.js service for elevated operations (account deletion, trash purge) using the Supabase Service Role key.

## Prerequisites
- Node.js (>= 18)
- pnpm (>= 8)
- A Supabase Project (for backend features)

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in the required keys:
   ```bash
   cp .env.example .env
   ```

3. **Supabase Database**:
   Apply migrations to your Supabase project (from `supabase/migrations/`).
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

## Development Commands

Run all apps in development mode:
```bash
pnpm run dev
```
*(Note: Until individual apps are scaffolded, this command will simply succeed with 0 tasks executed.)*

Other workspace commands:
- **Linting**: `pnpm run lint`
- **Typechecking**: `pnpm run typecheck`
- **Testing**: `pnpm run test`

## Build & Deploy

- **Web Build**:
  ```bash
  pnpm --filter web build
  ```
- **Desktop Build (Electron)**:
  ```bash
  pnpm --filter desktop build
  ```
- **API Build**:
  ```bash
  pnpm --filter api build
  ```

## Testing
- Unit & Integration: `pnpm run test`
- E2E (Playwright): `pnpm run test:e2e`

## Security
For full details on the security model (Electron IPC, Supabase RLS, upload sanitization), refer to `docs/SECURITY.md`.
