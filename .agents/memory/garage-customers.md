---
name: GarageManager customers feature
description: Customer-centric view — records list replaced with customer list; visitCount auto-computed; customer detail drill-down.
---

## What was built
- `GET /api/customers` — groups records by firstName+lastName, returns visitCount (count) and lastVisit; supports `search`, `date`, `deviceId` query params.
- `GET /api/customers/records?firstName=&lastName=&date=&deviceId=` — all records for one customer, sorted entryDate DESC.
- `POST /api/records` — visitCount now auto-computed (count of existing records with same firstName+lastName for the device group) and cannot be overridden from the body.
- `PUT /api/records/:id` — visitCount field is ignored; it cannot be manually edited.

## Frontend
- `/records` page (`pages/records/list.tsx`) now shows customer list (grouped), not individual records.
- `/customers/records?first=X&last=Y` (`pages/customers/detail.tsx`) shows all records for one customer, newest first, with optional date filter.
- visitCount field removed from the repair-order form UI for new records; shown as read-only badge in edit mode.
- Two buttons: "Add Repair Order" and "Add Customer" — both navigate to `/records/new`.

**Why:**
- Customers are not a separate table — they are implicitly identified by firstName+lastName within the records table.
- visitCount stored per-record represents the visit sequence number at creation time; the customer list shows the dynamic total count.

**How to apply:**
- Never add a manual visitCount input to the create form; the server computes it.
- When fetching for a specific customer, always pass both firstName and lastName as exact-match params.
- Custom fetch hooks for `/api/customers` use `fetch` directly with `Authorization: Bearer ${session.token}` header; not from the generated api-client-react hooks.
