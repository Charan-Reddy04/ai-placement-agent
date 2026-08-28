import { Router } from "express";
import auth from "../middleware/authMiddleware.js";
import { roles } from "../middleware/roleMiddleware.js";
import { getDashboard, getAnalytics, getAuditLog } from "../controllers/analyticsController.js";

const r = Router();
r.use(auth, roles("admin"));
r.get("/dashboard", getDashboard);
r.get("/audit-log", getAuditLog);
r.get("/", getAnalytics);
export default r;
