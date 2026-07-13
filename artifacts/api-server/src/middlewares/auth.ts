import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/token.js";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers.authorization;
  if (!raw?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = raw.slice(7);
  try {
    const userId = verifyToken(token);
    if (userId === null) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (user.kickedAt) {
      res.status(401).json({ error: "kicked" });
      return;
    }
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Accepts both "owner" (new) and "admin" (legacy) roles
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.userRole !== "owner" && req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export { requireAdmin as requireOwner };
