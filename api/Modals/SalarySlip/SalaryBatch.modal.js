import mongoose from "mongoose";

const salaryBatchSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
    },

    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    successRows: {
      type: Number,
      default: 0,
    },

    failedRows: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Processing", "Completed", "Failed"],
      default: "Processing",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

salaryBatchSchema.index({ month: 1, year: 1 });

export default mongoose.model("SalaryBatch", salaryBatchSchema);