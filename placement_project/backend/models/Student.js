import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true, index: true },
    studentId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: String,
    branch: String,
    course: String,
    cgpa: { type: Number, min: 0, max: 10 },
    backlogs: { type: Number, default: 0, min: 0 },
    graduationYear: Number,
    skills: [String],
    experienceMonths: { type: Number, default: 0, min: 0 },
    experienceDetails: String,
    certifications: [String],
    preferredLocations: [String],
    readinessScore: { type: Number, default: 0 },
    resumeUrl: String,
    // Set by the interview-result workflow (Interview status Completed ->
    // Selected/Not Selected), never by the matching/eligibility agents.
    placementStatus: { type: String, enum: ["Not Placed", "In Process", "Selected", "Not Selected"], default: "Not Placed" }
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
