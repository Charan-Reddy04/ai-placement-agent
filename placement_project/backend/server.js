import express from "express"; import cors from "cors"; import path from "path"; import {fileURLToPath} from "url"; import connectDB from "./config/db.js"; import {env} from "./config/env.js"; import errorMiddleware from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js"; import studentRoutes from "./routes/studentRoutes.js"; import companyRoutes from "./routes/companyRoutes.js"; import jobRoutes from "./routes/jobRoutes.js"; import applicationRoutes from "./routes/applicationRoutes.js"; import eligibilityRoutes from "./routes/eligibilityRoutes.js"; import matchingRoutes from "./routes/matchingRoutes.js"; import interviewRoutes from "./routes/interviewRoutes.js"; import panelRoutes from "./routes/panelRoutes.js"; import roomRoutes from "./routes/roomRoutes.js"; import notificationRoutes from "./routes/notificationRoutes.js"; import analyticsRoutes from "./routes/analyticsRoutes.js"; import skillGapRoutes from "./routes/skillGapRoutes.js";
import { sendUpcomingInterviewReminders } from "./services/reminderService.js";
const app=express();
app.disable("x-powered-by");
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map((v) => v.trim()) : true,
  credentials: false
}));
app.use(express.json({ limit: "1mb" })); const __dirname=path.dirname(fileURLToPath(import.meta.url)); app.use("/uploads",express.static(path.join(__dirname,"uploads")));
app.get("/api/health",(req,res)=>res.json({message:"AI Placement Agent API is running"}));
app.use("/api/auth",authRoutes); app.use("/api/students",studentRoutes); app.use("/api/companies",companyRoutes); app.use("/api/jobs",jobRoutes); app.use("/api/applications",applicationRoutes); app.use("/api/eligibility",eligibilityRoutes); app.use("/api/matching",matchingRoutes); app.use("/api/interviews",interviewRoutes); app.use("/api/panels",panelRoutes); app.use("/api/rooms",roomRoutes); app.use("/api/notifications",notificationRoutes); app.use("/api/analytics",analyticsRoutes); app.use("/api/skill-gap",skillGapRoutes);
app.use(errorMiddleware);
connectDB().then(()=>{
  app.listen(env.port,()=>console.log(`Server running on http://localhost:${env.port}`));
  // Interview reminders: check for upcoming approved interviews on boot,
  // then every 15 minutes. A plain interval is enough for a single-instance
  // prototype - no external job queue required.
  const runReminders=()=>sendUpcomingInterviewReminders().catch(err=>console.warn("Reminder sweep failed:",err.message));
  runReminders();
  setInterval(runReminders,15*60*1000);
}).catch(err=>{console.error(err);process.exit(1)});
