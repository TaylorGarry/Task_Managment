import React from "react";
const TaskCard = ({ task, onStatusChange, allTasks = [] }) => {
  const normalizeDate = (dateInput) => {
    if (!dateInput) return '';
    
    try {
      if (dateInput instanceof Date) {
        return dateInput.toISOString().split('T')[0];
      }
      
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
      console.error('Date normalization error:', error, 'for:', dateInput);
      return '';
    }
  };

  const formatDisplayDate = (dateInput) => {
    if (!dateInput) return "Today";
    
    try {
      let d;
      
      if (dateInput instanceof Date) {
        d = dateInput;
      } else if (typeof dateInput === 'string') {
        if (dateInput.includes('/')) {
          const parts = dateInput.split('/');
          if (parts.length === 3) {
            d = new Date(parts[2], parts[1] - 1, parts[0]);
          } else if (parts.length === 3 && parts[0].length === 4) {
            d = new Date(dateInput);
          }
        } else if (dateInput.includes('-')) {
          d = new Date(dateInput);
        }
      }
      
      if (!d || isNaN(d.getTime())) {
        d = new Date(dateInput);
      }
      
      if (d && !isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return "Today";
    } catch (e) {
      console.error('Display date error:', e);
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

// import React from "react";

// const TaskCard = ({ task, onStatusChange, allTasks = [] }) => {
//   // Helper to get current user from localStorage
//   const getCurrentUser = () => {
//     try {
//       const userStr = localStorage.getItem("user");
//       return userStr ? JSON.parse(userStr) : null;
//     } catch (error) {
//       console.error("Error getting user from localStorage:", error);
//       return null;
//     }
//   };

//   // Get user info to check if this is a 1 AM shift worker
//   const user = getCurrentUser();
//   const is1AMShiftWorker = user?.shiftStartHour === 1 && user?.shiftEndHour === 10;
  
//   // Enhanced date normalization that accounts for 1 AM shift workers
//   const normalizeDate = (dateInput, forDisplay = false) => {
//     if (!dateInput) return '';
    
//     try {
//       if (dateInput instanceof Date) {
//         const date = new Date(dateInput);
        
//         // CRITICAL FIX: For 1 AM shift workers, adjust the date for grouping
//         if (is1AMShiftWorker && !forDisplay) {
//           // For grouping logic, 1 AM shift workers on Dec 19 should group with Dec 18 tasks
//           const now = new Date();
//           const currentHour = now.getHours();
          
//           // If current time is between 1 AM and 11:59 AM on Dec 19,
//           // 1 AM shift workers are working on Dec 18 tasks
//           if (currentHour >= 1 && currentHour < 12) {
//             const yesterday = new Date(date);
//             yesterday.setDate(yesterday.getDate() - 1);
//             return yesterday.toISOString().split('T')[0];
//           }
//         }
        
//         return date.toISOString().split('T')[0];
//       }
      
//       if (typeof dateInput === 'string' && dateInput.includes('/')) {
//         const parts = dateInput.split('/');
//         if (parts.length === 3) {
//           const day = parseInt(parts[0], 10);
//           const month = parseInt(parts[1], 10) - 1;
//           const year = parseInt(parts[2], 10);
//           const date = new Date(year, month, day);
          
//           // CRITICAL FIX: For 1 AM shift workers, adjust the date for grouping
//           if (is1AMShiftWorker && !forDisplay) {
//             const now = new Date();
//             const currentHour = now.getHours();
            
//             if (currentHour >= 1 && currentHour < 12) {
//               date.setDate(date.getDate() - 1);
//             }
//           }
          
//           return date.toISOString().split('T')[0];
//         }
//       }
      
//       const d = new Date(dateInput);
//       if (!isNaN(d.getTime())) {
//         // CRITICAL FIX: For 1 AM shift workers, adjust the date for grouping
//         if (is1AMShiftWorker && !forDisplay) {
//           const now = new Date();
//           const currentHour = now.getHours();
          
//           if (currentHour >= 1 && currentHour < 12) {
//             d.setDate(d.getDate() - 1);
//           }
//         }
        
//         return d.toISOString().split('T')[0];
//       }
      
//       return '';
//     } catch (error) {
//       console.error('Date normalization error:', error, 'for:', dateInput);
//       return '';
//     }
//   };

//   // Enhanced display date formatting
//   const formatDisplayDate = (dateInput) => {
//     if (!dateInput) return "Today";
    
//     try {
//       let d;
      
//       if (dateInput instanceof Date) {
//         d = new Date(dateInput);
//       } else if (typeof dateInput === 'string') {
//         if (dateInput.includes('/')) {
//           const parts = dateInput.split('/');
//           if (parts.length === 3) {
//             d = new Date(parts[2], parts[1] - 1, parts[0]);
//           }
//         } else if (dateInput.includes('-')) {
//           d = new Date(dateInput);
//         }
//       }
      
//       if (!d || isNaN(d.getTime())) {
//         d = new Date(dateInput);
//       }
      
//       if (d && !isNaN(d.getTime())) {
//         // CRITICAL FIX: For 1 AM shift workers, show the actual task date
//         // (which will be yesterday's date if they're working at 2 AM today)
//         if (is1AMShiftWorker) {
//           const now = new Date();
//           const currentHour = now.getHours();
          
//           // If it's between 1 AM and 11:59 AM, they're working on yesterday's tasks
//           if (currentHour >= 1 && currentHour < 12) {
//             const displayDate = new Date(d);
//             displayDate.setDate(displayDate.getDate() + 1);
            
//             const day = String(displayDate.getDate()).padStart(2, '0');
//             const month = String(displayDate.getMonth() + 1).padStart(2, '0');
//             const year = displayDate.getFullYear();
            
//             // Add indicator that this is yesterday's task
//             return `${day}/${month}/${year} (Previous Day)`;
//           }
//         }
        
//         const day = String(d.getDate()).padStart(2, '0');
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const year = d.getFullYear();
//         return `${day}/${month}/${year}`;
//       }
      
//       return "Today";
//     } catch (e) {
//       console.error('Display date error:', e);
//       return "Today";
//     }
//   };

//   // CRITICAL FIX: Use different normalization for grouping vs display
//   const taskGroupingDate = normalizeDate(task.date, false); // For grouping/task dependencies
//   const taskDisplayDate = formatDisplayDate(task.date);     // For UI display
  
//   // Group related tasks using the adjusted date for 1 AM shift workers
//   const relatedTasks = allTasks.filter(t => {
//     const tDate = normalizeDate(t.date, false); // Use grouping normalization
//     const isSameDate = tDate === taskGroupingDate && tDate !== '';
    
//     return isSameDate;
//   });
  
//   const startTasks = relatedTasks.filter(t => t.shift === "Start");
//   const midTasks = relatedTasks.filter(t => t.shift === "Mid");
//   const endTasks = relatedTasks.filter(t => t.shift === "End");

//   const isTaskMissed = (taskToCheck) => {
//     if (!taskToCheck) return false;
//     const hasNoStatus = !taskToCheck.employeeStatus || taskToCheck.employeeStatus === "";
//     const missed = hasNoStatus && taskToCheck.canUpdate === false;
//     return missed;
//   };

//   const canTaskBeUpdated = (taskToCheck) => {
//     if (!taskToCheck) return false;
//     return taskToCheck.canUpdate === true;
//   };

//   const areAllTasksInShiftHandled = (shiftTasks) => {
//     if (shiftTasks.length === 0) {
//       return true;
//     }
    
//     const unhandledTasks = shiftTasks.filter(t => {
//       const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//       const isMissed = isTaskMissed(t);
//       const canUpdate = canTaskBeUpdated(t);
      
//       // CRITICAL FIX: Only consider tasks that can be updated now as "blocking"
//       // Tasks that are in future time windows don't block current tasks
//       return !hasStatus && !isMissed && canUpdate;
//     });
    
//     return unhandledTasks.length === 0;
//   };

//   const isCurrentTaskMissed = isTaskMissed(task);
//   const canCurrentTaskBeUpdated = canTaskBeUpdated(task);
//   const areAllStartTasksHandled = areAllTasksInShiftHandled(startTasks);
//   const areAllMidTasksHandled = areAllTasksInShiftHandled(midTasks);

//   const shouldBeBlocked = () => {
//     if (isCurrentTaskMissed) {
//       return false;
//     }
    
//     if (!canCurrentTaskBeUpdated) {
//       return false;  
//     }
    
//     if (task.shift === "Start") {
//       return false;
//     }
    
//     if (task.shift === "Mid") {
//       const blocked = startTasks.length > 0 && !areAllStartTasksHandled;
//       return blocked;
//     }
    
//     if (task.shift === "End") {
//       const startBlocked = startTasks.length > 0 && !areAllStartTasksHandled;
//       const midBlocked = midTasks.length > 0 && !areAllMidTasksHandled;
//       const blocked = startBlocked || midBlocked;
//       return blocked;
//     }
    
//     return false;
//   };

//   const isBlocked = shouldBeBlocked();
//   const isDone = task.employeeStatus === "Done";
//   const isNotDone = task.employeeStatus === "Not Done";
//   const isNotUpdated = !task.employeeStatus;
  
//   let displayState = "pending";
//   if (isDone) displayState = "done";
//   else if (isNotDone) displayState = "not-done";
//   else if (isCurrentTaskMissed) displayState = "missed";
//   else if (isBlocked) displayState = "blocked";
//   else if (!canCurrentTaskBeUpdated && isNotUpdated) displayState = "not-yet";
//   else if (isNotUpdated) displayState = "pending";

//   const getBlockReason = () => {
//     if (isCurrentTaskMissed) {
//       if (task.shift === "Start") {
//         return "Start shift time window has passed. All shifts are blocked for today.";
//       } else if (task.shift === "Mid") {
//         return "Mid shift time window has passed. End shift is blocked for today.";
//       } else {
//         return "End shift time window has passed.";
//       }
//     }
    
//     if (isBlocked) {
//       if (task.shift === "Mid") {
//         const pendingStart = startTasks.filter(t => {
//           const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//           const isMissed = isTaskMissed(t);
//           const canUpdate = canTaskBeUpdated(t);
//           return !hasStatus && !isMissed && canUpdate;
//         });
        
//         let reason = `Cannot update Mid shift. `;
//         if (pendingStart.length > 0) {
//           reason += `${pendingStart.length} Start shift task(s) pending completion.`;
//         }
//         return reason.trim();
        
//       } else if (task.shift === "End") {
//         const pendingStart = startTasks.filter(t => {
//           const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//           const isMissed = isTaskMissed(t);
//           const canUpdate = canTaskBeUpdated(t);
//           return !hasStatus && !isMissed && canUpdate;
//         });
        
//         const pendingMid = midTasks.filter(t => {
//           const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//           const isMissed = isTaskMissed(t);
//           const canUpdate = canTaskBeUpdated(t);
//           return !hasStatus && !isMissed && canUpdate;
//         });
        
//         let reason = `Cannot update End shift. `;
        
//         if (pendingStart.length > 0 && pendingMid.length > 0) {
//           reason += `${pendingStart.length} Start shift and ${pendingMid.length} Mid shift task(s) pending completion.`;
//         } else if (pendingStart.length > 0) {
//           reason += `${pendingStart.length} Start shift task(s) pending completion.`;
//         } else if (pendingMid.length > 0) {
//           reason += `${pendingMid.length} Mid shift task(s) pending completion.`;
//         }
        
//         return reason.trim();
//       }
//     }
    
//     if (!canCurrentTaskBeUpdated && isNotUpdated) {
//       // Special message for 1 AM shift workers
//       if (is1AMShiftWorker) {
//         const now = new Date();
//         const currentHour = now.getHours();
        
//         if (currentHour < 1) {
//           return `Time window for ${task.shift} shift starts at 01:00 AM.`;
//         }
//       }
//       return `Time window for ${task.shift} shift has not started yet.`;
//     }
    
//     return "";
//   };

//   const statusMessage = getBlockReason();

//   const handleChange = (e) => {
//     const value = e.target.value;
//     if (value === "" || isCurrentTaskMissed || isBlocked || !canCurrentTaskBeUpdated) return;
//     onStatusChange(task._id, value);
//   };

//   const handleDropdownClick = (e) => {
//     if (isCurrentTaskMissed || isBlocked || !canCurrentTaskBeUpdated) e.preventDefault();
//   };
  
//   const handleSelectClick = (e) => {
//     if (isCurrentTaskMissed || isBlocked || !canCurrentTaskBeUpdated) e.stopPropagation();
//   };

//   return (
//     <div className={`border ${
//       displayState === "done" ? "border-green-300 bg-green-50" : 
//       displayState === "not-done" ? "border-orange-300 bg-orange-50" :
//       displayState === "missed" ? "border-red-300 bg-red-50" : 
//       displayState === "blocked" ? "border-gray-200 bg-gray-100" : 
//       displayState === "not-yet" ? "border-yellow-200 bg-yellow-50" :
//       displayState === "pending" ? "border-gray-300 bg-gray-50" : 
//       "border-[#EAEAEA] bg-white"
//     } p-5 rounded-2xl shadow-sm transition-all duration-200`}>
      
//       <div className="flex justify-between items-start mb-3">
//         <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
//         <div className="flex items-center space-x-2">
//           {displayState === "missed" && <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">Missed</span>}
//           {displayState === "blocked" && <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">Blocked</span>}
//           {displayState === "not-yet" && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Not Yet</span>}
//           {displayState === "pending" && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">Pending</span>}
//           {displayState === "done" && <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Done</span>}
//           {displayState === "not-done" && <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">Not Done</span>}
//           {is1AMShiftWorker && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">1AM Shift</span>}
//         </div>
//       </div>

//       <div className="space-y-1 text-gray-600 text-sm mb-4">
//         <div className="flex justify-between">
//           <span className="font-semibold text-gray-700">Shift:</span>
//           <span className={`font-medium ${
//             task.shift === "Start" ? "text-blue-600" : 
//             task.shift === "Mid" ? "text-purple-600" : 
//             "text-indigo-600"
//           }`}>
//             {task.shift} Shift{displayState === "missed" && " (Missed)"}
//           </span>
//         </div>
//         <div className="flex justify-between">
//           <span className="font-semibold text-gray-700">Department:</span>
//           <span>{task.department}</span>
//         </div>
//         <div className="flex justify-between">
//           <span className="font-semibold text-gray-700">Priority:</span>
//           <span className={`font-medium ${
//             task.priority === "High" ? "text-red-600" : 
//             task.priority === "Medium" ? "text-orange-600" : 
//             "text-green-600"
//           }`}>
//             {task.priority}
//           </span>
//         </div>
//         <div className="flex justify-between">
//           <span className="font-semibold text-gray-700">Date:</span>
//           <span className="text-gray-500" title={`Grouping Date: ${taskGroupingDate}`}>
//             {taskDisplayDate}
//           </span>
//         </div>
//       </div>

//       {(displayState === "missed" || displayState === "blocked" || displayState === "not-yet") && statusMessage && (
//         <div className={`mb-3 p-3 rounded-lg ${
//           displayState === "missed" ? "bg-red-50 border border-red-200" : 
//           displayState === "blocked" ? "bg-gray-100 border border-gray-200" :
//           "bg-yellow-50 border border-yellow-200"
//         }`}>
//           <div className="flex items-start">
//             <div className={`text-xs ${
//               displayState === "missed" ? "text-red-700" : 
//               displayState === "blocked" ? "text-gray-700" :
//               "text-yellow-700"
//             }`}>
//               <span className="font-semibold">
//                 {displayState === "missed" ? "Missed:" : 
//                  displayState === "blocked" ? "Blocked:" : 
//                  "Note:"}
//               </span> {statusMessage}
//               {displayState === "missed" && (
//                 <div className="mt-1 text-blue-500">Can update tomorrow in scheduled time slot</div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="mt-4">
//         <div className="flex justify-between items-center mb-1">
//           <label className="font-semibold text-gray-700">Status:</label>
//           {(displayState === "missed" || displayState === "blocked" || displayState === "not-yet") && (
//             <span className={`text-xs font-medium ${
//               displayState === "missed" ? "text-red-500" : 
//               displayState === "blocked" ? "text-gray-500" :
//               "text-yellow-500"
//             }`}>
//               {displayState === "missed" ? "Missed" : 
//                displayState === "blocked" ? "Blocked" : 
//                "Not Yet"}
//             </span>
//           )}
//         </div>
//         <div onClick={handleDropdownClick} className="relative">
//           <select
//             value={task.employeeStatus || ""}
//             onChange={handleChange}
//             onClick={handleSelectClick}
//             disabled={displayState === "missed" || displayState === "blocked" || displayState === "not-yet"}
//             className={`w-full border ${
//               (displayState === "missed" || displayState === "blocked" || displayState === "not-yet") ? 
//               "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed" : 
//               displayState === "pending" ? "border-gray-300 text-gray-700 cursor-pointer" : 
//               "border-[#EAEAEA] text-gray-700 cursor-pointer"
//             } rounded-lg px-3 py-2 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all appearance-none`}
//           >
//             <option value="">Select status</option>
//             <option value="Not Done">Not Done</option>
//             <option value="Done">Done</option>
//           </select>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TaskCard;