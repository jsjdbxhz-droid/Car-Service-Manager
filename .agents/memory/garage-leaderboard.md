---
name: GarageManager leaderboard
description: Top-10 leaderboard feature — API, DB column, frontend card, privacy toggle
---

## Schema
- `users.hide_from_leaderboard` — boolean, default false; added via drizzle push

## API endpoints
- `GET /api/leaderboard` — requireAuth; LEFT JOINs records + invoices, groups by userId, excludes hidden users, returns top 10 sorted by (recordCount + invoiceCount) DESC. Returns: `{ userId, username, recordCount, invoiceCount, customerCount }[]`
- `PUT /api/leaderboard/privacy` — requireAuth; body `{ hidden: boolean }`; updates current user's hideFromLeaderboard

## Frontend
- `artifacts/garage-app/src/components/leaderboard-card.tsx` — collapsible card; collapse state persisted in localStorage key `leaderboard_collapsed`; medals 🥇🥈🥉 for top 3; "أنت" badge on current user row (matched by `String(row.userId) === session?.userId`)
- Dashboard: `LeaderboardCard` inserted above the recent-records section
- Settings: privacy toggle card reads `hideFromLeaderboard` from `GET /api/auth/me` (field added to that response); PUT /api/leaderboard/privacy to toggle

**Why:** `session.userId` is a string but leaderboard rows return `userId: number` — always compare with `String(row.userId)`.
