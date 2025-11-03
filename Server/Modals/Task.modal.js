import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shift: { type: String, enum: ["Start", "Mid", "End"], required: true },
    department: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    statusUnlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;

// import mongoose from "mongoose";

// const taskSchema = new mongoose.Schema(
//   {
//     title: { type: String, required: true, trim: true },
//     description: { type: String, trim: true },
//     assignedTo: [
//       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     ],
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

//     shift: { type: String, enum: ["Start", "Mid", "End"], required: true },
//     shiftLabel: {
//       type: String,
//       enum: ["4pm-1am", "5pm-2am", "6pm-3am", "1am-10am"],
//     },
//     department: { type: String, required: true },
//     priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
//     statusUnlocked: { type: Boolean, default: false },

//     // 🆕 Store each employee's status (employeeId → Done/Not Done)
//     statuses: {
//       type: Map,
//       of: String, // e.g. "Done" or "Not Done"
//       default: {},
//     },

//     date: { type: Date, default: () => new Date() },
//   },
//   { timestamps: true }
// );

// const Task = mongoose.model("Task", taskSchema);
// export default Task;

