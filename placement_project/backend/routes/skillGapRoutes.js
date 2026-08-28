import {Router} from "express"; import auth from "../middleware/authMiddleware.js"; import {generate} from "../controllers/skillGapController.js";
const r=Router(); r.use(auth); r.post("/generate",generate); export default r;
