import mongoose from "mongoose";

const remarkSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, 
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Remark = mongoose.model("Remark", remarkSchema);
export default Remark;
