
// import mongoose from "mongoose";

// const leaveBucketSchema = new mongoose.Schema(
//   {
//     EL: { type: Number, default: 0 },
//     CL: { type: Number, default: 0 },
//     ML: { type: Number, default: 0 },
//     LWP: { type: Number, default: 0 },
//   },
//   { _id: false }
// );

// const leaveBalanceSchema = new mongoose.Schema(
//   {
//     // Legacy compatibility: old index `user_1` may exist in DB.
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//       index: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     // Legacy compatibility for old unique index `{ userId: 1, year: 1 }`
//     year: { type: Number, default: null },
//     financialYearStart: { type: Date, required: true, index: true },
//     financialYearEnd: { type: Date, required: true },
//     credited: { type: leaveBucketSchema, default: () => ({}) },
//     used: { type: leaveBucketSchema, default: () => ({}) },
//     available: { type: leaveBucketSchema, default: () => ({}) },
//     currentCredited: { type: Number, default: 0 },
//     currentUsed: { type: Number, default: 0 },
//     currentAvailable: { type: Number, default: 0 },
//     lastAccruedMonth: { type: Date, default: null },
//   },
//   { timestamps: true }
// );

// leaveBalanceSchema.index({ userId: 1, financialYearStart: 1 }, { unique: true });

// const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);
// export default LeaveBalance;



import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    financialYearStart: {
      type: Date,
      required: true,
    },
    financialYearEnd: {
      type: Date,
      required: true,
    },
    credited: {
      EL: { type: Number, default: 0 },
      CL: { type: Number, default: 0 },
      ML: { type: Number, default: 0 },
      LWP: { type: Number, default: 0 },
    },
    used: {
      EL: { type: Number, default: 0 },
      CL: { type: Number, default: 0 },
      ML: { type: Number, default: 0 },
      LWP: { type: Number, default: 0 },
    },
    available: {
      EL: { type: Number, default: 0 },
      CL: { type: Number, default: 0 },
      ML: { type: Number, default: 0 },
      LWP: { type: Number, default: 0 },
    },
    currentCredited: {
      type: Number,
      default: 0,
    },
    currentUsed: {
      type: Number,
      default: 0,
    },
    currentAvailable: {
      type: Number,
      default: 0,
    },
    lastAccruedMonth: {
      type: Date,
      default: null,
    },
    // New field to track FL adjustments
    flAdjustments: {
      type: [
        {
          month: Date,
          originalAccrual: Number,
          usedToOffset: Number,
          remainingAccrual: Number,
          adjustedBalance: Number,
          previousBalance: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index to ensure one balance per user per financial year
leaveBalanceSchema.index({ userId: 1, financialYearStart: 1 }, { unique: true });
leaveBalanceSchema.index({ user: 1, financialYearStart: 1 }, { unique: true });

// ✅ FIX: Check if model already exists before creating
const LeaveBalance = mongoose.models.LeaveBalance || mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;