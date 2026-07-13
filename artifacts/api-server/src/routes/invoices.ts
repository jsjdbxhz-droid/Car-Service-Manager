import { Router } from "express";
import { db, invoicesTable, usersTable } from "@workspace/db";
import { eq, or, ilike, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function formatInvoice(inv: typeof invoicesTable.$inferSelect, username: string) {
  return {
    id: inv.id,
    userId: inv.userId,
    username,
    customerNumber: inv.customerNumber,
    firstName: inv.firstName,
    lastName: inv.lastName,
    carType: inv.carType,
    licensePlate: inv.licensePlate,
    workshopName: inv.workshopName,
    companyPhone: inv.companyPhone,
    breakdownType: inv.breakdownType,
    paymentMethod: inv.paymentMethod,
    amount: Number(inv.amount),
    createdAt: inv.createdAt.toISOString(),
  };
}

// GET /api/invoices
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

  const conditions = [inArray(invoicesTable.userId, userIds)];

  if (search) {
    conditions.push(
      or(
        ilike(invoicesTable.firstName, `%${search}%`),
        ilike(invoicesTable.lastName, `%${search}%`),
        ilike(invoicesTable.licensePlate, `%${search}%`),
        ilike(invoicesTable.carType, `%${search}%`),
        ilike(invoicesTable.workshopName, `%${search}%`),
      )!
    );
  }

  const results = await db
    .select({ inv: invoicesTable, username: usersTable.username })
    .from(invoicesTable)
    .innerJoin(usersTable, eq(invoicesTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(invoicesTable.createdAt);

  res.json(results.map(({ inv, username }) => formatInvoice(inv, username)));
});

// POST /api/invoices
router.post("/", requireAuth, async (req, res) => {
  const body = req.body as {
    customerNumber?: string;
    firstName: string;
    lastName: string;
    carType: string;
    licensePlate: string;
    workshopName: string;
    companyPhone?: string;
    breakdownType: string;
    paymentMethod: string;
    amount: number;
  };

  const [inv] = await db
    .insert(invoicesTable)
    .values({
      userId: req.userId!,
      customerNumber: body.customerNumber || null,
      firstName: body.firstName,
      lastName: body.lastName,
      carType: body.carType,
      licensePlate: body.licensePlate,
      workshopName: body.workshopName,
      companyPhone: body.companyPhone || null,
      breakdownType: body.breakdownType,
      paymentMethod: body.paymentMethod,
      amount: String(body.amount),
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.status(201).json(formatInvoice(inv, user.username));
});

// GET /api/invoices/:id
router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const result = await db
    .select({ inv: invoicesTable, username: usersTable.username })
    .from(invoicesTable)
    .innerJoin(usersTable, eq(invoicesTable.userId, usersTable.id))
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .limit(1);

  if (!result.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatInvoice(result[0].inv, result[0].username));
});

// PUT /api/invoices/:id
router.put("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  const body = req.body as Partial<{
    customerNumber: string;
    firstName: string;
    lastName: string;
    carType: string;
    licensePlate: string;
    workshopName: string;
    companyPhone: string;
    breakdownType: string;
    paymentMethod: string;
    amount: number;
  }>;

  const update: Record<string, unknown> = {};
  if (body.customerNumber !== undefined) update.customerNumber = body.customerNumber;
  if (body.firstName !== undefined) update.firstName = body.firstName;
  if (body.lastName !== undefined) update.lastName = body.lastName;
  if (body.carType !== undefined) update.carType = body.carType;
  if (body.licensePlate !== undefined) update.licensePlate = body.licensePlate;
  if (body.workshopName !== undefined) update.workshopName = body.workshopName;
  if (body.companyPhone !== undefined) update.companyPhone = body.companyPhone || null;
  if (body.breakdownType !== undefined) update.breakdownType = body.breakdownType;
  if (body.paymentMethod !== undefined) update.paymentMethod = body.paymentMethod;
  if (body.amount !== undefined) update.amount = String(body.amount);

  const [inv] = await db
    .update(invoicesTable)
    .set(update)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)))
    .returning();

  if (!inv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.json(formatInvoice(inv, user.username));
});

// DELETE /api/invoices/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  await db
    .delete(invoicesTable)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.userId, req.userId!)));
  res.status(204).send();
});

export default router;
