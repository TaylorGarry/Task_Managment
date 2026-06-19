import mongoose from "mongoose";

const employeeExitHRChecklistSchema = new mongoose.Schema(
  {
    exitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeExit",
      required: true,
      unique: true,
      index: true,
    },
    exitInterviewDone: { type: Boolean, default: false },
    leaveAdjusted: { type: Boolean, default: false },
    fnfProcessed: { type: Boolean, default: false },
    experienceLetterIssued: { type: Boolean, default: false },
    relievingLetterIssued: { type: Boolean, default: false },
    documentsUploaded: { type: Boolean, default: false },
    remarks: { type: String, trim: true, default: "" },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "employee_exit_hr_checklists" }
);

const EmployeeExitHRChecklist = mongoose.model(
  "EmployeeExitHRChecklist",
  employeeExitHRChecklistSchema
);

export default EmployeeExitHRChecklist;
