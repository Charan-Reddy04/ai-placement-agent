import AuditLog from "../models/AuditLog.js";

export async function logAudit(actor, action, targetType, target, details = "") {
  try {
    return await AuditLog.create({
      actor: actor?.id || actor?._id || null,
      actorName: actor?.name || actor?.email || "System",
      action,
      targetType,
      target,
      details
    });
  } catch (e) {
    // Audit logging must never break the real operation it's recording.
    console.warn("Audit log write failed:", e.message);
    return null;
  }
}
