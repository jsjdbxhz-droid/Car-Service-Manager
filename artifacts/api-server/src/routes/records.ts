import { Router } from "express";
import { db, recordsTable, usersTable } from "@workspace/db";
import { eq, or, ilike, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function formatRecord(
  r: typeof recordsTable.$inferSelect,
  username: string,
  visitCount = 1
) {
  return {
    id: r.id,
    userId: r.userId,
    username,
    firstName: r.firstName,
    lastName: r.lastName,
    breakdownType: r.breakdownType,
    repairDescription: r.repairDescription,
    totalAmount: Number(r.totalAmount),
    customerNumber: r.customerNumber,
    carType: r.carType,
    licensePlate: r.licensePlate,
    paymentStatus: r.paymentStatus,
    entryDate: r.entryDate.toISOString(),
    visitCount,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /api/records
router.get("/", requireAuth, async (req, res) => {
  const { search, deviceId } = req.query as { search?: string; deviceId?: string };

  let userIds: number[] = [req.userId!];
  if (deviceId) {
    const deviceUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.deviceId, deviceId));
    userIds = deviceUsers.map((u) => u.id);
    if (!userIds.includes(req.userId!)) userIds.push(req.userId!);
  }

  let query = db
    .select({ record: recordsTable, username: usersTable.username })
    .from(recordsTable)
    .innerJoin(usersTable, eq(recordsTable.userId, usersTable.id))
    .$dynamic();

  const conditions = [inArray(recordsTable.userId, userIds)];

  if (search) {
    conditions.push(
      or(
        ilike(recordsTable.firstName, `%${search}%`),
        ilike(recordsTable.lastName, `%${search}%`),
        ilike(recordsTable.licensePlate, `%${search}%`),
        ilike(recordsTable.carType, `%${search}%`),
        ilike(recordsTable.customerNumber, `%${search}%`),
      )!
    );
  }

  const results = await query.where(and(...conditions)).orderBy(recordsTable.entryDate);

  const plateCounts: Record<string, number> = {};
  results.forEach(({ record }) => {
    const key = `${record.userId}:${record.licensePlate.toUpperCase()}`;
    plateCounts[key] = (plateCounts[key] || 0) + 1;
  });

  res.json(
    results.map(({ record, username }) => {
      const key = `${record.userId}:${record.licensePlate.toUpperCase()}`;
      return formatRecord(record, username, plateCounts[key] || 1);
    })
  );
});

// POST /api/records
router.post("/", requireAuth, async (req, res) => {
  const body = req.body as {
    firstName: string;
    lastName: string;
    breakdownType: string;
    repairDescription?: string;
    totalAmount: number;
    customerNumber?: string;
    carType: string;
    licensePlate: string;
    paymentStatus?: string;
    entryDate?: string;
  };

  const [record] = await db
    .insert(recordsTable)
    .values({
      userId: req.userId!,
      firstName: body.firstName,
      lastName: body.lastName,
      breakdownType: body.breakdownType,
      repairDescription: body.repairDescription || null,
      totalAmount: String(body.totalAmount),
      customerNumber: body.customerNumber || null,
      carType: body.carType,
      licensePlate: body.licensePlate,
      paymentStatus: body.paymentStatus || "unpaid",
      entryDate: body.entryDate ? new Date(body.entryDate) : new Date(),
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.status(201).json(formatRecord(record, user.username, 1));
});

// GET /api/records/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const result = await db
    .select({ record: recordsTable, username: usersTable.username })
    .from(recordsTable)
    .innerJoin(usersTable, eq(recordsTable.userId, usersTable.id))
    .where(and(eq(recordsTable.id, id), eq(recordsTable.userId, req.userId!)))
    .limit(1);

  if (!result.length) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatRecord(result[0].record, result[0].username));
});

// PUT /api/records/:id
router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body as Partial<{
    firstName: string;
    lastName: string;
    breakdownType: string;
    repairDescription: string;
    totalAmount: number;
    customerNumber: string;
    carType: string;
    licensePlate: string;
    paymentStatus: string;
    entryDate: string;
  }>;

  const update: Record<string, unknown> = {};
  if (body.firstName !== undefined) update.firstName = body.firstName;
  if (body.lastName !== undefined) update.lastName = body.lastName;
  if (body.breakdownType !== undefined) update.breakdownType = body.breakdownType;
  if (body.repairDescription !== undefined) update.repairDescription = body.repairDescription;
  if (body.totalAmount !== undefined) update.totalAmount = String(body.totalAmount);
  if (body.customerNumber !== undefined) update.customerNumber = body.customerNumber;
  if (body.carType !== undefined) update.carType = body.carType;
  if (body.licensePlate !== undefined) update.licensePlate = body.licensePlate;
  if (body.paymentStatus !== undefined) update.paymentStatus = body.paymentStatus;
  if (body.entryDate !== undefined) update.entryDate = new Date(body.entryDate);

  const [record] = await db
    .update(recordsTable)
    .set(update)
    .where(and(eq(recordsTable.id, id), eq(recordsTable.userId, req.userId!)))
    .returning();

  if (!record) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.json(formatRecord(record, user.username));
});

// DELETE /api/records/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db
    .delete(recordsTable)
    .where(and(eq(recordsTable.id, id), eq(recordsTable.userId, req.userId!)));
  res.status(204).send();
});

export default router;
