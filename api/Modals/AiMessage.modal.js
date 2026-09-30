import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "AiConversation", required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "tool"],
      required: true,
    },
    text: { type: String, default: "" },
    toolName: { type: String, trim: true, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

aiMessageSchema.index({ owner: 1, conversation: 1, createdAt: 1 });
aiMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("AiMessage", aiMessageSchema);
