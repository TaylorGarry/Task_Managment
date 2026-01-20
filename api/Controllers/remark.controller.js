import Remark from "../Modals/Remark.modal.js";
import Task from "../Modals/Task.modal.js";
import User from "../Modals/User.modal.js";


// export const addRemark = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { message, receiverId } = req.body;

//     if (!message) {
//       return res.status(400).json({ message: "Message is required" });
//     }

//     const sender = req.user;

//     const task = await Task.findById(taskId).select("assignedTo");
//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     let finalReceiverId = null;
//     const assignedList = task.assignedTo.map(id => String(id));  

//     // ----------------------
//     // ADMIN LOGIC
//     // ----------------------
//     if (sender.accountType === "admin") {

//       // If admin selected a receiver
//       if (receiverId) {
//         // Check if valid assigned employee
//         if (!assignedList.includes(String(receiverId))) {
//           return res.status(403).json({
//             message: "Admin can only send remarks to employees assigned to this task",
//           });
//         }

//         finalReceiverId = receiverId; // use selected ID
//       }

//       // If admin did not select a receiver
//       else {
//         if (assignedList.length === 1) {
//           // Auto-assign if only one employee assigned
//           finalReceiverId = assignedList[0];
//         } else if (assignedList.length > 1) {
//           // Multiple employees → must choose
//           return res.status(400).json({
//             message: "Multiple employees assigned — please select receiver",
//           });
//         } else {
//           // No employees assigned → global remark
//           finalReceiverId = null;
//         }
//       }
//     }

//     // ----------------------
//     // EMPLOYEE LOGIC
//     // ----------------------
//     else {
//       const admin = await User.findOne({ accountType: "admin" }).select("_id");
//       if (!admin) {
//         return res.status(500).json({ message: "Admin user not found" });
//       }

//       finalReceiverId = admin._id; // always send to admin
//     }

//     // Create remark
//     const newRemark = await Remark.create({
//       taskId,
//       senderId: sender._id,
//       receiverId: finalReceiverId,
//       message,
//     });

//     res.status(201).json({
//       message: "Remark added successfully",
//       remark: newRemark,
//     });

//   } catch (error) {
//     console.error("Create Remark Error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// export const addRemark = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { message, receiverId, sendToAll = false } = req.body;
//     const sender = req.user;

//     if (!message) {
//       return res.status(400).json({ message: "Message is required" });
//     }

//     const task = await Task.findById(taskId).select("assignedTo");
//     if (!task) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     const assignedList = task.assignedTo.map(u => String(u._id || u));
//     if (sender.accountType === "admin") {
//       let remarkPayload = {
//         taskId,
//         senderId: sender._id,
//         message
//       };
//       if (sendToAll === true) {
//         if (assignedList.length === 0) {
//           return res.status(400).json({
//             message: "No employees assigned to send remark to all"
//           });
//         }

//         remarkPayload.receiverId = null;
//         remarkPayload.isSentToAll = true;
//         remarkPayload.sentToAllCount = assignedList.length;

//         const remark = await Remark.create(remarkPayload);
//         return res.status(201).json({
//           message: `Remark sent to all ${assignedList.length} employees`,
//           remark,
//           sentToAll: true
//         });
//       }
//       if (receiverId) {
//         if (!assignedList.includes(String(receiverId))) {
//           return res.status(403).json({
//             message: "Selected employee is not assigned to this task"
//           });
//         }

//         remarkPayload.receiverId = receiverId;
//         remarkPayload.isSentToAll = false;

//         const remark = await Remark.create(remarkPayload);
//         return res.status(201).json({
//           message: "Remark added successfully",
//           remark,
//           sentToAll: false
//         });
//       }
//       if (assignedList.length === 1) {
//         remarkPayload.receiverId = assignedList[0];
//         remarkPayload.isSentToAll = false;

//         const remark = await Remark.create(remarkPayload);
//         return res.status(201).json({
//           message: "Remark added successfully",
//           remark,
//           sentToAll: false
//         });
//       }
//       if (assignedList.length > 1) {
//         return res.status(400).json({
//           message: "Multiple employees assigned — select receiver or use Send to All",
//           options: assignedList
//         });
//       }
//       remarkPayload.receiverId = null;
//       remarkPayload.isSentToAll = false;

//       const remark = await Remark.create(remarkPayload);
//       return res.status(201).json({
//         message: "Remark added successfully",
//         remark,
//         sentToAll: false
//       });
//     }
//     const admin = await User.findOne({ accountType: "admin" }).select("_id");

//     const remark = await Remark.create({
//       taskId,
//       senderId: sender._id,
//       receiverId: admin._id,
//       message,
//       isSentToAll: false
//     });
//     return res.status(201).json({
//       message: "Remark added successfully",
//       remark,
//       sentToAll: false
//     });
//   } catch (error) {
//     console.error("Create Remark Error:", error);
//     return res.status(500).json({
//       message: "Server Error",
//       error: error.message
//     });
//   }
// };

