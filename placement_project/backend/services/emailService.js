import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

export function emailConfigured() {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function getTransporter() {
  if (!emailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }
  return transporter;
}

// Fire-and-forget email send. Never throws - a failed/unconfigured email
// must never break the notification or placement workflow that triggered
// it. The in-app Notification document (MongoDB) is the real source of
// truth; email is a best-effort secondary channel.
export async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({
      from: env.smtp.user,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`
    });
    return true;
  } catch (e) {
    console.warn("Email send failed:", e.message);
    return false;
  }
}
