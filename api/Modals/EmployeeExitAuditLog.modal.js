import mongoose from "mongoose";

const employeeExitAuditLogSchema = new mongoose.Schema(
  {
    exitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeExit",
      required: true,
      index: true,
    },
    action: {
      type: String,
      trim: true,
      required: true,
    },
    oldStatus: {
      type: String,
      trim: true,
      default: "",
    },
    newStatus: {
      type: String,
      trim: true,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: "employee_exit_audit_logs" }
);

employeeExitAuditLogSchema.index({ exitId: 1, timestamp: -1 });

const EmployeeExitAuditLog = mongoose.model(
  "EmployeeExitAuditLog",
  employeeExitAuditLogSchema
);

export default EmployeeExitAuditLog;
