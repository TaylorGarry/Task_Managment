import mongoose from "mongoose";

const payrollAttendanceBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    originalFileName: {
      type: String,
      trim: true,
      default: "",
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
    totalEmployees: {
      type: Number,
      default: 0,
    },
    totalAttendanceRecords: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      trim: true,
      default: "pending",
      enum: ["pending", "completed", "failed"],
    },
    failureMessage: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

payrollAttendanceBatchSchema.index({ batchId: 1 }, { unique: true });

const PayrollAttendanceBatch = mongoose.model("PayrollAttendanceBatch", payrollAttendanceBatchSchema);

export default PayrollAttendanceBatch;
