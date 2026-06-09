import mongoose from "mongoose";

mongoose.models.Announcement && delete mongoose.models.Announcement;

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "announcements",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

announcementSchema.virtual("status").get(function getStatus() {
  const expiresAt = this.expiresAt ? new Date(this.expiresAt).getTime() : 0;
  return expiresAt > Date.now() ? "active" : "expired";
});

announcementSchema.index({ expiresAt: 1, createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
