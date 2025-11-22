import mongoose from "mongoose";

// mongoose.models.TaskStatus && delete mongoose.models.TaskStatus;

const taskStatusSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["Not Done", "Done"], default: "Not Done" },
  },
  { timestamps: true, collection: "taskstatuses" }  
);

taskStatusSchema.index({ taskId: 1, employeeId: 1, date: 1 });

const TaskStatus = mongoose.model("TaskStatus", taskStatusSchema);
export default TaskStatus;
