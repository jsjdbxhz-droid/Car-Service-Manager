import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  loginCode: text("login_code").notNull().unique(),
  role: text("role").notNull().default("user"),
  deviceId: text("device_id"),
  hideFromLeaderboard: boolean("hide_from_leaderboard").notNull().default(false),
  isPaid: boolean("is_paid").notNull().default(false),
  kickedAt: timestamp("kicked_at"),
  companyName: text("company_name"),
  companyPhone: text("company_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
