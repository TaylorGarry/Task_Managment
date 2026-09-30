// models/RecurringDelegation.js
import mongoose from "mongoose";

const recurringDelegationSchema = new mongoose.Schema(
  {
    // Team Leader who has recurring week offs
    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Default assignee for recurring week offs
    defaultAssigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Whether auto-delegation is enabled
    isAutoAssign: {
      type: Boolean,
      default: true,
    },

    // Which day is week off (e.g., "Sunday", "Saturday")
    // This can be derived from roster, but storing for quick access
    weekOffDay: {
      type: String,
      default: "",
    },

    // Who last updated this setting
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Additional notes
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index
recurringDelegationSchema.index({ teamLeaderId: 1 });
recurringDelegationSchema.index({ defaultAssigneeId: 1 });

const RecurringDelegation = mongoose.model("RecurringDelegation", recurringDelegationSchema);
export default RecurringDelegation;