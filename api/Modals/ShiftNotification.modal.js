import mongoose from "mongoose";

const shiftNotificationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shift: {
      type: String,
      enum: ["Start", "Mid", "End"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notified80: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "shift_notifications" }
);
shiftNotificationSchema.index(
  { employeeId: 1, shift: 1, date: 1 },
  { unique: true }
);

const ShiftNotification = mongoose.model(
  "ShiftNotification",
  shiftNotificationSchema
);

export default ShiftNotification;
