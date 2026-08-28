import { Router } from "express";
import { register, login, studentLogin, adminLogin, me } from "../controllers/authController.js";
import auth from "../middleware/authMiddleware.js";

const r = Router();

r.post("/register", register);
r.post("/login", login);
r.post("/student-login", studentLogin);
r.post("/admin-login", adminLogin);
r.get("/me", auth, me);

export default r;
