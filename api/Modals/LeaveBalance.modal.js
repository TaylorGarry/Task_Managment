import mongoose from "mongoose";

const leaveBucketSchema = new mongoose.Schema(
  {
    EL: { type: Number, default: 0 },
    CL: { type: Number, default: 0 },
    ML: { type: Number, default: 0 },
    LWP: { type: Number, default: 0 },
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    // Legacy compatibility: old index `user_1` may exist in DB.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Legacy compatibility for old unique index `{ userId: 1, year: 1 }`
    year: { type: Number, default: null },
    financialYearStart: { type: Date, required: true, index: true },
    financialYearEnd: { type: Date, required: true },
    credited: { type: leaveBucketSchema, default: () => ({}) },
    used: { type: leaveBucketSchema, default: () => ({}) },
    available: { type: leaveBucketSchema, default: () => ({}) },
    lastAccruedMonth: { type: Date, default: null },
  },
  { timestamps: true }
);

leaveBalanceSchema.index({ userId: 1, financialYearStart: 1 }, { unique: true });

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);
export default LeaveBalance;
