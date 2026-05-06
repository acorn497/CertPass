# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Coding Voca** — A Korean coding vocabulary web app for beginners (초등 고학년~중학생). Explains programming English words with Korean pronunciation, everyday meaning, and coding meaning side-by-side.

## Commands

### Client (React + Vite, port 5173)
```bash
cd client && npm run dev       # Start dev server
cd client && npm run build     # Production build
cd client && npm run lint      # ESLint
```

### Server (Express + TypeScript, port 3000)
```bash
cd server && npm run dev       # Start dev server (tsx watch)
cd server && npm run build     # tsc compile
```

### Database (Prisma)
```bash
cd server && npx prisma migrate dev --name <name>   # New migration
cd server && npx prisma db seed                      # Run seed (56 words)
cd server && npx prisma studio                       # Browse DB
```

## Architecture

Monorepo with two independent packages: `client/` and `server/`. No shared package.json at root.

### Backend (`server/src/`)
Layered architecture: `routes/` → `controllers/` → `services/` → Prisma ORM → PostgreSQL

- `routes/public/` — unauthenticated endpoints (`/api/words`, `/api/categories`, `/api/languages`)
- `routes/admin/` — JWT-protected endpoints (`/api/admin/*`)
- `middleware/auth.ts` — JWT verification for admin routes
- `middleware/validate.ts` — Zod request validation
- `middleware/errorHandler.ts` — Standardized error responses
- `prisma/schema.prisma` — 6 models: Category, Word, ProgrammingLanguage, WordLanguage, RelatedWord, Admin
- `prisma/seed.ts` — 56 words across 5 categories + 5 programming languages

### Frontend (`client/src/`)
- `api/client.ts` — Axios instance with `/api` base URL (proxied to port 3000 via `vite.config.ts`)
- `api/*.ts` — API call functions per resource
- `components/` — Shared UI components (WordCard, SearchBar, CodeBlock, MeaningComparison, CategoryBadge)
- `pages/` — Public learner pages (Home, WordList, WordDetail, Category, Language, About)
- `admin/` — Admin pages (Login, Dashboard, WordManage, CategoryManage, LanguageManage)
- `context/AuthContext.tsx` — JWT auth state; token stored in localStorage
- Styling: Vanilla CSS with design tokens (no CSS framework)

### Key Relationships
- `words` has many-to-many with `programming_languages` via `word_languages` join table
- `words` has self-referential many-to-many via `related_words`
- `words` belongs to one `category`
- `difficulty` values: `beginner` | `intermediate` | `advanced`

### Environment Variables (`server/.env`)
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
```

### Vite Proxy
`client/vite.config.ts` proxies `/api` → `http://localhost:3000` so the frontend can call `/api/words` directly.

## Implementation Status

The project follows an 8-phase plan in `docs/07-implementation-checklist.md`. Currently at Phase 1 (client initialized as default Vite template; server not yet created). Design docs in `docs/` are the source of truth for API contracts, DB schema, and UI layout.

## API Error Format

```json
{ "error": { "code": "WORD_NOT_FOUND", "message": "...", "status": 404 } }
```

Error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `DUPLICATE` (409), `SERVER_ERROR` (500)
