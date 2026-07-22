
// import mongoose from "mongoose";

// const breakLogSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       enum: ["manual", "auto_idle", "system_disconnect"],
//       required: true,
//     },
//     startAt: { type: Date, required: true },
//     endAt: { type: Date, default: null },
//     durationMs: { type: Number, default: 0 },
//     meta: {
//       reason: { type: String, default: "" },
//       source: { type: String, default: "ui" },
//     },
//   },
//   { _id: false }
// );

// const punchSessionSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
//     dateKey: { type: String, required: true, index: true },
//     shiftStartAt: { type: Date, default: null },
//     shiftEndAt: { type: Date, default: null },
//     shiftEndReason: {
//       type: String,
//       enum: ["", "manual", "auto_9h", "auto_window"],
//       default: "",
//     },
//     status: {
//       type: String,
//       enum: ["not_started", "active", "ended"],
//       default: "not_started",
//     },
//     activityStatus: {
//       type: String,
//       enum: ["active", "idle_warning", "auto_break", "manual_break", "no_activity"],
//       default: "no_activity",
//     },
//     lastActivityAt: { type: Date, default: null },
//     idleWarningAt: { type: Date, default: null },
//     autoBreakStartedAt: { type: Date, default: null },
//     totalIdleMs: { type: Number, default: 0 },
//     totalBreakMs: { type: Number, default: 0 },
//     breaks: { type: [breakLogSchema], default: [] },
//     alerts: {
//       type: [
//         {
//           type: { type: String, default: "" },
//           message: { type: String, default: "" },
//           at: { type: Date, default: Date.now },
//         },
//       ],
//       default: [],
//     },
//   },
//   { timestamps: true, collection: "punch_sessions" }
// );

// punchSessionSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

// const PunchSession = mongoose.model("PunchSession", punchSessionSchema);
// export default PunchSession;




import mongoose from "mongoose";

const breakLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lunch", "bio_1", "bio_2"],
      required: true,
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
    meta: {
      reason: { type: String, default: "" },
      source: { type: String, default: "ui" },
    },
  },
  { _id: false }
);

const punchSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    shiftStartAt: { type: Date, default: null },
    shiftEndAt: { type: Date, default: null },
    shiftEndReason: {
      type: String,
      enum: ["", "manual", "auto_9h", "auto_window"],
      default: "",
    },
    status: {
      type: String,
      enum: ["not_started", "active", "ended"],
      default: "not_started",
    },
    activityStatus: {
      type: String,
      enum: ["active", "idle_warning", "auto_break", "manual_break", "no_activity"],
      default: "no_activity",
    },
    lastActivityAt: { type: Date, default: null },
    idleWarningAt: { type: Date, default: null },
    autoBreakStartedAt: { type: Date, default: null },
    totalIdleMs: { type: Number, default: 0 },
    totalBreakMs: { type: Number, default: 0 },
    breaks: { type: [breakLogSchema], default: [] },
    // Break tracking fields
    breakTracking: {
      lunch: {
        totalMs: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false },
        sessions: { type: Number, default: 0 },
      },
      bio_1: {
        totalMs: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false },
        sessions: { type: Number, default: 0 },
      },
      bio_2: {
        totalMs: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false },
        sessions: { type: Number, default: 0 },
      },
    },
    alerts: {
      type: [
        {
          type: { type: String, default: "" },
          message: { type: String, default: "" },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, collection: "punch_sessions" }
);

punchSessionSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

const PunchSession = mongoose.model("PunchSession", punchSessionSchema);
export default PunchSession;