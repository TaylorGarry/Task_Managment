import React from "react";

const TaskCard = ({ task, onStatusChange, allTasks = [] }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    // Don't call onStatusChange if dropdown is disabled
    if (value === "" || shouldDisableDropdown || isShiftMissed(task)) {
      return;
    }
    onStatusChange(task._id, value);
  };

  const isDone = task.employeeStatus === "Done";
  const isNotUpdated = task.employeeStatus === "" || !task.employeeStatus;
  
  // Helper function to get date string safely
  const getDateString = (date) => {
    if (!date) return '';
    try {
      const dateObj = new Date(date);
      return dateObj.toDateString();
    } catch (error) {
      return '';
    }
  };
  
  const getRelatedTasks = () => {
    const currentDateStr = getDateString(task.date);
    if (!currentDateStr) return [];
    
    return allTasks.filter(t => 
      t.title === task.title && 
      getDateString(t.date) === currentDateStr
    );
  };
  
  const relatedTasks = getRelatedTasks();
  const startTask = relatedTasks.find(t => t.shift === "Start");
  const midTask = relatedTasks.find(t => t.shift === "Mid");
  const endTask = relatedTasks.find(t => t.shift === "End");
  
  const isShiftMissed = (shiftTask) => {
    return shiftTask && 
      (shiftTask.employeeStatus === "" || !shiftTask.employeeStatus) &&
      shiftTask.canUpdate === false;
  };
  
  const isStartMissed = isShiftMissed(startTask);
  const isMidMissed = isShiftMissed(midTask);
  const isEndMissed = isShiftMissed(endTask);
  
  const getShouldDisableDropdown = () => {
    if (isShiftMissed(task)) return true;
    
    if (task.shift === "Mid" && isStartMissed) return true;
    
    if (task.shift === "End" && (isStartMissed || isMidMissed)) return true;
    
    return false;
  };
  
  const shouldDisableDropdown = getShouldDisableDropdown();
  const isTaskMissed = isShiftMissed(task);
  const isTaskBlocked = shouldDisableDropdown && !isTaskMissed;
  
  const getBlockReason = () => {
    if (task.shift === "Start" && isTaskMissed) {
      return "Start shift time window has passed. All shifts are blocked for today.";
    }
    
    if (task.shift === "Mid") {
      if (isStartMissed) return "Blocked because Start shift was not updated.";
      if (isTaskMissed) return "Mid shift time window has passed. End shift is blocked for today.";
    }
    
    if (task.shift === "End") {
      if (isStartMissed && isMidMissed) return "Blocked because both Start and Mid shifts were not updated.";
      if (isStartMissed) return "Blocked because Start shift was not updated.";
      if (isMidMissed) return "Blocked because Mid shift was not updated.";
      if (isTaskMissed) return "End shift time window has passed.";
    }
    
    return "";
  };
  
  const blockReason = getBlockReason();

  const handleDropdownClick = (e) => {
    if (shouldDisableDropdown || isTaskMissed) {
      e.preventDefault();
    }
  };

  const handleSelectClick = (e) => {
    if (shouldDisableDropdown || isTaskMissed) {
      e.stopPropagation();
    }
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Today';
    try {
      return new Date(date).toLocaleDateString('en-IN');
    } catch (error) {
      return 'Today';
    }
  };

  return (
    <div
      className={`border ${
        isDone ? "border-green-300 bg-green-50" : 
        isTaskMissed ? "border-red-300 bg-red-50" :
        isTaskBlocked ? "border-gray-200 bg-gray-100" :
        isNotUpdated ? "border-gray-300 bg-gray-50" : 
        "border-[#EAEAEA] bg-white"
      } p-5 rounded-2xl shadow-sm transition-all duration-200`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          {task.title}
        </h3>
        <div className="flex items-center space-x-2">
          {isTaskMissed && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Missed
            </span>
          )}
          {isNotUpdated && !isTaskMissed && !isTaskBlocked && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
              Pending
            </span>
          )}
          {isDone && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Done
            </span>
          )}
          {isTaskBlocked && (
            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">
              Blocked
            </span>
          )}
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
            {task.shift} Shift
            {isTaskMissed && " (Missed)"}
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
          <span className="text-gray-500">
            {formatDisplayDate(task.date)}
          </span>
        </div>
      </div>

      {(isTaskMissed || isTaskBlocked) && (
        <div className={`mb-3 p-2 rounded-lg ${
          isTaskMissed ? "bg-red-50 border border-red-200" : "bg-gray-100 border border-gray-200"
        }`}>
          <div className="flex items-start">
            <svg className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
              isTaskMissed ? "text-red-500" : "text-gray-500"
            }`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className={`text-xs ${
              isTaskMissed ? "text-red-700" : "text-gray-700"
            }`}>
              <span className="font-semibold">
                {isTaskMissed ? "Missed:" : "Blocked:"}
              </span> {blockReason}
              <div className="mt-1 text-blue-500">
                Can update tomorrow in scheduled time slot
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <label className="font-semibold text-gray-700">Status:</label>
          {(isTaskMissed || isTaskBlocked) && (
            <span className={`text-xs font-medium ${
              isTaskMissed ? "text-red-500" : "text-gray-500"
            }`}>
              {isTaskMissed ? "Missed" : "Blocked"}
            </span>
          )}
        </div>
        <div 
          onClick={handleDropdownClick}
          className="relative"
        >
          <select
            value={task.employeeStatus || ""}
            onChange={handleChange}
            onClick={handleSelectClick}
            disabled={isTaskMissed || isTaskBlocked}
            className={`w-full border ${
              (isTaskMissed || isTaskBlocked) ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed" :
              isNotUpdated ? "border-gray-300 text-gray-700 cursor-pointer" : 
              "border-[#EAEAEA] text-gray-700 cursor-pointer"
            } rounded-lg px-3 py-2 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all appearance-none`}
            style={{ 
              pointerEvents: (isTaskMissed || isTaskBlocked) ? 'none' : 'auto',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          >
            <option value="">Select status</option>
            <option value="Not Done">Not Done</option>
            <option value="Done">Done</option>
          </select>
          {(isTaskMissed || isTaskBlocked) && (
            <div 
              className="absolute inset-0 rounded-lg cursor-not-allowed" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;