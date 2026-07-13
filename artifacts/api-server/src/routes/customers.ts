import { Router } from "express";
import { db, recordsTable, usersTable } from "@workspace/db";
import { eq, or, ilike, and, inArray, sql, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function formatRecord(r: typeof recordsTable.$inferSelect, username: string) {
  return {
    id: r.id,
    userId: r.userId,
    username,
    workshopName: r.workshopName,
    companyPhone: r.companyPhone,
    firstName: r.firstName,
    lastName: r.lastName,
    breakdownType: r.breakdownType,
    repairDescription: r.repairDescription,
    totalAmount: Number(r.totalAmount),
    customerNumber: r.customerNumber,
    carType: r.carType,
    licensePlate: r.licensePlate,
    paymentStatus: r.paymentStatus,
    visitCount: r.visitCount,
    entryDate: r.entryDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /api/customers — unique customers grouped by firstName+lastName
router.get("/", requireAuth, async (req, res) => {
  const { search, deviceId, date } = req.query as {
    search?: string;
    deviceId?: string;
    date?: string;
  };

  let userIds: number[] = [req.userId!];
  if (deviceId) {
    const deviceUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.deviceId, deviceId));
    userIds = deviceUsers.map((u) => u.id);
    if (!userIds.includes(req.userId!)) userIds.push(req.userId!);
  }

  const conditions: any[] = [inArray(recordsTable.userId, userIds)];

  if (search) {
    conditions.push(
      or(
        ilike(recordsTable.firstName, `%${search}%`),
        ilike(recordsTable.lastName, `%${search}%`),
      )!
    );
  }

  if (date) {
    conditions.push(sql`date(${recordsTable.entryDate}) = ${date}::date`);
  }

  const results = await db
    .select({
      firstName: recordsTable.firstName,
      lastName: recordsTable.lastName,
      visitCount: sql<number>`count(*)::int`,
      lastVisit: sql<Date>`max(${recordsTable.entryDate})`,
    })
    .from(recordsTable)
    .where(and(...conditions))
    .groupBy(recordsTable.firstName, recordsTable.lastName)
    .orderBy(sql`max(${recordsTable.entryDate}) desc`);

  res.json(
    results.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      visitCount: Number(r.visitCount),
      lastVisit: r.lastVisit ? new Date(r.lastVisit).toISOString() : null,
    }))
  );
});

// GET /api/customers/records?firstName=&lastName=&date=
router.get("/records", requireAuth, async (req, res) => {
  const { firstName, lastName, deviceId, date } = req.query as {
    firstName?: string;
    lastName?: string;
    deviceId?: string;
    date?: string;
  };

  if (!firstName || !lastName) {
    res.status(400).json({ error: "firstName and lastName required" });
    return;
  }

  let userIds: number[] = [req.userId!];
  if (deviceId) {
    const deviceUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.deviceId, deviceId));
    userIds = deviceUsers.map((u) => u.id);
    if (!userIds.includes(req.userId!)) userIds.push(req.userId!);
  }

  const conditions: any[] = [
    inArray(recordsTable.userId, userIds),
    eq(recordsTable.firstName, firstName),
    eq(recordsTable.lastName, lastName),
  ];

  if (date) {
    conditions.push(sql`date(${recordsTable.entryDate}) = ${date}::date`);
  }

  const results = await db
    .select({ record: recordsTable, username: usersTable.username })
    .from(recordsTable)
    .innerJoin(usersTable, eq(recordsTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(recordsTable.entryDate));

  res.json(results.map(({ record, username }) => formatRecord(record, username)));
});

export default router;
