// middleware/delegationMiddleware.js
import Delegation from "../Modals/Delegation/delegation.modal.js";
import Task from "../Modals/Task.modal.js";

export const checkDelegation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { actionType, targetEmployeeId, targetTaskId } = req.body;
    
    // Check if user is a team leader who has active delegation (they can't update)
    const activeDelegationAsDelegator = await Delegation.findOne({
      delegator: userId,
      status: "active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    if (activeDelegationAsDelegator) {
      // User is a team leader who is on leave/delegated
      return res.status(403).json({
        success: false,
        message: `You cannot perform this action. Your permissions are delegated to someone else until ${activeDelegationAsDelegator.endDate.toLocaleDateString()}`,
        isDelegated: true,
        delegatedTo: activeDelegationAsDelegator.assignee
      });
    }
    
    // Check if user is an assignee handling someone's work
    const activeDelegationAsAssignee = await Delegation.findOne({
      assignee: userId,
      status: "active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate("delegator affectedEmployees");
    
    if (activeDelegationAsAssignee) {
      // User is handling delegated work
      let isAuthorized = false;
      
      // Check if action is within delegation scope
      if (actionType === "attendance_update" && targetEmployeeId) {
        // Check if target employee is in affectedEmployees list
        isAuthorized = activeDelegationAsAssignee.affectedEmployees.some(
          emp => emp && emp.toString() === targetEmployeeId
        );
      } 
      else if (actionType === "task_update" && targetTaskId) {
        // Check if task is assigned to the delegator (Sam)
        const task = await Task.findById(targetTaskId);
        if (task) {
          isAuthorized = task.assignedTo.some(
            assignee => assignee.toString() === activeDelegationAsAssignee.delegator._id.toString()
          );
        }
      }
      else if (actionType === "snapshot_download") {
        // For snapshots, allow all actions within delegation period
        isAuthorized = true;
      }
      
      if (isAuthorized) {
        // Attach delegation info to request for logging
        req.delegationContext = {
          isDelegated: true,
          delegationId: activeDelegationAsAssignee._id,
          delegatorId: activeDelegationAsAssignee.delegator._id,
          delegatorName: activeDelegationAsAssignee.delegator.username,
          validUntil: activeDelegationAsAssignee.endDate
        };
        return next();
      }
    }
    
    // No delegation restrictions, proceed normally
    next();
  } catch (error) {
    console.error("Delegation middleware error:", error);
    next();
  }
};
