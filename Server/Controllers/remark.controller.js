import Remark from "../Modals/Remark.modal.js";

export const addRemark = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    if (!message) return res.status(400).json({ message: "Message is required" });

    const newRemark = await Remark.create({
      taskId,
      senderId: req.user._id,
      message,
    });

    res.status(201).json({
      message: "Remark added successfully",
      remark: newRemark,
    });
  } catch (error) {
    console.error("Create Remark Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getRemarksByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const remarks = await Remark.find({ taskId })
      .populate("senderId", "username accountType")
      .sort({ createdAt: 1 });

    res.status(200).json(remarks);
  } catch (error) {
    console.error("Get Remarks Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateRemark = async (req, res) => {
  try {
    const { remarkId } = req.params;
    const { message } = req.body;

    const remark = await Remark.findById(remarkId);
    if (!remark) return res.status(404).json({ message: "Remark not found" });

    if (remark.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own remark" });
    }

    remark.message = message || remark.message;
    await remark.save();

    res.status(200).json({ message: "Remark updated successfully", remark });
  } catch (error) {
    console.error("Update Remark Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};