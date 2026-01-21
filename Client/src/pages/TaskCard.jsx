import React from "react";
const TaskCard = ({ task, onStatusChange, allTasks = [] }) => {


  const normalizeDate = (dateInput) => {
  if (!dateInput) return "";

  try {
    let d;

    // Parse input
    if (dateInput instanceof Date) {
      d = dateInput;
    } else if (typeof dateInput === "string") {
      // Handle DD/MM/YYYY
      if (dateInput.includes("/")) {
        const [day, month, year] = dateInput.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
<<<<<<< HEAD
      d = new Date(dateInput);
=======
      
      if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const parts = dateInput.split('/');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2];
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      
      return '';
    } catch (error) {
      return '';
>>>>>>> keshav_dev
    }

    if (!d || isNaN(d.getTime())) return "";

    // 🔑 Convert UTC → IST
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);

    const year = ist.getFullYear();
    const month = String(ist.getMonth() + 1).padStart(2, "0");
    const day = String(ist.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Date normalization error:", error, "for:", dateInput);
    return "";
  }
};


  const formatDisplayDate = (dateInput) => {
  if (!dateInput) return "Today";

  try {
    let d;

    if (dateInput instanceof Date) {
      d = dateInput;
    } else if (typeof dateInput === "string") {
      // Handle DD/MM/YYYY
      if (dateInput.includes("/")) {
        const [day, month, year] = dateInput.split("/");
        return `${day}/${month}/${year}`;
      }
<<<<<<< HEAD
      d = new Date(dateInput);
=======
      
      return "Today";
    } catch (e) {
      return "Today";
>>>>>>> keshav_dev
    }

    if (!d || isNaN(d.getTime())) return "Today";

    // 🔑 Convert to IST
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);

    const day = String(ist.getDate()).padStart(2, "0");
    const month = String(ist.getMonth() + 1).padStart(2, "0");
    const year = ist.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Display date error:", e, "for:", dateInput);
    return "Today";
  }
};


  const taskNormalizedDate = normalizeDate(task.date);
  const taskDisplayDate = formatDisplayDate(task.date);
  
  const relatedTasks = allTasks.filter(t => {
    const tDate = normalizeDate(t.date);
    const isSameDate = tDate === taskNormalizedDate && tDate !== '';
    
    return isSameDate;
  });
  
  const startTasks = relatedTasks.filter(t => t.shift === "Start");
  const midTasks = relatedTasks.filter(t => t.shift === "Mid");
  const endTasks = relatedTasks.filter(t => t.shift === "End");

  const isTaskMissed = (taskToCheck) => {
    if (!taskToCheck) return false;
    const hasNoStatus = !taskToCheck.employeeStatus || taskToCheck.employeeStatus === "";
    const missed = hasNoStatus && taskToCheck.canUpdate === false;
    return missed;
  };

  const canTaskBeUpdated = (taskToCheck) => {
    if (!taskToCheck) return false;
    return taskToCheck.canUpdate === true;
  };

  const areAllTasksInShiftHandled = (shiftTasks) => {
    if (shiftTasks.length === 0) {
      return true;
    }
    
    const unhandledTasks = shiftTasks.filter(t => {
      const hasStatus = t.employeeStatus && t.employeeStatus !== "";
      const isMissed = isTaskMissed(t);
      return !hasStatus && !isMissed;
    });
    return unhandledTasks.length === 0;
  };

  const isCurrentTaskMissed = isTaskMissed(task);
  const canCurrentTaskBeUpdated = canTaskBeUpdated(task);
  const areAllStartTasksHandled = areAllTasksInShiftHandled(startTasks);
  const areAllMidTasksHandled = areAllTasksInShiftHandled(midTasks);

  const shouldBeBlocked = () => {
    if (isCurrentTaskMissed) {
      return false;
    }
    
    if (!canCurrentTaskBeUpdated) {
      return false;  
    }
    
    if (task.shift === "Start") {
      return false;
    }
    
    if (task.shift === "Mid") {
      const blocked = startTasks.length > 0 && !areAllStartTasksHandled;
      return blocked;
    }
    
    if (task.shift === "End") {
      const startBlocked = startTasks.length > 0 && !areAllStartTasksHandled;
      const midBlocked = midTasks.length > 0 && !areAllMidTasksHandled;
      const blocked = startBlocked || midBlocked;
      return blocked;
    }
    
    return false;
  };

  const isBlocked = shouldBeBlocked();
  const isDone = task.employeeStatus === "Done";
  const isNotDone = task.employeeStatus === "Not Done";
  const isNotUpdated = !task.employeeStatus;
  
  let displayState = "pending";
  if (isDone) displayState = "done";
  else if (isNotDone) displayState = "not-done";
  else if (isCurrentTaskMissed) displayState = "missed";
  else if (isBlocked) displayState = "blocked";
  else if (!canCurrentTaskBeUpdated && isNotUpdated) displayState = "not-yet";
  else if (isNotUpdated) displayState = "pending";


  const getBlockReason = () => {
    if (isCurrentTaskMissed) {
      if (task.shift === "Start") {
        return "Start shift time window has passed. All shifts are blocked for today.";
      } else if (task.shift === "Mid") {
        return "Mid shift time window has passed. End shift is blocked for today.";
      } else {
        return "End shift time window has passed.";
      }
    }
    
    if (isBlocked) {
      if (task.shift === "Mid") {
        const pendingStart = startTasks.filter(t => {
          const hasStatus = t.employeeStatus && t.employeeStatus !== "";
          const isMissed = isTaskMissed(t);
          return !hasStatus && !isMissed;
        });
        const missedStart = startTasks.filter(t => isTaskMissed(t));
        
        let reason = `Cannot update Mid shift. `;
        if (pendingStart.length > 0) {
          reason += `${pendingStart.length} Start shift task(s) pending completion. `;
        }
        if (missedStart.length > 0) {
          reason += `${missedStart.length} Start shift task(s) missed (time window passed).`;
        }
        return reason.trim();
        
      } else if (task.shift === "End") {
        const pendingStart = startTasks.filter(t => {
          const hasStatus = t.employeeStatus && t.employeeStatus !== "";
          const isMissed = isTaskMissed(t);
          return !hasStatus && !isMissed;
        });
        const pendingMid = midTasks.filter(t => {
          const hasStatus = t.employeeStatus && t.employeeStatus !== "";
          const isMissed = isTaskMissed(t);
          return !hasStatus && !isMissed;
        });
        const missedStart = startTasks.filter(t => isTaskMissed(t));
        const missedMid = midTasks.filter(t => isTaskMissed(t));
        
        let reason = `Cannot update End shift. `;
        
        if (pendingStart.length > 0 && pendingMid.length > 0) {
          reason += `${pendingStart.length} Start shift and ${pendingMid.length} Mid shift task(s) pending completion.`;
        } else if (pendingStart.length > 0) {
          reason += `${pendingStart.length} Start shift task(s) pending completion.`;
        } else if (pendingMid.length > 0) {
          reason += `${pendingMid.length} Mid shift task(s) pending completion.`;
        }
        
        const missedMessages = [];
        if (missedStart.length > 0) missedMessages.push(`${missedStart.length} Start shift task(s) missed`);
        if (missedMid.length > 0) missedMessages.push(`${missedMid.length} Mid shift task(s) missed`);
        
        if (missedMessages.length > 0) {
          reason += ` ${missedMessages.join(', ')} (time window passed).`;
        }
        
        return reason.trim();
      }
    }
    
    if (!canCurrentTaskBeUpdated && isNotUpdated) {
      return `Time window for ${task.shift} shift has not started yet.`;
    }
    
    return "";
  };

  const statusMessage = getBlockReason();

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "" || isCurrentTaskMissed || isBlocked || !canCurrentTaskBeUpdated) return;
    onStatusChange(task._id, value);
  };

  const handleDropdownClick = (e) => {
    if (isCurrentTaskMissed || isBlocked || !canCurrentTaskBeUpdated) e.preventDefault();
  };
  
  const handleSelectClick = (e) => {
    if (isCurrentTaskMissed || isBlocked || !canCurrentTaskBeUpdated) e.stopPropagation();
  };

    console.log("TASK CARD DEBUG:", {
  id: task._id,
  date: task.date,
  normalizedDate: taskNormalizedDate,
  shift: task.shift,
  canUpdate: task.canUpdate,
  isBlocked,
  isCurrentTaskMissed,
  employeeStatus: task.employeeStatus,
  isCoreTeamTask: task.isCoreTeamTask,
});
  return (
    <div className={`border ${
      displayState === "done" ? "border-green-300 bg-green-50" : 
      displayState === "not-done" ? "border-orange-300 bg-orange-50" :
      displayState === "missed" ? "border-red-300 bg-red-50" : 
      displayState === "blocked" ? "border-gray-200 bg-gray-100" : 
      displayState === "not-yet" ? "border-yellow-200 bg-yellow-50" :
      displayState === "pending" ? "border-gray-300 bg-gray-50" : 
      "border-[#EAEAEA] bg-white"
    } p-5 rounded-2xl shadow-sm transition-all duration-200`}>
      
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
        <div className="flex items-center space-x-2">
          {displayState === "missed" && <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">Missed</span>}
          {displayState === "blocked" && <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">Blocked</span>}
          {displayState === "not-yet" && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Not Yet</span>}
          {displayState === "pending" && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pending</span>}
          {displayState === "done" && <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Done</span>}
          {displayState === "not-done" && <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">Not Done</span>}
        </div>
      </div>

      <div className="space-y-1 text-gray-600 text-sm mb-4">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Shift:</span>
          <span className={`font-medium ${
            task.shift === "Start" ? "text-blue-600" : 
            task.shift === "Mid" ? "text-purple-600" : 
            "text-indigo-600"
          }`}>
            {task.shift} Shift{displayState === "missed" && " (Missed)"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Department:</span>
          <span>{task.department}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Priority:</span>
          <span className={`font-medium ${
            task.priority === "High" ? "text-red-600" : 
            task.priority === "Medium" ? "text-orange-600" : 
            "text-green-600"
          }`}>
            {task.priority}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Date:</span>
          <span className="text-gray-500" title={`Normalized: ${taskNormalizedDate}`}>
            {taskDisplayDate}
          </span>
        </div>
      </div>

      {(displayState === "missed" || displayState === "blocked" || displayState === "not-yet") && statusMessage && (
        <div className={`mb-3 p-3 rounded-lg ${
          displayState === "missed" ? "bg-red-50 border border-red-200" : 
          displayState === "blocked" ? "bg-gray-100 border border-gray-200" :
          "bg-yellow-50 border border-yellow-200"
        }`}>
          <div className="flex items-start">
            <div className={`text-xs ${
              displayState === "missed" ? "text-red-700" : 
              displayState === "blocked" ? "text-gray-700" :
              "text-yellow-700"
            }`}>
              <span className="font-semibold">
                {displayState === "missed" ? "Missed:" : 
                 displayState === "blocked" ? "Blocked:" : 
                 "Note:"}
              </span> {statusMessage}
              {displayState === "missed" && (
                <div className="mt-1 text-blue-500">Can update tomorrow in scheduled time slot</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <label className="font-semibold text-gray-700">Status:</label>
          {(displayState === "missed" || displayState === "blocked" || displayState === "not-yet") && (
            <span className={`text-xs font-medium ${
              displayState === "missed" ? "text-red-500" : 
              displayState === "blocked" ? "text-gray-500" :
              "text-yellow-500"
            }`}>
              {displayState === "missed" ? "Missed" : 
               displayState === "blocked" ? "Blocked" : 
               "Not Yet"}
            </span>
          )}
        </div>
        <div onClick={handleDropdownClick} className="relative">
          <select
            value={task.employeeStatus || ""}
            onChange={handleChange}
            onClick={handleSelectClick}
            disabled={displayState === "missed" || displayState === "blocked" || displayState === "not-yet"}
            className={`w-full border ${
              (displayState === "missed" || displayState === "blocked" || displayState === "not-yet") ? 
              "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed" : 
              displayState === "pending" ? "border-gray-300 text-gray-700 cursor-pointer" : 
              "border-[#EAEAEA] text-gray-700 cursor-pointer"
            } rounded-lg px-3 py-2 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all appearance-none`}
          >
            <option value="">Select status</option>
            <option value="Not Done">Not Done</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;

