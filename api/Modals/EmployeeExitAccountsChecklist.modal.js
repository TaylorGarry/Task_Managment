import mongoose from "mongoose";

const employeeExitAccountsChecklistSchema = new mongoose.Schema(
  {
    exitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeExit",
      required: true,
      unique: true,
      index: true,
    },
    salaryDuesCalculated: { type: Boolean, default: false },
    incentivesCalculated: { type: Boolean, default: false },
    leaveEncashmentCalculated: { type: Boolean, default: false },
    statutoryDuesChecked: { type: Boolean, default: false },
    recoveriesAdjusted: { type: Boolean, default: false },
    fnfProcessed: { type: Boolean, default: false },
    remarks: { type: String, trim: true, default: "" },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "employee_exit_accounts_checklists" }
);

const EmployeeExitAccountsChecklist = mongoose.model(
  "EmployeeExitAccountsChecklist",
  employeeExitAccountsChecklistSchema
);

export default EmployeeExitAccountsChecklist;
