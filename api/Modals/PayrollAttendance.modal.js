import mongoose from "mongoose";

const payrollAttendanceSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    empId: {
      type: String,
      trim: true,
      default: "",
    },
    employeeName: {
      type: String,
      trim: true,
      default: "",
    },
    pseudoName: {
      type: String,
      trim: true,
      default: "",
    },
    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      trim: true,
      required: true,
      enum: ["P", "WO", "L", "NCNS", "UL", "LWP", "BL", "H", "LWD", "HD", "OT", "FWO"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadMonth: {
      type: Number,
      required: true,
      index: true,
    },
    uploadYear: {
      type: Number,
      required: true,
      index: true,
    },
    source: {
      type: String,
      trim: true,
      default: "accounts_excel",
      enum: ["accounts_excel"],
    },
    originalRowNumber: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

payrollAttendanceSchema.index({ userId: 1, attendanceDate: 1 }, { unique: true });
payrollAttendanceSchema.index({ batchId: 1 });
payrollAttendanceSchema.index({ uploadYear: 1, uploadMonth: 1 });
payrollAttendanceSchema.index({ attendanceDate: 1 });

const PayrollAttendance = mongoose.model("PayrollAttendance", payrollAttendanceSchema);

export default PayrollAttendance;
