import React from "react";

const TaskCard = ({ task }) => {
  // Deduplicate employees in both arrays first
  const uniqueById = (arr) => {
    const seen = new Set();
    return arr.filter((emp) => {
      if (!emp?._id || seen.has(emp._id)) return false;
      seen.add(emp._id);
      return true;
    });
  };

  const doneEmployees = uniqueById(task.doneEmployees || []);
  const notDoneEmployeesRaw = uniqueById(task.notDoneEmployees || []);

  // Filter: remove any employee from notDone who is already in done
  const notDoneEmployees = notDoneEmployeesRaw.filter(
    (emp) => !doneEmployees.some((doneEmp) => doneEmp._id === emp._id)
  );

  const total = doneEmployees.length + notDoneEmployees.length;
  const progress = total ? (doneEmployees.length / total) * 100 : 0;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-200 text-yellow-800";
      case "Low":
        return "bg-green-200 text-green-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const renderEmployeeBadge = (emp, color, keyPrefix) => {
    if (!emp || !emp.username) return null;
    return (
      <div
        key={`${keyPrefix}-${emp._id}`}
        className="flex items-center gap-2"
      >
        <div
          className={`${color} text-white text-xs font-semibold rounded-full w-8 h-8 flex items-center justify-center`}
        >
          {emp.username.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm">{emp.username}</span>
      </div>
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition duration-300 border border-gray-100 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
          <span
            className={`px-3 py-1 rounded-md text-sm font-semibold ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
          <span>{task.department}</span>
          <span>{task.shift}</span>
          <span>Start</span>
          <span>
            {new Date(task.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-800 mb-3 text-sm">{task.description}</p>

        {/* Progress Bar */}
        <p className="text-sm font-medium text-gray-800 mb-1">
          {doneEmployees.length}/{total} employees done
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Done Employees */}
        <div className="mb-3">
          <p className="font-semibold text-gray-800 mb-1">Done</p>
          <div className="flex flex-wrap gap-2">
            {doneEmployees.length > 0
              ? doneEmployees.map((emp) =>
                  renderEmployeeBadge(emp, "bg-green-500", "done")
                )
              : <span className="text-sm text-gray-500">None</span>}
          </div>
        </div>

        {/* Not Done Employees */}
        <div>
          <p className="font-semibold text-gray-800 mb-1">Not Done</p>
          <div className="flex flex-wrap gap-2">
            {notDoneEmployees.length > 0
              ? notDoneEmployees.map((emp) =>
                  renderEmployeeBadge(emp, "bg-red-500", "not")
                )
              : <span className="text-sm text-gray-500">None</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;