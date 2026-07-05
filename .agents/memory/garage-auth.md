---
name: GarageManager auth model
description: Auth token design, admin assignment, and security decisions for the GarageManager app.
---

## Auth token
Token format: `${userId}.${hmacSHA256(userId, SESSION_SECRET)}` — signed in `artifacts/api-server/src/lib/token.ts`.
Stored in localStorage key `garage_auth` as JSON `{ userId, token, username, role, deviceId }`.
Frontend sends `Authorization: Bearer <token>` on every request.

**Why:** Plain userId token (original approach) is trivially forgeable. HMAC prevents impersonation without requiring a session store.

**How to apply:** Any new route that needs auth calls `requireAuth` middleware. Token verification is centralized in `lib/token.ts` — never call `parseInt(token)` directly.

## Admin role
Username "زكرياء" (or "zakariyaa"/"zakariya") → role "admin" on registration. Admin list-users response masks loginCode as "***".

**Why:** Per user requirement: admin is always "زكرياء". Masking loginCode prevents admins from impersonating users.

## IDOR protection
GET /records/:id and GET /invoices/:id scope query by `req.userId` — not just by record ID.
Admin routes use `requireAdmin` middleware which chains `requireAuth` first.
