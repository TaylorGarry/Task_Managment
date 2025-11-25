import mongoose from "mongoose";

mongoose.models.Task && delete mongoose.models.Task;

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shift: {
      type: String,
      enum: ["Start", "Mid", "End"],
      default: null,
      validate: {
        validator: function (value) {
          if (this.isCoreTeamTask) return true;
          return value && ["Start", "Mid", "End"].includes(value);
        },
        message: "Shift is required for non-core tasks",
      },
    },
    department: { type: String, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    statusUnlocked: { type: Boolean, default: false },
    isCoreTeamTask: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "tasks" } 
);

taskSchema.index({ assignedTo: 1 });
taskSchema.index({ department: 1 });
taskSchema.index({ shift: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
