import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import { sendEmail, emailConfigured } from "./emailService.js";

// The in-app Notification document (MongoDB) is always the source of truth
// and is created/awaited first. Email is a best-effort secondary channel:
// SMTP_HOST/USER/PASS were documented in .env.example and nodemailer was a
// listed dependency, but nothing ever called it - notifications only ever
// reached the in-app center, never the student's inbox. This sends a real
// email when SMTP is configured, without ever blocking or failing the
// primary DB write if email delivery fails or isn't configured.
async function emailRecipient(recipient, recipientType, title, message) {
  if (!emailConfigured() || recipientType !== "student") return;
  try {
    const student = await Student.findById(recipient).select("name email");
    if (!student?.email) return;
    await sendEmail({ to: student.email, subject: title, text: `Hi ${student.name || ""}, ${message}` });
  } catch (e) {
    console.warn(`Notification email lookup/send failed for ${recipient}:`, e.message);
  }
}

export async function createNotification(recipient,title,message,type="info",recipientType="student"){
  const notification = await Notification.create({recipient,recipientType,title,message,type});
  emailRecipient(recipient, recipientType, title, message).catch(()=>{});
  return notification;
}
export async function notifyStudents(students,title,message,type="info"){
  const created = await Notification.insertMany(students.map(s=>({recipient:s._id,recipientType:"student",title,message,type})));
  if (emailConfigured()) for (const s of students) emailRecipient(s._id, "student", title, message).catch(()=>{});
  return created;
}
