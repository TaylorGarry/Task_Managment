import mongoose from "mongoose";

const employeeExitNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmployeeExit",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, collection: "employee_exit_notifications" }
);

employeeExitNotificationSchema.index({ userId: 1, read: 1 });
employeeExitNotificationSchema.index({ exitId: 1, createdAt: -1 });

const EmployeeExitNotification = mongoose.model(
  "EmployeeExitNotification",
  employeeExitNotificationSchema
);

export default EmployeeExitNotification;
