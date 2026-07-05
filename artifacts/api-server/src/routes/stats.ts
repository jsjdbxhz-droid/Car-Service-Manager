import { Router } from "express";
import { db, recordsTable, invoicesTable, usersTable } from "@workspace/db";
import { eq, sum, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const [recordStats] = await db
    .select({ total: count(), totalAmount: sum(recordsTable.totalAmount) })
    .from(recordsTable)
    .where(eq(recordsTable.userId, userId));

  const [invoiceStats] = await db
    .select({ total: count() })
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, userId));

  const recentRecords = await db
    .select({ record: recordsTable, username: usersTable.username })
    .from(recordsTable)
    .innerJoin(usersTable, eq(recordsTable.userId, usersTable.id))
    .where(eq(recordsTable.userId, userId))
    .orderBy(recordsTable.createdAt)
    .limit(5);

  res.json({
    totalRecords: Number(recordStats.total) || 0,
    totalInvoices: Number(invoiceStats.total) || 0,
    totalAmount: Number(recordStats.totalAmount) || 0,
    recentRecords: recentRecords.map(({ record, username }) => ({
      id: record.id,
      userId: record.userId,
      username,
      firstName: record.firstName,
      lastName: record.lastName,
      breakdownType: record.breakdownType,
      totalAmount: Number(record.totalAmount),
      customerNumber: record.customerNumber,
      carType: record.carType,
      licensePlate: record.licensePlate,
      createdAt: record.createdAt.toISOString(),
    })),
  });
});

export default router;
