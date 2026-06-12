// import Announcement from "../Modals/Announcement.modal.js";
// import { getRoleType } from "../utils/roleAccess.js";

// const ANNOUNCEMENT_VISIBILITY_HOURS = 72;

// const isSuperAdmin = (user = {}) => getRoleType(user) === "superAdmin";

// const getStatus = (announcement) => {
//   const expiresAt = announcement?.expiresAt ? new Date(announcement.expiresAt).getTime() : 0;
//   return expiresAt > Date.now() ? "active" : "expired";
// };

// const serializeAnnouncement = (doc) => {
//   const announcement = typeof doc?.toObject === "function" ? doc.toObject({ virtuals: true }) : doc;
//   return {
//     ...announcement,
//     status: getStatus(announcement),
//   };
// };

// const getStatusFilter = (status = "all", now = new Date()) => {
//   const normalized = String(status || "all").trim().toLowerCase();

//   if (normalized === "active") {
//     return { expiresAt: { $gt: now } };
//   }

//   if (normalized === "expired") {
//     return { expiresAt: { $lte: now } };
//   }

//   return {};
// };

// export const createAnnouncement = async (req, res) => {
//   try {
//     if (!isSuperAdmin(req.user || {})) {
//       return res.status(403).json({ message: "Only super admin can create announcements" });
//     }

//     const title = String(req.body?.title || "").trim();
//     const description = String(req.body?.description || "").trim();

//     if (!title || !description) {
//       return res.status(400).json({ message: "Title and description are required" });
//     }

//     const expiresAt = new Date(Date.now() + ANNOUNCEMENT_VISIBILITY_HOURS * 60 * 60 * 1000);

//     const announcement = await Announcement.create({
//       title,
//       description,
//       expiresAt,
//       createdBy: req.user._id,
//       updatedBy: req.user._id,
//     });

//     return res.status(201).json({
//       message: "Announcement created successfully",
//       announcement: serializeAnnouncement(announcement),
//     });
//   } catch (error) {
//     console.error("Create announcement error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const updateAnnouncement = async (req, res) => {
//   try {
//     if (!isSuperAdmin(req.user || {})) {
//       return res.status(403).json({ message: "Only super admin can update announcements" });
//     }

//     const { id } = req.params;
//     const existing = await Announcement.findById(id);

//     if (!existing) {
//       return res.status(404).json({ message: "Announcement not found" });
//     }

//     const title = req.body?.title !== undefined ? String(req.body.title || "").trim() : existing.title;
//     const description =
//       req.body?.description !== undefined
//         ? String(req.body.description || "").trim()
//         : existing.description;

//     if (!title || !description) {
//       return res.status(400).json({ message: "Title and description are required" });
//     }

//     existing.title = title;
//     existing.description = description;
//     existing.updatedBy = req.user._id;
//     await existing.save();

//     return res.status(200).json({
//       message: "Announcement updated successfully",
//       announcement: serializeAnnouncement(existing),
//     });
//   } catch (error) {
//     console.error("Update announcement error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const deleteAnnouncement = async (req, res) => {
//   try {
//     if (!isSuperAdmin(req.user || {})) {
//       return res.status(403).json({ message: "Only super admin can delete announcements" });
//     }

//     const { id } = req.params;
//     const existing = await Announcement.findById(id);

//     if (!existing) {
//       return res.status(404).json({ message: "Announcement not found" });
//     }

//     await Announcement.deleteOne({ _id: id });

//     return res.status(200).json({
//       message: "Announcement deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete announcement error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const getAnnouncements = async (req, res) => {
//   try {
//     const now = new Date();
//     const roleType = getRoleType(req.user || {});
//     const isAdmin = roleType === "superAdmin";
//     const statusFilter = isAdmin ? getStatusFilter(req.query?.status, now) : getStatusFilter("active", now);

//     const announcements = await Announcement.find(statusFilter).sort({ createdAt: -1 }).lean();
//     const normalized = announcements.map((announcement) => ({
//       ...announcement,
//       status: getStatus(announcement),
//     }));

