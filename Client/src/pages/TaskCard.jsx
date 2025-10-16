import React from "react";

const TaskCard = ({ task, onStatusChange }) => {
  const handleChange = (e) => {
    onStatusChange(task._id, e.target.value);
  };

  const bgColor = task.employeeStatus === "Done" ? "bg-green-100" : "bg-red-100";
  const borderColor = task.employeeStatus === "Done" ? "border-green-400" : "border-red-400";

  return (
    <div className={`border ${borderColor} ${bgColor} p-4 rounded-lg shadow-md`}>
      <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
      <p className="mb-1"><span className="font-bold">Shift:</span> {task.shift}</p>
      <p className="mb-1"><span className="font-bold">Department:</span> {task.department}</p>
      <p className="mb-2"><span className="font-bold">Priority:</span> {task.priority}</p>

      <div className="mt-2">
        <label className="font-semibold mr-2">Status:</label>
        <select
          value={task.employeeStatus}
          onChange={handleChange}
          className="border p-1 rounded"
        >
          <option value="Not Done">Not Done</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </div>
  );
};

export default TaskCard;
