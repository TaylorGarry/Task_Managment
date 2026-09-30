import mongoose from "mongoose";

const aiPendingActionSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestedByName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: [
        "WAITING_FOR_APPROVAL",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "EXECUTING",
        "COMPLETED",
        "FAILED",
        "EXPIRED",
      ],
      default: "WAITING_FOR_APPROVAL",
      index: true,
    },
    action: { type: String, trim: true, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    preview: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    affectedTeamLeaders: { type: [String], default: [] },
    affectedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    approval: {
      required: { type: Boolean, default: true },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      approvedByName: { type: String, trim: true, default: "" },
      approvedAt: { type: Date, default: null },
      rejectedAt: { type: Date, default: null },
    },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    failureMessage: { type: String, trim: true, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

aiPendingActionSchema.index({ requestedBy: 1, status: 1, createdAt: -1 });
aiPendingActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("AiPendingAction", aiPendingActionSchema);
