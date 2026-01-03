import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  mediaType: {
    type: String,
    enum: ["image", "file", "audio", "excel", "text", "pdf", "word", "document", ],
    default: "image"
  },
  filename: String,
  size: Number,
  width: Number,
  height: Number
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  emoji: String,
  reactedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const readBySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  readAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  content: {
    text: { type: String, default: "" },
    media: [mediaSchema]
  },

  messageType: {
    type: String,
    enum: ["text", "media", "mixed"],
    default: "text"
  },

  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  },

  forwarded: {
    type: Boolean,
    default: false
  },

  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  },

  reactions: [reactionSchema],
  readBy: [readBySchema],
  
  // ADD THESE FIELDS FOR EDIT FUNCTIONALITY:
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    text: String,
    editedAt: {
      type: Date,
      default: Date.now
    },
    _id: false
  }]
}, { 
  timestamps: true 
});

export const Message = mongoose.model("Message", messageSchema);

