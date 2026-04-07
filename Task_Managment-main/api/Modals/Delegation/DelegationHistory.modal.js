// models/DelegationHistory.js
import mongoose from "mongoose";

const delegationHistorySchema = new mongoose.Schema(
  {
    // Reference to the delegation
    delegationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delegation",
      required: true,
    },

    // The team leader (Sam)
    delegatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who performed the action (assignee)
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of action performed
    actionType: {
      type: String,
      enum: ["attendance_update", "task_update", "snapshot_download"],
      required: true,
    },

    // For attendance updates
    affectedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // For task updates
    affectedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    // Store the details of the action
    details: {
      // Before state
      before: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      // After state
      after: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      // Additional metadata
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },

    // Date of the action
    actionDate: {
      type: Date,
      default: Date.now,
    },

    // IP address or session info (optional)
    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
delegationHistorySchema.index({ delegationId: 1, actionDate: -1 });
delegationHistorySchema.index({ delegatorId: 1, actionDate: -1 });
delegationHistorySchema.index({ assigneeId: 1, actionDate: -1 });
delegationHistorySchema.index({ actionType: 1, actionDate: -1 });
delegationHistorySchema.index({ affectedEmployeeId: 1 });
delegationHistorySchema.index({ affectedTaskId: 1 });

const DelegationHistory = mongoose.model("DelegationHistory", delegationHistorySchema);
export default DelegationHistory;