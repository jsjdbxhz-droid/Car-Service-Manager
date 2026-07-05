import { Router } from "express";
import { db, appConfigTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";

const router = Router();

const INITIAL_CODE = "ZZ2013";

async function getConfig() {
  const [cfg] = await db
    .select()
    .from(appConfigTable)
    .where(eq(appConfigTable.id, 1))
    .limit(1);
  if (!cfg) {
    const [created] = await db
      .insert(appConfigTable)
      .values({ id: 1, accessCode: INITIAL_CODE, sessionRevision: 1 })
      .returning();
    return created;
  }
  return cfg;
}

// In-memory rate limiter: max 10 attempts per 15 min per IP
const rl = new Map<string, { n: number; reset: number }>();
function isLimited(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || e.reset < now) {
    rl.set(ip, { n: 1, reset: now + 900_000 });
    return false;
  }
  e.n++;
  return e.n > 10;
}

// POST /api/config/verify-access  — public, rate-limited
router.post("/verify-access", async (req, res) => {
  if (isLimited((req.ip as string) ?? "?")) {
    res.status(429).json({ error: "Too many attempts, try again later" });
    return;
  }
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ error: "code required" });
    return;
  }
  const cfg = await getConfig();
  if (code.trim().toUpperCase() !== cfg.accessCode.toUpperCase()) {
    res.status(401).json({ error: "wrong_code" });
    return;
  }
  res.json({ ok: true, revision: cfg.sessionRevision });
});

// GET /api/config/session-revision  — public (used by frontend to detect code changes)
router.get("/session-revision", async (_req, res) => {
  const cfg = await getConfig();
  res.json({ revision: cfg.sessionRevision });
});

// GET /api/config  — owner only
router.get("/", requireAdmin, async (_req, res) => {
  const cfg = await getConfig();
  res.json({ accessCode: cfg.accessCode, sessionRevision: cfg.sessionRevision });
});

// PUT /api/config/access-code  — owner only, bumps sessionRevision to auto-logout everyone
router.put("/access-code", requireAdmin, async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code || code.trim().length < 4) {
    res.status(400).json({ error: "Code must be at least 4 characters" });
    return;
  }
  await getConfig(); // ensure row exists
  const [updated] = await db
    .update(appConfigTable)
    .set({
      accessCode: code.trim().toUpperCase(),
      sessionRevision: sql`session_revision + 1`,
    })
    .where(eq(appConfigTable.id, 1))
    .returning();
  res.json({ accessCode: updated.accessCode, sessionRevision: updated.sessionRevision });
});

export default router;
