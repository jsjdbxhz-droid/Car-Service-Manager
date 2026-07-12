import { Router } from "express";
import { db, appConfigTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

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
      .values({ id: 1, accessCode: INITIAL_CODE, sessionRevision: 1, editCode: null })
      .returning();
    return created;
  }
  return cfg;
}

// In-memory rate limiters — separate buckets per purpose
function makeRateLimiter(maxAttempts: number, windowMs: number) {
  const store = new Map<string, { n: number; reset: number }>();
  return (ip: string) => {
    const now = Date.now();
    const e = store.get(ip);
    if (!e || e.reset < now) {
      store.set(ip, { n: 1, reset: now + windowMs });
      return false;
    }
    e.n++;
    return e.n > maxAttempts;
  };
}
const isAccessLimited = makeRateLimiter(10, 900_000);  // 10/15min per IP
const isEditLimited   = makeRateLimiter(10, 900_000);  // 10/15min per IP, separate bucket

// POST /api/config/verify-access  — public, rate-limited
router.post("/verify-access", async (req, res) => {
  if (isAccessLimited((req.ip as string) ?? "?")) {
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

// GET /api/config/edit-code-enabled  — public, just tells frontend if a secret is set
router.get("/edit-code-enabled", async (_req, res) => {
  const cfg = await getConfig();
  res.json({ enabled: !!cfg.editCode });
});

// POST /api/config/verify-edit-code  — authenticated, separate rate-limited bucket
router.post("/verify-edit-code", requireAuth, async (req, res) => {
  if (isEditLimited((req.ip as string) ?? "?")) {
    res.status(429).json({ error: "Too many attempts, try again later" });
    return;
  }
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  const cfg = await getConfig();
  if (!cfg.editCode) { res.json({ ok: true }); return; }  // no code set → always pass
  if (code.trim() !== cfg.editCode) {
    res.status(401).json({ error: "wrong_code" });
    return;
  }
  res.json({ ok: true });
});

// GET /api/config  — owner only
router.get("/", requireAdmin, async (_req, res) => {
  const cfg = await getConfig();
  res.json({
    accessCode: cfg.accessCode,
    sessionRevision: cfg.sessionRevision,
    editCodeEnabled: !!cfg.editCode,
    // editCode intentionally omitted from response — use verify endpoint to check
  });
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

// PUT /api/config/edit-code  — owner only (pass empty string to remove)
router.put("/edit-code", requireAdmin, async (req, res) => {
  const { code } = req.body as { code?: string };
  await getConfig();
  const newCode = code && code.trim().length >= 4 ? code.trim() : null;
  const [updated] = await db
    .update(appConfigTable)
    .set({ editCode: newCode })
    .where(eq(appConfigTable.id, 1))
    .returning();
  res.json({ editCodeEnabled: !!updated.editCode });
});

export default router;
