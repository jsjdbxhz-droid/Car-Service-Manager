import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import recordsRouter from "./records.js";
import invoicesRouter from "./invoices.js";
import adminRouter from "./admin.js";
import statsRouter from "./stats.js";
import configRouter from "./config.js";
import leaderboardRouter from "./leaderboard.js";
import customersRouter from "./customers.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/records", recordsRouter);
router.use("/invoices", invoicesRouter);
router.use("/admin", adminRouter);
router.use("/stats", statsRouter);
router.use("/config", configRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/customers", customersRouter);

export default router;
