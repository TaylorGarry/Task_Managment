import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],

  chatType: {
    type: String,
    enum: ["one-to-one", "group"],
    default: "one-to-one"
  },

  groupInfo: {
    name: String,
    description: String,
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    groupPhoto: {
      url: String,
      publicId: String
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },

  isArchived: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      archivedAt: { type: Date, default: Date.now }
    }
  ],

  isMuted: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      mutedUntil: Date
    }
  ],

  customWallpaper: {
    type: String,
    default: ""
  }
}, { timestamps: true });

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model("Chat", chatSchema);
