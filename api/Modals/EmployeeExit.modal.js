import mongoose from "mongoose";

export const EMPLOYEE_EXIT_STATUSES = [
  "notice_period",
  "it_verification_pending",
  "it_cleared",
  "hr_clearance_pending",
  "hr_cleared",
  "accounts_clearance_pending",
  "accounts_cleared",
  "superadmin_approval_pending",
  "waiting_for_last_working_day",
  "exit_completed",
  "exit_revoked",
];

const ACTIVE_EMPLOYEE_EXIT_STATUSES = EMPLOYEE_EXIT_STATUSES.filter(
  (status) => !["exit_completed", "exit_revoked"].includes(status)
);

const employeeExitSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resignationDate: {
      type: Date,
      required: true,
    },
    lastWorkingDate: {
      type: Date,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    exitType: {
      type: String,
      enum: ["voluntary", "involuntary"],
      default: "voluntary",
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: EMPLOYEE_EXIT_STATUSES,
      default: "notice_period",
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hrVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    accountsVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    exitCompletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: "employee_exits" }
);

employeeExitSchema.index({ status: 1 });
employeeExitSchema.index({ employeeId: 1 });
employeeExitSchema.index({ lastWorkingDate: 1 });
employeeExitSchema.index(
  { employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ACTIVE_EMPLOYEE_EXIT_STATUSES },
    },
  }
);

const EmployeeExit = mongoose.model("EmployeeExit", employeeExitSchema);
export default EmployeeExit;
