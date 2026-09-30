import mongoose from "mongoose";
import Notification from "../Modals/Notification.modal.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = String(req.user?._id || req.user?.id || "");
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.status(200).json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const userId = String(req.user?._id || req.user?.id || "");
    const notificationId = String(req.params.id || "");

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as read", data: updated });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = String(req.user?._id || req.user?.id || "");
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true, readAt: now } }
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

