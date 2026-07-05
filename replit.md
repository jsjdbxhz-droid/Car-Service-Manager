# GarageManager

A full-stack garage management app for recording vehicle service invoices and tracking customers. Supports Arabic, English, and French with RTL layout for Arabic.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (`artifacts/garage-app`)
- **Backend**: Express.js + Drizzle ORM (`artifacts/api-server`)
- **Database**: PostgreSQL (`lib/db`)
- **Auth**: HMAC-signed tokens (SESSION_SECRET)
- **Shared libs**: `lib/api-zod`, `lib/api-client-react`, `lib/api-spec`

## Running the project

Both workflows start automatically:
- **Garage Manager** (frontend) — `pnpm --filter @workspace/garage-app run dev`
- **API Server** (backend) — `pnpm --filter @workspace/api-server run dev`

## Database

Schema is in `lib/db/src/schema/`. To push schema changes:
```
pnpm --filter @workspace/db run push
```

Requires `DATABASE_URL` environment variable (already configured).

## Auth & Roles

- **owner**: First-ever registration with username "زكرياء" / "zakariyaa" / "zakariya". Only works once — if an owner already exists, subsequent registrations with that name get `user` role.
- **admin**: Assigned manually by the owner in the admin panel.
- **user**: All other registrations.

Users log in with a unique auto-generated login code shown at registration.

## User Preferences

- Keep Arabic as the primary language in UI text examples
- Maintain RTL support for Arabic throughout
