import { Router } from "express";
import auth from "../middleware/authMiddleware.js";
import { roles } from "../middleware/roleMiddleware.js";
import { match } from "../controllers/matchingController.js";

const r = Router();
r.use(auth);
r.get("/:jobId", roles("admin"), match);
export default r;
