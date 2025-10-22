import mongoose from "mongoose";

const taskStatusSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Not Done", "Done"], default: "Not Done" },
  },
  { timestamps: true }
);

const TaskStatus = mongoose.model("TaskStatus", taskStatusSchema);
export default TaskStatus;
