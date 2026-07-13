import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  customerNumber: text("customer_number"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  carType: text("car_type").notNull(),
  licensePlate: text("license_plate").notNull(),
  workshopName: text("workshop_name").notNull(),
  companyPhone: text("company_phone"),
  breakdownType: text("breakdown_type").notNull(),
  paymentMethod: text("payment_method").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
