import mongoose from "mongoose";

const attendanceAuditLogSchema = new mongoose.Schema(
  {
    rosterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roster",
      default: null,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    rosterEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    employeeName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    employeeCode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    supervisorName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "OVERRIDE", "BULK_UPDATE"],
      required: true,
      index: true,
    },
    field: {
      type: String,
      trim: true,
      default: "",
    },
    oldStatus: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newStatus: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    oldRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    newRemarks: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    updatedByName: {
      type: String,
      trim: true,
      default: "",
    },
    updatedByRole: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },
    device: {
      type: String,
      trim: true,
      default: "",
    },
    requestId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    branch: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: "attendance_update",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    collection: "attendance_audit_logs",
    timestamps: { createdAt: true, updatedAt: false },
  }
);

attendanceAuditLogSchema.index({ attendanceDate: -1, createdAt: -1 });
attendanceAuditLogSchema.index({ employeeId: 1, attendanceDate: -1, createdAt: -1 });
attendanceAuditLogSchema.index({ rosterEmployeeId: 1, attendanceDate: -1, createdAt: -1 });
attendanceAuditLogSchema.index({ updatedBy: 1, createdAt: -1 });
attendanceAuditLogSchema.index({ department: 1, attendanceDate: -1 });
attendanceAuditLogSchema.index({ action: 1, createdAt: -1 });
attendanceAuditLogSchema.index({
  employeeName: "text",
  employeeCode: "text",
  supervisorName: "text",
  updatedByName: "text",
  department: "text",
  branch: "text",
});

const AttendanceAuditLog = mongoose.model("AttendanceAuditLog", attendanceAuditLogSchema);

export default AttendanceAuditLog;
