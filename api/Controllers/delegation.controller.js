// controllers/delegationController.js
import Delegation from "../Modals/Delegation/delegation.modal.js";
import User from "../Modals/User.modal.js";
import { getAllTeamLeaders, getTeamMembersByTeamLeader } from "../utils/teamHelper.js";
import {
  getRoleType,
  isHrDepartment,
  isTeamLeaderUser,
  normalizeDepartment,
} from "../utils/roleAccess.js";

const getUtcDayRange = (base = new Date()) => {
  const startOfDayUtc = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0, 0)
  );
  const endOfDayUtc = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 23, 59, 59, 999)
  );
  return { startOfDayUtc, endOfDayUtc };
};

const expireOldDelegations = async (extraFilter = {}) => {
  const { startOfDayUtc } = getUtcDayRange(new Date());
  await Delegation.updateMany(
    {
      status: "active",
      endDate: { $lt: startOfDayUtc },
      ...extraFilter,
    },
    { $set: { status: "expired" } }
  );
};

// In delegationController.js
export const createDelegation = async (req, res) => {
  try {
    const {
      delegatorId,
      assigneeId,
      startDate,
      endDate,
      reason,
      isRecurring,
      notes
    } = req.body;
    
    // Check if delegator exists
    const delegator = await User.findById(delegatorId);
    if (!delegator) {
      return res.status(404).json({
        success: false,
        message: "Team leader not found"
      });
    }
    
    // Check if assignee exists
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: "Assignee not found"
      });
    }

    const requester = req.user || {};
    const requesterRoleType = getRoleType(requester);
    const requesterIsPrivileged =
      isHrDepartment(requester) || requesterRoleType === "superAdmin";

    if (!requesterIsPrivileged) {
      if (!isTeamLeaderUser(requester)) {
        return res.status(403).json({
          success: false,
          message: "Only team leaders can create delegation",
        });
      }

      const requesterDepartment = normalizeDepartment(requester.department);
      const delegatorDepartment = normalizeDepartment(delegator.department);
      const assigneeDepartment = normalizeDepartment(assignee.department);
      const requesterId = String(requester._id || requester.id || "");

      if (requesterId && String(delegator._id) !== requesterId) {
        return res.status(403).json({
          success: false,
          message: "You can create delegation only for yourself",
        });
      }

      if (
        requesterDepartment &&
        (delegatorDepartment !== requesterDepartment ||
          assigneeDepartment !== requesterDepartment)
      ) {
        return res.status(403).json({
          success: false,
          message: "You can create delegation only within your own department",
        });
      }
    }
    
    // Check if delegator already has active delegation
    const existingDelegation = await Delegation.findOne({
      delegator: delegatorId,
      status: "active"
    });
    
    if (existingDelegation) {
      return res.status(400).json({
        success: false,
        message: "This team leader already has an active delegation"
      });
    }
    
    // Get all employees under this team leader for the selected start date
    const teamMembers = await getTeamMembersByTeamLeader(delegatorId, startDate || null);
    
    console.log(`Found ${teamMembers.length} team members for ${delegator.username}`);
    
    if (teamMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No employees found under team leader ${delegator.username}`
      });
    }
    
    // For delegation, store either userId or name as identifier
    const affectedEmployeeIds = teamMembers
      .map(member => member.userId)
      .filter(id => id !== null);
    
    // Also store names for reference
    const affectedEmployeeNames = teamMembers.map(member => member.name);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate or endDate"
      });
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate"
      });
    }

    // Create delegation
    const delegation = new Delegation({
      delegator: delegatorId,
      assignee: assigneeId,
      affectedEmployees: affectedEmployeeIds,
      affectedEmployeeNames: affectedEmployeeNames, // Add this field to your schema
      startDate: start,
      endDate: end,
      status: "active",
      reason,
      isRecurring: isRecurring || false,
      createdBy: req.user._id,
      notes: notes || ""
    });
    
    await delegation.save();
    
    // Populate user details for response
    await delegation.populate([
      { path: "delegator", select: "username department" },
      { path: "assignee", select: "username department" },
      { path: "createdBy", select: "username" }
    ]);
    
    res.status(201).json({
      success: true,
      message: "Delegation created successfully",
      data: {
        delegation,
        affectedEmployeesCount: teamMembers.length,
        affectedEmployees: teamMembers
      }
    });
  } catch (error) {
    console.error("Error creating delegation:", error);
    res.status(500).json({
      success: false,
      message: "Error creating delegation",
      error: error.message
    });
  }
};

// Get team members for a specific team leader
export const getTeamMembersForTeamLeader = async (req, res) => {
  try {
    const { teamLeaderId } = req.params;
    const { date } = req.query;
    
    console.log("Fetching team members for team leader:", teamLeaderId);
    
    const teamMembers = await getTeamMembersByTeamLeader(teamLeaderId, date || null);
    
    console.log(`Found ${teamMembers.length} team members`);
    
    res.json({
      success: true,
      data: teamMembers,
      count: teamMembers.length
    });
  } catch (error) {
    console.error("Error in getTeamMembersForTeamLeader:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: [],
      count: 0
    });
  }
};

// Get all team leaders (for dropdown)
export const getAllTeamLeadersForDropdown = async (req, res) => {
  try {
    const { date } = req.query || {};
    const teamLeaders = await getAllTeamLeaders(date || null);
    
    res.json({
      success: true,
      data: teamLeaders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// In your delegation controller
export const getActiveDelegations = async (req, res) => {
  try {
    console.log("=== Fetching active delegations ===");
    await expireOldDelegations();
    const now = new Date();
    const { startOfDayUtc, endOfDayUtc } = getUtcDayRange(now);
    
    const delegations = await Delegation.find({
      status: "active",
      startDate: { $lte: endOfDayUtc }, // Start date <= end of today (UTC)
      endDate: { $gte: startOfDayUtc }  // End date >= start of today (UTC)
    })
      .populate("delegator", "username department _id")
      .populate("assignee", "username department _id")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${delegations.length} active delegations`);
    console.log(`Current time: ${now}`);
    console.log(`UTC date range: ${startOfDayUtc.toISOString()} to ${endOfDayUtc.toISOString()}`);
    
    res.json({
      success: true,
      data: delegations,
      count: delegations.length,
    });
  } catch (error) {
    console.error("Error in getActiveDelegations:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: [],
      count: 0
    });
  }
};

