
// import mongoose from "mongoose";

// const leaveRequestSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     financialYearStart: { type: Date, required: true, index: true },
//     leaveType: {
//       type: String,
//       enum: ["BL", "L", "LWP", "EL", "CL", "ML"],
//       required: true,
//     },
//     startSession: {
//       type: String,
//       enum: ["full", "first_half", "second_half"],
//       default: "full",
//     },
//     endSession: {
//       type: String,
//       enum: ["full", "first_half", "second_half"],
//       default: "full",
//     },
//     startDate: { type: Date, required: true, index: true },
//     endDate: { type: Date, required: true, index: true },
//     requestedDays: { type: Number, required: true },
//     sandwichDays: { type: Number, default: 0 },
//     chargedDays: { type: Number, required: true },
//     reason: { type: String, trim: true, default: "" },
//     status: {
//       type: String,
//       enum: ["pending", "approved", "rejected", "cancelled"],
//       default: "pending",
//       index: true,
//     },
//     reviewedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     reviewedAt: { type: Date, default: null },
//     reviewComment: { type: String, trim: true, default: "" },
//     reviewTrail: {
//       type: [
//         {
//           action: {
//             type: String,
//             enum: ["applied", "approved", "rejected", "cancelled", "reset"],
//             required: true,
//           },
//           remark: { type: String, trim: true, default: "" },
//           actorId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             default: null,
//           },
//           actorName: { type: String, trim: true, default: "" },
//           at: { type: Date, default: Date.now },
//         },
//       ],
//       default: [],
//     },
//   },
//   { timestamps: true }
// );

// leaveRequestSchema.index({ userId: 1, startDate: 1, endDate: 1, status: 1 });

// const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);
// export default LeaveRequest;






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
      enum: ["BL", "L", "LWP", "EL", "CL", "ML", "FL"],  // ✅ Added FL
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
    appliedBy: {  // ✅ Added - missing field
      type: String,
      enum: ["employee", "superAdmin"],
      default: "employee",
      index: true,
    },
    appliedByUser: {  // ✅ Added - missing field
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {  // ✅ Added - missing field
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdOn: { type: Date, default: Date.now },  // ✅ Added - missing field
    appliedOnBehalf: { type: Boolean, default: false },  // ✅ Added - missing field
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
    reviewTrail: {
      type: [
        {
          action: {
            type: String,
            enum: ["applied", "approved", "rejected", "cancelled", "reset"],
            required: true,
          },
          remark: { type: String, trim: true, default: "" },
          actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          actorName: { type: String, trim: true, default: "" },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ userId: 1, startDate: 1, endDate: 1, status: 1 });

// ✅ FIX: Check if model already exists before creating
const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model("LeaveRequest", leaveRequestSchema);

export default LeaveRequest;