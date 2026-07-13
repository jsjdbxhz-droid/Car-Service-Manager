import { Router } from "express";
import { randomBytes } from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { signToken } from "../lib/token.js";

const router = Router();

function generateLoginCode(): string {
  // 8 random alphanumeric chars, e.g. "A3K9-PX2M"
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code.slice(0, 4) + "-" + code.slice(4);
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, deviceId } = req.body as {
    username: string;
    deviceId?: string;
  };

  if (!username || username.trim().length < 2) {
    res.status(400).json({ error: "username is required (min 2 chars)" });
    return;
  }

  const trimmed = username.trim();

  // Check if username already taken
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, trimmed))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  // Auto-generate unique login code
  let loginCode = generateLoginCode();
  let attempts = 0;
  while (attempts < 10) {
    const [existingCode] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.loginCode, loginCode))
      .limit(1);
    if (!existingCode) break;
    loginCode = generateLoginCode();
    attempts++;
  }

  // Owner bootstrap: only the first-ever registration with the owner username
  // gets the owner role. Once an owner exists in the DB, no further self-promotion
  // is possible through registration — any subsequent registrant gets "user".
  const OWNER_USERNAMES = ["زكرياء"];
  const isOwnerUsername = OWNER_USERNAMES.some(
    (n) => n === trimmed || n === trimmed.toLowerCase(),
  );
  let role = "user";
  if (isOwnerUsername) {
    const [existingOwner] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "owner"))
      .limit(1);
    if (!existingOwner) {
      role = "owner";
    }
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      username: trimmed,
      loginCode,
      role,
      deviceId: deviceId || null,
    })
    .returning();

  // Return loginCode ONLY in register response — this is the one time it's shown
  res.status(201).json({ user: formatUser(user), token: signToken(user.id) });
});

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    loginCode: user.loginCode,
    role: user.role,
    deviceId: user.deviceId,
    companyName: user.companyName,
    companyPhone: user.companyPhone,
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { loginCode } = req.body as { loginCode: string };

  if (!loginCode) {
    res.status(400).json({ error: "loginCode is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.loginCode, loginCode.trim()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid login code" });
    return;
  }

  res.json({ user: formatUser(user), token: signToken(user.id) });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    ...formatUser(user),
    hideFromLeaderboard: user.hideFromLeaderboard,
  });
});

// PUT /api/auth/company  { companyName, companyPhone }
router.put("/company", requireAuth, async (req, res) => {
  const { companyName, companyPhone } = req.body as {
    companyName?: string;
    companyPhone?: string;
  };

  await db
    .update(usersTable)
    .set({
      companyName: companyName?.trim() || null,
      companyPhone: companyPhone?.trim() || null,
    })
    .where(eq(usersTable.id, req.userId!));

  res.json({ ok: true });
});

// PUT /api/auth/username  { username: string }
router.put("/username", requireAuth, async (req, res) => {
  const { username } = req.body as { username?: string };
  const trimmed = (username ?? "").trim();

  if (trimmed.length < 2) {
    res.status(400).json({ error: "username must be at least 2 characters" });
    return;
  }

  // Check uniqueness
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, trimmed))
    .limit(1);

  if (existing && existing.id !== req.userId) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  await db
    .update(usersTable)
    .set({ username: trimmed })
    .where(eq(usersTable.id, req.userId!));

  res.json({ ok: true, username: trimmed });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