// Similarly for getMyDelegations
export const getMyDelegations = async (req, res) => {
  try {
    console.log("=== getMyDelegations called ===");
    console.log("User:", req.user._id, req.user.username);

    await expireOldDelegations({ assignee: req.user._id });

    const delegations = await Delegation.find({ assignee: req.user._id })
      .populate("delegator", "username department _id")
      .populate("assignee", "username department _id")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${delegations.length} delegations for ${req.user.username}`);
    
    res.json({
      success: true,
      data: delegations
    });
  } catch (error) {
    console.error("Error in getMyDelegations:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
};

export const endDelegationEarly = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const delegation = await Delegation.findById(id);
    if (!delegation) {
      return res.status(404).json({
        success: false,
        message: "Delegation not found",
      });
    }

    delegation.status = "ended_early";
    delegation.endedEarlyAt = new Date();
    delegation.endedEarlyBy = req.user?._id || null;
    delegation.endedEarlyReason = reason || "Ended by admin";
    await delegation.save();

    await delegation.populate([
      { path: "delegator", select: "username department" },
      { path: "assignee", select: "username department" },
      { path: "endedEarlyBy", select: "username accountType department" },
    ]);

    res.json({
      success: true,
      message: "Delegation ended successfully",
      data: delegation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDelegationHistory = async (req, res) => {
  try {
    const { delegatorId } = req.params;

    await expireOldDelegations({ delegator: delegatorId });

    // "History" here means ended/expired delegations for a team leader.
    // (DelegationHistory collection is an audit log; UI wants past delegations.)
    const history = await Delegation.find({
      delegator: delegatorId,
      status: { $ne: "active" },
    })
      .populate("delegator", "username department _id")
      .populate("assignee", "username department _id")
      .populate("createdBy", "username _id")
      .populate("endedEarlyBy", "username accountType department _id")
      .sort({ endDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const getMyDelegations = async (req, res) => {
//   try {
//     console.log("=== Fetching my delegations ===");
//     console.log("Current user ID:", req.user._id);
    
//     const now = new Date();
    
//     // Query for delegations where current user is the assignee
//     const delegations = await Delegation.find({
//       assignee: req.user._id,
//       status: "active",
//       startDate: { $lte: now },
//       endDate: { $gte: now },
//     })
//       .populate("delegator", "username department _id")
//       .populate("assignee", "username department _id")
//       .populate("createdBy", "username")
//       .sort({ createdAt: -1 });
    
//     console.log(`Found ${delegations.length} delegations for user ${req.user.username}`);
    
//     // Also include delegations that are active but might have ended
//     const allDelegations = await Delegation.find({
//       assignee: req.user._id,
//       status: "active",
//     })
//       .populate("delegator", "username department _id")
//       .populate("assignee", "username department _id")
//       .populate("createdBy", "username")
//       .sort({ createdAt: -1 });
    
//     console.log(`Total active delegations for user: ${allDelegations.length}`);
    
//     res.json({
//       success: true,
//       data: delegations,
//     });
//   } catch (error) {
//     console.error("Error in getMyDelegations:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       data: []
//     });
//   }
// };

export const getAllDelegations = async (req, res) => {
  try {
    console.log("=== Fetching all delegations ===");
    
    const delegations = await Delegation.find({})
      .populate("delegator", "username department _id")
      .populate("assignee", "username department _id")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${delegations.length} total delegations`);
    
    res.json({
      success: true,
      data: delegations,
      count: delegations.length,
    });
  } catch (error) {
    console.error("Error in getAllDelegations:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      data: []
    });
  }
};
