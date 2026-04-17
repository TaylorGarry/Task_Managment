// routes/delegation.js
import express from "express";
import {
  createDelegation,
  getActiveDelegations,
  endDelegationEarly,
  getDelegationHistory,
  getAllTeamLeadersForDropdown,
  getTeamMembersForTeamLeader,
  getMyDelegations  // ← Import this
} from "../Controllers/delegation.controller.js";
import { authMiddleware } from "../Middlewares/auth.middleware.js";
import Delegation from "../Modals/Delegation/delegation.modal.js";
import { getRoleType, isHrDepartment, isTeamLeaderUser, normalizeDepartment } from "../utils/roleAccess.js";

const router = express.Router();
const canManageDelegation = (req, res, next) => {
  const roleType = getRoleType(req.user || {});
  const department = normalizeDepartment(req.user?.department).toLowerCase();
  const isHrOrSuperAdmin = isHrDepartment(req.user || {}) || roleType === "superAdmin";
  const isOpsMetaEmployee =
    (roleType === "agent" || roleType === "supervisor") && department === "operations";
  const isTeamLeader = isTeamLeaderUser(req.user || {});

  if (isHrOrSuperAdmin || isOpsMetaEmployee || isTeamLeader) return next();
  return res.status(403).json({ message: "Forbidden: You do not have access to delegation management" });
};
const getUtcDayRange = (base = new Date()) => {
  const startOfDayUtc = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0, 0)
  );
  const endOfDayUtc = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 23, 59, 59, 999)
  );
  return { startOfDayUtc, endOfDayUtc };
};

router.use(authMiddleware);

// ============ HR and SuperAdmin only routes ============
router.post("/", canManageDelegation, createDelegation);
router.get("/active", canManageDelegation, getActiveDelegations);
router.put("/:id/end", canManageDelegation, endDelegationEarly);
router.get("/history/:delegatorId", canManageDelegation, getDelegationHistory);

// Helper routes (accessible by HR/SuperAdmin)
router.get("/team-leaders", canManageDelegation, getAllTeamLeadersForDropdown);
router.get("/team-leaders/:teamLeaderId/members", canManageDelegation, getTeamMembersForTeamLeader);

// ============ Routes accessible by all authenticated users ============
// Get delegation where current user is assignee (for assignee dashboard)
router.get("/my-delegations", getMyDelegations);

// Get delegation where current user is the delegator (for team leaders to see who is handling their work)
router.get("/my-delegated-work", async (req, res) => {
  try {
    console.log("=== Fetching delegated work for user ===");
    console.log("User ID:", req.user._id);
    
    const now = new Date();
    const { startOfDayUtc, endOfDayUtc } = getUtcDayRange(now);
    
    // Find all active delegations where current user is the delegator
    const delegations = await Delegation.find({
      delegator: req.user._id,
      status: "active",
      startDate: { $lte: endOfDayUtc },
      endDate: { $gte: startOfDayUtc }
    }).populate("assignee", "username department _id");
    
    console.log(`Found ${delegations.length} delegations where ${req.user.username} is delegator`);
    
    res.json({
      success: true,
      data: delegations
    });
  } catch (error) {
    console.error("Error in my-delegated-work:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      data: []
    });
  }
});

// Get all delegations for current user (both as delegator and assignee)
router.get("/my-all-delegations", async (req, res) => {
  try {
    const now = new Date();
    const { startOfDayUtc, endOfDayUtc } = getUtcDayRange(now);
    
    const asDelegator = await Delegation.find({
      delegator: req.user._id,
      status: "active",
      startDate: { $lte: endOfDayUtc },
      endDate: { $gte: startOfDayUtc }
    }).populate("assignee", "username department");
    
    const asAssignee = await Delegation.find({
      assignee: req.user._id,
      status: "active",
      startDate: { $lte: endOfDayUtc },
      endDate: { $gte: startOfDayUtc }
    }).populate("delegator", "username department");
    
    res.json({
      success: true,
      data: {
        asDelegator,
        asAssignee
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
