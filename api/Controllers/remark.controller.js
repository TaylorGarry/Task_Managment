import Remark from "../Modals/Remark.modal.js";
import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";


export const addRemark = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, receiverId } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const sender = req.user;

    const task = await Task.findById(taskId).select("assignedTo");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    let finalReceiverId = null;
    const assignedList = task.assignedTo.map(id => String(id));  

    // ----------------------
    // ADMIN LOGIC
    // ----------------------
    if (sender.accountType === "admin") {

      // If admin selected a receiver
      if (receiverId) {
        // Check if valid assigned employee
        if (!assignedList.includes(String(receiverId))) {
          return res.status(403).json({
            message: "Admin can only send remarks to employees assigned to this task",
          });
        }

        finalReceiverId = receiverId; // use selected ID
      }

      // If admin did not select a receiver
      else {
        if (assignedList.length === 1) {
          // Auto-assign if only one employee assigned
          finalReceiverId = assignedList[0];
        } else if (assignedList.length > 1) {
          // Multiple employees → must choose
          return res.status(400).json({
            message: "Multiple employees assigned — please select receiver",
          });
        } else {
          // No employees assigned → global remark
          finalReceiverId = null;
        }
      }
    }

    // ----------------------
    // EMPLOYEE LOGIC
    // ----------------------
    else {
      const admin = await User.findOne({ accountType: "admin" }).select("_id");
      if (!admin) {
        return res.status(500).json({ message: "Admin user not found" });
      }

      finalReceiverId = admin._id; // always send to admin
    }

    // Create remark
    const newRemark = await Remark.create({
      taskId,
      senderId: sender._id,
      receiverId: finalReceiverId,
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
    const userId = req.user._id;
    const isAdmin = req.user.accountType === "admin";

    let filter = { taskId };

    if (!isAdmin) {
      filter = {
        taskId,
        $or: [
          { receiverId: userId },     
          { receiverId: null },        
          { senderId: userId },        
        ],
      };
    }

    const remarks = await Remark.find(filter)
      .populate("senderId", "username accountType")
      .populate("receiverId", "username accountType")
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