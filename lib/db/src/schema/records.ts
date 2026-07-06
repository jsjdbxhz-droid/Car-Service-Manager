import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const recordsTable = pgTable("records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  breakdownType: text("breakdown_type").notNull(),
  repairDescription: text("repair_description"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  customerNumber: text("customer_number"),
  carType: text("car_type").notNull(),
  licensePlate: text("license_plate").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecordSchema = createInsertSchema(recordsTable).omit({ id: true, createdAt: true });
export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type CustomerRecord = typeof recordsTable.$inferSelect;
