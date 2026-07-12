---
name: GarageManager edit-secret
description: Edit-secret gate — protects record/invoice editing behind an optional PIN
---

## Schema
- `app_config.edit_code` — nullable text; null means feature disabled

## API endpoints
- `GET /api/config/edit-code-enabled` — **public**; returns `{ enabled: boolean }` only
- `POST /api/config/verify-edit-code` — requireAuth + separate rate-limit bucket (`isEditLimited`); body `{ code: string }`; 401 on wrong code
- `PUT /api/config/edit-code` — requireAdmin; body `{ code: string }`; empty string clears (disables)
- `GET /api/config` does NOT return editCode plaintext — only `editCodeEnabled: boolean`

## Rate limiters
Two separate `makeRateLimiter(10, 900_000)` instances — `isAccessLimited` (gateway) and `isEditLimited` (edit-code). Never share them.

## Frontend flow
1. Edit button calls `useEditSecret().requestEdit(path, navigate)`
2. Hook fetches `/api/config/edit-code-enabled` — if disabled, navigate directly; if enabled, open `EditSecretDialog`
3. Dialog calls `POST /verify-edit-code` with entered code
4. `EditCodeCard` in `admin.tsx` — owner UI to set/clear; shows masked current code (not fetched from server, kept local only after save)

**Why:** Original implementation sent empty-code to verify endpoint as probe, which returned 400 and always showed the dialog. Public probe endpoint fixes this without leaking the secret.
