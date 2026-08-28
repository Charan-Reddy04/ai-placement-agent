import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { env } from "../config/env.js";
import { expandSkills } from "../services/skillService.js";
import { refreshStudentAcrossJobs } from "../services/placementPipeline.js";
import { createNotification } from "../services/notificationService.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const createToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role, name: user.name, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const normalizeEmail = (email = "") => email.trim().toLowerCase();

export async function register(req, res) {
  const { name, email, password, phone, branch, course, cgpa, backlogs, graduationYear, skills, experienceMonths, experienceDetails, certifications, preferredLocations } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "An account already exists with this email. Please login instead." });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "student"
  });

  const existingStudent = await Student.findOne({ email: normalizedEmail });
  const profile = {
    name: name.trim(), email: normalizedEmail, phone, branch, course,
    cgpa: cgpa === "" || cgpa == null ? undefined : Number(cgpa),
    backlogs: backlogs === "" || backlogs == null ? 0 : Number(backlogs),
    graduationYear: graduationYear === "" || graduationYear == null ? undefined : Number(graduationYear),
    skills: expandSkills(Array.isArray(skills) ? skills : []),
    experienceMonths: experienceMonths === "" || experienceMonths == null ? 0 : Number(experienceMonths),
    experienceDetails,
    certifications: Array.isArray(certifications) ? certifications : (certifications ? String(certifications).split(",").map(x => x.trim()).filter(Boolean) : []),
    preferredLocations: Array.isArray(preferredLocations) ? preferredLocations : (preferredLocations ? String(preferredLocations).split(",").map(x => x.trim()).filter(Boolean) : [])
  };

  let student;
  try {
    if (existingStudent) {
      if (existingStudent.user && await User.exists({ _id: existingStudent.user })) {
        await User.findByIdAndDelete(user._id);
        return res.status(409).json({ message: "A student profile already uses this email. Please login with the existing account." });
      }
      // Reconcile a preloaded placement-cell student with a newly created login.
      // Preserve imported/administrator data when registration leaves a field blank.
      const update = { user: user._id };
      for (const [key, value] of Object.entries(profile)) {
        if (value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) update[key] = value;
      }
      student = await Student.findByIdAndUpdate(existingStudent._id, update, { new: true, runValidators: true });
    } else {
      student = await Student.create({ user: user._id, ...profile });
    }
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  // Registration creates the account, then the student logs in normally.
  // The profile is immediately fed into all currently open, admin-confirmed jobs.
  refreshStudentAcrossJobs(student).catch((e) => console.warn(`Eligibility refresh failed for new student ${student._id}:`, e.message));
  createNotification(student._id, "Welcome to CampusAI", "Your placement profile is ready. Browse open opportunities and keep your profile updated so the AI placement agent can evaluate you automatically.", "info").catch((e) => console.warn(`Welcome notification failed for ${student._id}:`, e.message));

  res.status(201).json({
    message: existingStudent
      ? "Account created and linked to your existing placement profile. Please login to continue."
      : "Student account created successfully. Please login to continue.",
    registered: true,
    email: user.email
  });
}

export async function login(req, res) {
  return authenticate(req, res);
}

export async function studentLogin(req, res) {
  return authenticate(req, res, "student");
}

export async function adminLogin(req, res) {
  return authenticate(req, res, "admin");
}

async function authenticate(req, res, requiredRole) {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (requiredRole && user.role !== requiredRole) {
    return res.status(403).json({
      message: `This account is not a ${requiredRole} account`
    });
  }

  const token = createToken(user);
  res.json({ message: "Login successful", token, user: publicUser(user) });
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "User no longer exists" });
  res.json({ user: publicUser(user) });
}
