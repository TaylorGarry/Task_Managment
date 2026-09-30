import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, default: "AI Assistant" },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  { timestamps: true }
);

aiConversationSchema.index({ owner: 1, status: 1, lastMessageAt: -1 });
aiConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("AiConversation", aiConversationSchema);
