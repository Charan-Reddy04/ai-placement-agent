import mongoose from "mongoose";

// Records high-impact placement-operations events (admin approvals/rejections,
// interview results, imports) so there's a real trail of who did what, when -
// per spec section 26. Deliberately minimal: actor + action + target +
// details, nothing here is used to drive app behaviour, only to display.
export default mongoose.model(
  "AuditLog",
  new mongoose.Schema(
    {
      actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      actorName: String,
      action: { type: String, required: true },
      targetType: String,
      target: { type: mongoose.Schema.Types.ObjectId },
      details: String
    },
    { timestamps: true }
  )
);
