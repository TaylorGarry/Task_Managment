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
import { authMiddleware, checkRole } from "../Middlewares/auth.middleware.js";
import Delegation from "../Modals/Delegation/delegation.modal.js";

const router = express.Router();
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
router.post("/", checkRole(["HR", "superAdmin"]), createDelegation);
router.get("/active", checkRole(["HR", "superAdmin"]), getActiveDelegations);
router.put("/:id/end", checkRole(["HR", "superAdmin"]), endDelegationEarly);
router.get("/history/:delegatorId", checkRole(["HR", "superAdmin"]), getDelegationHistory);

// Helper routes (accessible by HR/SuperAdmin)
router.get("/team-leaders", checkRole(["HR", "superAdmin"]), getAllTeamLeadersForDropdown);
router.get("/team-leaders/:teamLeaderId/members", checkRole(["HR", "superAdmin"]), getTeamMembersForTeamLeader);

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
