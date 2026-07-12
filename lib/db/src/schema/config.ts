import { pgTable, integer, text } from "drizzle-orm/pg-core";

// Single-row config (always id = 1). Use getConfig() helper in routes to ensure the row exists.
export const appConfigTable = pgTable("app_config", {
  id: integer("id").primaryKey(),
  accessCode: text("access_code").notNull(),
  sessionRevision: integer("session_revision").notNull(),
  editCode: text("edit_code"),   // nullable — if null, no secret required to edit
});

export type AppConfig = typeof appConfigTable.$inferSelect;