//     return res.status(200).json({
//       message: "Announcements fetched successfully",
//       announcements: normalized,
//     });
//   } catch (error) {
//     console.error("Get announcements error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const getAnnouncementStats = async (req, res) => {
//   try {
//     if (!isSuperAdmin(req.user || {})) {
//       return res.status(403).json({ message: "Only super admin can access announcement stats" });
//     }

//     const now = new Date();
//     const [activeCount, expiredCount, totalCount] = await Promise.all([
//       Announcement.countDocuments({ expiresAt: { $gt: now } }),
//       Announcement.countDocuments({ expiresAt: { $lte: now } }),
//       Announcement.countDocuments({}),
//     ]);

//     return res.status(200).json({
//       message: "Announcement stats fetched successfully",
//       stats: {
//         activeCount,
//         expiredCount,
//         totalCount,
//       },
//     });
//   } catch (error) {
//     console.error("Get announcement stats error:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import Announcement from "../Modals/Announcement.modal.js";
import { getRoleType } from "../utils/roleAccess.js";

const ANNOUNCEMENT_VISIBILITY_HOURS = 72;

const isSuperAdmin = (user = {}) => getRoleType(user) === "superAdmin";

const getStatus = (announcement) => {
  const expiresAt = announcement?.expiresAt ? new Date(announcement.expiresAt).getTime() : 0;
  return expiresAt > Date.now() ? "active" : "expired";
};

const serializeAnnouncement = (doc) => {
  const announcement = typeof doc?.toObject === "function" ? doc.toObject({ virtuals: true }) : doc;
  return {
    ...announcement,
    status: getStatus(announcement),
  };
};

const getStatusFilter = (status = "all", now = new Date()) => {
  const normalized = String(status || "all").trim().toLowerCase();

  if (normalized === "active") {
    return { expiresAt: { $gt: now } };
  }

  if (normalized === "expired") {
    return { expiresAt: { $lte: now } };
  }

  return {};
};

export const createAnnouncement = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can create announcements" });
    }

    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const expiresAt = new Date(Date.now() + ANNOUNCEMENT_VISIBILITY_HOURS * 60 * 60 * 1000);

    const announcement = await Announcement.create({
      title,
      description,
      expiresAt,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      message: "Announcement created successfully",
      announcement: serializeAnnouncement(announcement),
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can update announcements" });
    }

    const { id } = req.params;
    const existing = await Announcement.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const title = req.body?.title !== undefined ? String(req.body.title || "").trim() : existing.title;
    const description =
      req.body?.description !== undefined
        ? String(req.body.description || "").trim()
        : existing.description;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    existing.title = title;
    existing.description = description;
    existing.updatedBy = req.user._id;
    await existing.save();

    return res.status(200).json({
      message: "Announcement updated successfully",
      announcement: serializeAnnouncement(existing),
    });
  } catch (error) {
    console.error("Update announcement error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can delete announcements" });
    }

    const { id } = req.params;
    const existing = await Announcement.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    await Announcement.deleteOne({ _id: id });

    return res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const now = new Date();
    const roleType = getRoleType(req.user || {});
    const isAdmin = roleType === "superAdmin";
    const viewMode = String(req.query?.view || "").trim().toLowerCase();
    const wantsHistory = viewMode === "history" || viewMode === "all";
    const statusFilter = wantsHistory
      ? getStatusFilter("all", now)
      : isAdmin
        ? getStatusFilter(req.query?.status, now)
        : getStatusFilter("active", now);

    const announcements = await Announcement.find(statusFilter).sort({ createdAt: -1 }).lean();
    const normalized = announcements.map((announcement) => ({
      ...announcement,
      status: getStatus(announcement),
    }));

    return res.status(200).json({
      message: "Announcements fetched successfully",
      announcements: normalized,
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAnnouncementStats = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can access announcement stats" });
    }

    const now = new Date();
    const [activeCount, expiredCount, totalCount] = await Promise.all([
      Announcement.countDocuments({ expiresAt: { $gt: now } }),
      Announcement.countDocuments({ expiresAt: { $lte: now } }),
      Announcement.countDocuments({}),
    ]);

    return res.status(200).json({
      message: "Announcement stats fetched successfully",
      stats: {
        activeCount,
        expiredCount,
        totalCount,
      },
    });
  } catch (error) {
    console.error("Get announcement stats error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
