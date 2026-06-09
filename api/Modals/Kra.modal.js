import mongoose from "mongoose";

mongoose.models.Kra && delete mongoose.models.Kra;

const kraSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    department: { type: String, required: true, trim: true, index: true },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    assignmentScope: {
      type: String,
      enum: ["department", "users"],
      default: "department",
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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "kras" }
);

kraSchema.index({ department: 1, assignmentScope: 1, isActive: 1 });
kraSchema.index({ assignedTo: 1 });
kraSchema.index({ createdAt: -1 });

const Kra = mongoose.model("Kra", kraSchema);
export default Kra;
