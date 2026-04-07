import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    financialYearStart: { type: Date, required: true, index: true },
    leaveType: {
      type: String,
      enum: ["EL", "CL", "ML", "LWP"],
      required: true,
    },
    startSession: {
      type: String,
      enum: ["full", "first_half", "second_half"],
      default: "full",
    },
    endSession: {
      type: String,
      enum: ["full", "first_half", "second_half"],
      default: "full",
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    requestedDays: { type: Number, required: true },
    sandwichDays: { type: Number, default: 0 },
    chargedDays: { type: Number, required: true },
    reason: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewComment: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ userId: 1, startDate: 1, endDate: 1, status: 1 });

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
export default LeaveRequest;