// export const getRemarksByTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const userId = req.user._id;
//     const isAdmin = req.user.accountType === "admin";
//     let filter = { taskId };
//     if (!isAdmin) {
//       filter = {
//         taskId,
//         $or: [
//           { receiverId: userId },     
//           { receiverId: null },        
//           { senderId: userId },        
//         ],
//       };
//     }
//     const remarks = await Remark.find(filter)
//       .populate("senderId", "username accountType")
//       .populate("receiverId", "username accountType")
//       .sort({ createdAt: 1 });

//     res.status(200).json(remarks);
//   } catch (error) {
//     console.error("Get Remarks Error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// export const updateRemark = async (req, res) => {
//   try {
//     const { remarkId } = req.params;
//     const { message } = req.body;

//     if (!message) {
//       return res.status(400).json({ message: "Message is required" });
//     }
//     const remark = await Remark.findById(remarkId);
//     if (!remark) {
//       return res.status(404).json({ message: "Remark not found" });
//     }
//     if (remark.senderId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "You can only edit your own remark" });
//     }
//     remark.message = message;
//     await remark.save();
//     return res.status(200).json({
//       message: "Remark updated successfully",
//       remark
//     });
//   } catch (error) {
//     console.error("Update Remark Error:", error);
//     return res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };


// export const deleteRemark = async (req, res) => {
//   try {
//     const { remarkId } = req.params;
//     const remark = await Remark.findById(remarkId);
//     if (!remark) {
//       return res.status(404).json({ message: "Remark not found" });
//     }
//     if (remark.senderId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "You can only delete your own remark" });
//     }
//     await remark.deleteOne();
//     return res.status(200).json({
//       message: "Remark deleted successfully",
//       remarkId,
//     });
//   } catch (error) {
//     console.error("Delete Remark Error:", error);
//     return res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };


export const addRemark = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message, receiverId, sendToAll = false } = req.body;
    const sender = req.user;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const task = await Task.findById(taskId).select("assignedTo");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const assignedList = task.assignedTo.map(u => String(u._id || u));

    // ✅ Allow both admin and superAdmin
    if (["admin", "superAdmin"].includes(sender.accountType)) {
      let remarkPayload = {
        taskId,
        senderId: sender._id,
        message
      };

      if (sendToAll === true) {
        if (assignedList.length === 0) {
          return res.status(400).json({
            message: "No employees assigned to send remark to all"
          });
        }

        remarkPayload.receiverId = null;
        remarkPayload.isSentToAll = true;
        remarkPayload.sentToAllCount = assignedList.length;

        const remark = await Remark.create(remarkPayload);
        return res.status(201).json({
          message: `Remark sent to all ${assignedList.length} employees`,
          remark,
          sentToAll: true
        });
      }

      if (receiverId) {
        if (!assignedList.includes(String(receiverId))) {
          return res.status(403).json({
            message: "Selected employee is not assigned to this task"
          });
        }

        remarkPayload.receiverId = receiverId;
        remarkPayload.isSentToAll = false;

        const remark = await Remark.create(remarkPayload);
        return res.status(201).json({
          message: "Remark added successfully",
          remark,
          sentToAll: false
        });
      }

      if (assignedList.length === 1) {
        remarkPayload.receiverId = assignedList[0];
        remarkPayload.isSentToAll = false;

        const remark = await Remark.create(remarkPayload);
        return res.status(201).json({
          message: "Remark added successfully",
          remark,
          sentToAll: false
        });
      }

      if (assignedList.length > 1) {
        return res.status(400).json({
          message: "Multiple employees assigned — select receiver or use Send to All",
          options: assignedList
        });
      }

      // Fallback
      remarkPayload.receiverId = null;
      remarkPayload.isSentToAll = false;
      const remark = await Remark.create(remarkPayload);
      return res.status(201).json({
        message: "Remark added successfully",
        remark,
        sentToAll: false
      });
    }

    // For normal users (non-admin/superAdmin)
    const admin = await User.findOne({ accountType: "admin" }).select("_id");
    const remark = await Remark.create({
      taskId,
      senderId: sender._id,
      receiverId: admin._id,
      message,
      isSentToAll: false
    });
    return res.status(201).json({
      message: "Remark added successfully",
      remark,
      sentToAll: false
    });
  } catch (error) {
    console.error("Create Remark Error:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

// ✅ Get remarks - allow superAdmin same as admin
export const getRemarksByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const isAdminOrSuper = ["admin", "superAdmin"].includes(req.user.accountType);

    let filter = { taskId };

    if (!isAdminOrSuper) {
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

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const remark = await Remark.findById(remarkId);
    if (!remark) {
      return res.status(404).json({ message: "Remark not found" });
    }

    if (remark.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own remark" });
    }

    remark.message = message;
    await remark.save();

    return res.status(200).json({
      message: "Remark updated successfully",
      remark
    });
  } catch (error) {
    console.error("Update Remark Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteRemark = async (req, res) => {
  try {
    const { remarkId } = req.params;
    const remark = await Remark.findById(remarkId);
    if (!remark) {
      return res.status(404).json({ message: "Remark not found" });
    }

    if (remark.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own remark" });
    }

    await remark.deleteOne();
    return res.status(200).json({
      message: "Remark deleted successfully",
      remarkId,
    });
  } catch (error) {
    console.error("Delete Remark Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
