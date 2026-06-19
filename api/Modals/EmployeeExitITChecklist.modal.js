import mongoose from "mongoose";

const employeeExitITChecklistSchema = new mongoose.Schema(
  {
    exitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeExit",
      required: true,
      unique: true,
      index: true,
    },
    laptopReturned: { type: Boolean, default: false },
    chargerReturned: { type: Boolean, default: false },
    idCardReturned: { type: Boolean, default: false },
    mouseReturned: { type: Boolean, default: false },
    simReturned: { type: Boolean, default: false },
    otherAssetsReturned: { type: Boolean, default: false },
    emailDisabled: { type: Boolean, default: false },
    crmAccessRemoved: { type: Boolean, default: false },
    gatePunchRemoved: { type: Boolean, default: false },
    vpnRemoved: { type: Boolean, default: false },
    githubRemoved: { type: Boolean, default: false },
    googleWorkspaceRemoved: { type: Boolean, default: false },
    slackRemoved: { type: Boolean, default: false },
    remarks: { type: String, trim: true, default: "" },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "employee_exit_it_checklists" }
);

const EmployeeExitITChecklist = mongoose.model(
  "EmployeeExitITChecklist",
  employeeExitITChecklistSchema
);

export default EmployeeExitITChecklist;
