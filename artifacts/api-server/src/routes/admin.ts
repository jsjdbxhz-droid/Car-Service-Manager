import { Router } from "express";
import { db, usersTable, recordsTable, invoicesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";
import { signToken } from "../lib/token.js";

const router = Router();

// GET /api/admin/users?search=xxx
router.get("/users", requireAdmin, async (req, res) => {
  const { search } = req.query as { search?: string };

  let query = db.select().from(usersTable).$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(usersTable.username, `%${search}%`),
      )!
    );
  }

  const users = await query.orderBy(usersTable.createdAt);

  // Owner can see real loginCodes (needed for support/impersonation)
  res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      loginCode: u.loginCode,
      role: u.role,
      deviceId: u.deviceId,
      kickedAt: u.kickedAt ? u.kickedAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

// POST /api/admin/users/:id/impersonate
// Owner enters a user's account → returns a signed token for that user
router.post("/users/:id/impersonate", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params["id"] as string, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    token: signToken(user.id),
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      deviceId: user.deviceId,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

// POST /api/admin/users/:id/kick
router.post("/users/:id/kick", requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params["id"] as string, 10);
  if (targetId === req.userId) {
    res.status(400).json({ error: "Cannot kick yourself" });
    return;
  }
  await db.update(usersTable).set({ kickedAt: new Date() }).where(eq(usersTable.id, targetId));
  res.json({ ok: true });
});

// POST /api/admin/users/:id/unkick
router.post("/users/:id/unkick", requireAdmin, async (req, res) => {
  const targetId = parseInt(req.params["id"] as string, 10);
  await db.update(usersTable).set({ kickedAt: null }).where(eq(usersTable.id, targetId));
  res.json({ ok: true });
});

// GET /api/admin/users/:id/records
router.get("/users/:id/records", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params["id"] as string, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const records = await db
    .select()
    .from(recordsTable)
    .where(eq(recordsTable.userId, userId))
    .orderBy(recordsTable.createdAt);

  // Compute visitCount per licensePlate
  const plateCounts: Record<string, number> = {};
  records.forEach((r) => {
    const key = r.licensePlate.toUpperCase();
    plateCounts[key] = (plateCounts[key] || 0) + 1;
  });

  res.json(
    records.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: user.username,
      firstName: r.firstName,
      lastName: r.lastName,
      breakdownType: r.breakdownType,
      totalAmount: Number(r.totalAmount),
      customerNumber: r.customerNumber,
      carType: r.carType,
      licensePlate: r.licensePlate,
      visitCount: plateCounts[r.licensePlate.toUpperCase()] || 1,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// GET /api/admin/users/:id/invoices
router.get("/users/:id/invoices", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params["id"] as string, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.userId, userId))
    .orderBy(invoicesTable.createdAt);

  res.json(
    invoices.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      username: user.username,
      customerNumber: inv.customerNumber,
      firstName: inv.firstName,
      lastName: inv.lastName,
      carType: inv.carType,
      licensePlate: inv.licensePlate,
      workshopName: inv.workshopName,
      breakdownType: inv.breakdownType,
      paymentMethod: inv.paymentMethod,
      amount: Number(inv.amount),
      createdAt: inv.createdAt.toISOString(),
    }))
  );
});

export default router;
