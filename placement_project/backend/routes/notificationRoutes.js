import {Router} from "express";
import auth from "../middleware/authMiddleware.js";
import {roles} from "../middleware/roleMiddleware.js";
import {list,create,markRead} from "../controllers/notificationController.js";
const r=Router();r.use(auth);r.get("/",list);r.post("/",roles("admin"),create);r.post("/:id/read",markRead);export default r;
