// import React from "react";

// const TaskCard = ({ task, onStatusChange }) => {
//   const handleChange = (e) => {
//     onStatusChange(task._id, e.target.value);
//   };

//   const bgColor = task.employeeStatus === "Done" ? "bg-green-100" : "bg-red-100";
//   const borderColor = task.employeeStatus === "Done" ? "border-green-400" : "border-red-400";

//   return (
//     <div className={`border ${borderColor} ${bgColor} p-4 rounded-lg shadow-md`}>
//       <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
//       <p className="mb-1"><span className="font-bold">Shift:</span> {task.shift}</p>
//       <p className="mb-1"><span className="font-bold">Department:</span> {task.department}</p>
//       <p className="mb-2"><span className="font-bold">Priority:</span> {task.priority}</p>

//       <div className="mt-2">
//         <label className="font-semibold mr-2">Status:</label>
//         <select
//           value={task.employeeStatus}
//           onChange={handleChange}
//           className="border p-1 rounded"
//         >
//           <option value="Not Done">Not Done</option>
//           <option value="Done">Done</option>
//         </select>
//       </div>
//     </div>
//   );
// };

// export default TaskCard;


import React from "react";

const TaskCard = ({ task, onStatusChange }) => {
  const handleChange = (e) => {
    onStatusChange(task._id, e.target.value);
  };

  const isDone = task.employeeStatus === "Done";

  return (
    <div
      className={`border ${
        isDone ? "border-green-300 bg-green-50" : "border-[#EAEAEA] bg-white"
      } p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        {task.title}
      </h3>

      <div className="space-y-1 text-gray-600 text-sm">
        <p>
          <span className="font-semibold text-gray-700">Shift:</span>{" "}
          {task.shift}
        </p>
        <p>
          <span className="font-semibold text-gray-700">Department:</span>{" "}
          {task.department}
        </p>
        <p>
          <span className="font-semibold text-gray-700">Priority:</span>{" "}
          {task.priority}
        </p>
      </div>

      <div className="mt-4">
        <label className="font-semibold text-gray-700 mr-2">Status:</label>
        <select
          value={task.employeeStatus}
          onChange={handleChange}
          className="border border-[#EAEAEA] bg-blue-50 text-gray-700 rounded-lg px-3 py-2 text-sm focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all cursor-pointer"
        >
          <option value="Not Done">Not Done</option>
          <option value="Done">Done</option>
        </select>
      </div>
    </div>
  );
};

export default TaskCard;
