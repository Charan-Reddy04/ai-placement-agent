import { Router } from "express";
import auth from "../middleware/authMiddleware.js";
import { roles } from "../middleware/roleMiddleware.js";
import { list, check } from "../controllers/eligibilityController.js";

const r = Router();
r.use(auth);
r.get("/", roles("admin"), list);
r.post("/check", roles("admin"), check);
export default r;
