import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import recordsRouter from "./records.js";
import invoicesRouter from "./invoices.js";
import adminRouter from "./admin.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/records", recordsRouter);
router.use("/invoices", invoicesRouter);
router.use("/admin", adminRouter);
router.use("/stats", statsRouter);

export default router;
