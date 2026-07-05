---
name: GarageManager i18n
description: Multi-language (AR/EN/FR) implementation details for GarageManager.
---

## Implementation
React context at `artifacts/garage-app/src/contexts/i18n-context.tsx`.
Translations object keyed by language code (ar/en/fr).
Language stored in localStorage key `garage_lang`.

**Why:** User requirement for Arabic/English/French with Arabic as default. RTL layout for Arabic.

**How to apply:** All UI strings go through `const { t } = useI18n()`. When adding new strings, add to all three language keys. Set `dir="rtl"` on `<html>` when lang is "ar".
