import mongoose from "mongoose";

const salaryRecordSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryBatch",
      required: true,
    },

    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    employeeCode: {
      type: String,
      required: true,
      trim: true,
    },

    employeeName: {
      type: String,
      required: true,
      trim: true,
    },

    pseudoName: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    joiningDate: {
      type: Date,
    },

    salaryData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

salaryRecordSchema.index(
  {
    employeeId: 1,
    month: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model("SalaryRecord", salaryRecordSchema);