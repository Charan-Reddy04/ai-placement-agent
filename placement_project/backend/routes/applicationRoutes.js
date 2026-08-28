import {Router} from "express";
import auth from "../middleware/authMiddleware.js";
import {roles} from "../middleware/roleMiddleware.js";
import {list,approve,reject} from "../controllers/applicationController.js";
const r=Router();r.use(auth);
r.get("/",roles("admin"),list);
r.post("/:id/approve",roles("admin"),approve);
r.post("/:id/reject",roles("admin"),reject);
export default r;
