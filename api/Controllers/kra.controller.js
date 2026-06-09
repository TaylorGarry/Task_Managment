import mongoose from "mongoose";
import Kra from "../Modals/Kra.modal.js";
import User from "../Modals/User.modal.js";
import { getRoleType, normalizeDepartment } from "../utils/roleAccess.js";

const parseIdList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((id) => String(id).trim()).filter(Boolean);

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((id) => String(id).trim()).filter(Boolean);
      }
    } catch {
      // fall back to comma-separated parsing
    }

    return trimmed
      .split(",")
      .map((id) => String(id).trim())
      .filter(Boolean);
  }

  return [String(value).trim()].filter(Boolean);
};

const normalizeObjectIdList = (values = []) => {
  const uniqueValues = [...new Set((Array.isArray(values) ? values : []).map((id) => String(id).trim()).filter(Boolean))];
  return uniqueValues.filter((id) => mongoose.Types.ObjectId.isValid(id));
};

const isSuperAdmin = (user = {}) => getRoleType(user) === "superAdmin";

const isSameDepartment = (left = "", right = "") =>
  normalizeDepartment(left).toLowerCase() === normalizeDepartment(right).toLowerCase();

const buildAccessibleFilter = (user) => {
  if (isSuperAdmin(user)) {
    return { isActive: true };
  }

  const department = normalizeDepartment(user?.department);
  return {
    isActive: true,
    $or: [
      { assignedTo: user._id },
      {
        assignmentScope: "department",
        department,
      },
    ],
  };
};

const populateKraQuery = (query) =>
  query
    .populate("assignedTo", "_id username department accountType isActive")
    .populate("createdBy", "_id username department accountType")
    .populate("updatedBy", "_id username department accountType");

export const createKra = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can create KRA" });
    }

    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const department = normalizeDepartment(req.body?.department || "");
    const assignedToIds = normalizeObjectIdList(parseIdList(req.body?.assignedTo));

    if (!title || !department) {
      return res.status(400).json({ message: "Title and department are required" });
    }

    let assignedUsers = [];
    if (assignedToIds.length) {
      assignedUsers = await User.find({
        _id: { $in: assignedToIds },
      }).select("_id department isActive accountType username");

      const validUsers = assignedUsers.filter((user) => isSameDepartment(user.department, department));
      if (validUsers.length !== assignedUsers.length) {
        return res.status(400).json({
          message: "All assigned users must belong to the selected department",
        });
      }

      assignedUsers = validUsers;
      if (!assignedUsers.length) {
        return res.status(404).json({ message: "No valid users found for this KRA" });
      }
    }

    const kra = await Kra.create({
      title,
      description,
      department,
      assignedTo: assignedUsers.map((user) => user._id),
      assignmentScope: assignedUsers.length ? "users" : "department",
      createdBy: req.user._id,
      updatedBy: req.user._id,
      isActive: true,
    });

    const createdKra = await populateKraQuery(Kra.findById(kra._id).lean());

    return res.status(201).json({
      message: "KRA created successfully",
      kra: createdKra,
    });
  } catch (error) {
    console.error("Create KRA Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getKras = async (req, res) => {
  try {
    const { department, assignedTo, includeInactive = "false" } = req.query || {};
    const filter = isSuperAdmin(req.user || {})
      ? {}
      : buildAccessibleFilter(req.user);

    if (String(includeInactive).toLowerCase() !== "true") {
      filter.isActive = true;
    }

    if (department) {
      filter.department = normalizeDepartment(department);
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const kras = await populateKraQuery(
      Kra.find(filter).sort({ createdAt: -1 }).lean()
    );

    return res.status(200).json({
      message: "KRA list fetched successfully",
      kras,
    });
  } catch (error) {
    console.error("Get KRA Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getKraById = async (req, res) => {
  try {
    const { id } = req.params;
    const kra = await populateKraQuery(Kra.findById(id).lean());

    if (!kra) {
      return res.status(404).json({ message: "KRA not found" });
    }

    if (!isSuperAdmin(req.user || {})) {
      const userDepartment = normalizeDepartment(req.user?.department);
      const isAssigned = Array.isArray(kra.assignedTo)
        ? kra.assignedTo.some((user) => String(user?._id || user) === String(req.user._id))
        : false;
      const isDepartmentWide = kra.assignmentScope === "department" &&
        isSameDepartment(kra.department, userDepartment);

      if (!isAssigned && !isDepartmentWide) {
        return res.status(403).json({ message: "You are not allowed to view this KRA" });
      }
    }

    return res.status(200).json({
      message: "KRA fetched successfully",
      kra,
    });
  } catch (error) {
    console.error("Get KRA By ID Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateKra = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can update KRA" });
    }

    const { id } = req.params;
    const existing = await Kra.findById(id).lean();

    if (!existing) {
      return res.status(404).json({ message: "KRA not found" });
    }

    const title = req.body?.title !== undefined ? String(req.body.title || "").trim() : existing.title;
    const description =
      req.body?.description !== undefined
        ? String(req.body.description || "").trim()
        : existing.description;
    const department =
      req.body?.department !== undefined
        ? normalizeDepartment(req.body.department || "")
        : existing.department;
    const assignedToIds =
      req.body?.assignedTo !== undefined
        ? normalizeObjectIdList(parseIdList(req.body.assignedTo))
        : existing.assignedTo.map((item) => String(item));

    if (!title || !department) {
      return res.status(400).json({ message: "Title and department are required" });
    }

    let assignedUsers = [];
    if (assignedToIds.length) {
      assignedUsers = await User.find({ _id: { $in: assignedToIds } }).select(
        "_id department isActive accountType username"
      );

      const validUsers = assignedUsers.filter((user) => isSameDepartment(user.department, department));
      if (validUsers.length !== assignedUsers.length) {
        return res.status(400).json({
          message: "All assigned users must belong to the selected department",
        });
      }

      assignedUsers = validUsers;
      if (!assignedUsers.length) {
        return res.status(404).json({ message: "No valid users found for this KRA" });
      }
    }

    const updatedKra = await Kra.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          description,
          department,
          assignedTo: assignedUsers.map((user) => user._id),
          assignmentScope: assignedUsers.length ? "users" : "department",
          updatedBy: req.user._id,
        },
      },
      { new: true }
    );

    const populatedKra = await populateKraQuery(Kra.findById(updatedKra._id).lean());

    return res.status(200).json({
      message: "KRA updated successfully",
      kra: populatedKra,
    });
  } catch (error) {
    console.error("Update KRA Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteKra = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user || {})) {
      return res.status(403).json({ message: "Only super admin can delete KRA" });
    }

    const { id } = req.params;
    const existing = await Kra.findById(id).lean();

    if (!existing) {
      return res.status(404).json({ message: "KRA not found" });
    }

    await Kra.findByIdAndDelete(id);

    return res.status(200).json({
      message: "KRA deleted successfully",
      kraId: id,
    });
  } catch (error) {
    console.error("Delete KRA Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
