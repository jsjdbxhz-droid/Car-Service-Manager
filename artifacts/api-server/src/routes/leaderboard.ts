import { Router } from "express";
import { db, usersTable, recordsTable, invoicesTable } from "@workspace/db";
import { eq, sql, count, countDistinct } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// GET /api/leaderboard — top 10 users by activity (auth required)
router.get("/", requireAuth, async (_req, res) => {
  // Aggregate per user: record count, invoice count, unique customer count
  const rows = await db
    .select({
      userId: usersTable.id,
      username: usersTable.username,
      recordCount: sql<number>`CAST(COUNT(DISTINCT ${recordsTable.id}) AS INT)`,
      invoiceCount: sql<number>`CAST(COUNT(DISTINCT ${invoicesTable.id}) AS INT)`,
      customerCount: sql<number>`CAST(COUNT(DISTINCT ${recordsTable.customerNumber}) AS INT)`,
    })
    .from(usersTable)
    .leftJoin(recordsTable, eq(recordsTable.userId, usersTable.id))
    .leftJoin(invoicesTable, eq(invoicesTable.userId, usersTable.id))
    .where(eq(usersTable.hideFromLeaderboard, false))
    .groupBy(usersTable.id, usersTable.username)
    .orderBy(sql`(COUNT(DISTINCT ${recordsTable.id}) + COUNT(DISTINCT ${invoicesTable.id})) DESC`)
    .limit(10);

  res.json(rows);
});

// PUT /api/leaderboard/privacy — toggle current user's visibility
router.put("/privacy", requireAuth, async (req, res) => {
  const { hidden } = req.body as { hidden: boolean };
  if (typeof hidden !== "boolean") {
    res.status(400).json({ error: "hidden must be boolean" });
    return;
  }
  await db
    .update(usersTable)
    .set({ hideFromLeaderboard: hidden })
    .where(eq(usersTable.id, req.userId!));
  res.json({ ok: true, hidden });
});

export default router;
