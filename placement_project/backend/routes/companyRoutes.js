import { Router } from "express";
import auth from "../middleware/authMiddleware.js";
import { roles } from "../middleware/roleMiddleware.js";
import { list, create } from "../controllers/companyController.js";

const r = Router();
r.use(auth);
r.get("/", roles("admin"), list);
r.post("/", roles("admin"), create);
export default r;
