# GarageManager — إدارة الورشة

تطبيق لإدارة ورش إصلاح السيارات: قوائم زبائن، فواتير قابلة للطباعة، حسابات متعددة بأكواد دخول، دعم عربي/إنجليزي/فرنسي.

## Run & Operate

- `pnpm --filter @workspace/garage-app run dev` — run the frontend (port from $PORT)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — secret key for HMAC token signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, wouter routing, i18n context (AR/EN/FR)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: HMAC-signed token (userId.hmac), stored in localStorage

## Where things live

- `artifacts/garage-app/src/` — React frontend
- `artifacts/garage-app/src/pages/` — page components
- `artifacts/garage-app/src/contexts/` — i18n context, auth context
- `artifacts/api-server/src/routes/` — Express route handlers (auth, records, invoices, admin, stats)
- `artifacts/api-server/src/lib/token.ts` — HMAC token sign/verify
- `lib/db/src/schema/` — Drizzle schema (users, records, invoices)
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Auth token: `userId.hmac(userId, SESSION_SECRET)` — unforgeable but stateless
- Admin role: auto-assigned when username is "زكرياء" on registration
- Device sharing: `deviceId` (UUID stored in localStorage) sent as query param to pull shared records across accounts on same device
- loginCode exposed only to the owning user (never in admin list — shown as "***")
- GET /records/:id and GET /invoices/:id scoped to req.userId (no IDOR)

## Special codes

- **Z2013** — enter on the landing page to access the download/install page
- **زكرياء** — username to get admin role (can view all accounts and their data)

## Render deployment

When deploying to Render:
- **Build Command:** `pnpm install && pnpm run build`
- **Start Command:** `node artifacts/api-server/dist/index.mjs`
- **Environment Variables to set in Render:**
  - `DATABASE_URL` — your PostgreSQL connection string (use Render PostgreSQL or Neon)
  - `SESSION_SECRET` — a long random secret string (e.g. 64 hex chars)
  - `NODE_ENV` — `production`
  - `PORT` — Render sets this automatically
  - `BASE_PATH` — `/` (for the frontend artifact)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before touching frontend code
- `pnpm run typecheck:libs` must run before leaf artifact typechecks if lib schemas changed
- Admin list-users masks loginCode as "***" — this is intentional security behavior
