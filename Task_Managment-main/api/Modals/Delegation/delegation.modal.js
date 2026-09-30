// models/Delegation.js
import mongoose from "mongoose";

const delegationSchema = new mongoose.Schema(
  {
    // Who is going on leave (Team Leader)
    delegator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Who will handle the work (Assignee)
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // List of employees under the delegator (auto-fetched from roster)
    affectedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Delegation period
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ["active", "expired", "ended_early"],
      default: "active",
    },

    // Reason for delegation
    reason: {
      type: String,
      enum: ["leave", "weekoff", "custom"],
      required: true,
    },

    // For recurring week off handling
    isRecurring: {
      type: Boolean,
      default: false,
    },

    // Track previous delegation for recurring pattern
    previousDelegationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delegation",
      default: null,
    },

    // Who created this delegation
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Early termination details
    endedEarlyAt: {
      type: Date,
      default: null,
    },

    endedEarlyBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    endedEarlyReason: {
      type: String,
      default: null,
    },

    // Additional notes
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
delegationSchema.index({ delegator: 1, status: 1 });
delegationSchema.index({ assignee: 1, status: 1 });
delegationSchema.index({ startDate: 1, endDate: 1 });
delegationSchema.index({ status: 1, endDate: 1 });
delegationSchema.index({ createdBy: 1, createdAt: -1 });

// Compound index for active delegations lookup
delegationSchema.index(
  { delegator: 1, status: 1, startDate: 1, endDate: 1 },
  { partialFilterExpression: { status: "active" } }
);

const Delegation = mongoose.model("Delegation", delegationSchema);
export default Delegation;