const AllTaskCard = ({ task }) => {
  const isDone = task.employeeStatus === "Done";

  return (
    <div
      className={`border ${
        isDone ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
      } p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <h3 className="text-lg font-semibold mb-3 text-gray-800">{task.title}</h3>

      <div className="space-y-1 text-gray-600 text-sm">
        <p>
          <span className="font-semibold text-gray-700">Shift:</span> {task.shift}
        </p>
        <p>
          <span className="font-semibold text-gray-700">Department:</span> {task.department}
        </p>
        <p>
          <span className="font-semibold text-gray-700">Priority:</span> {task.priority}
        </p>
      </div>

      <div className="mt-4">
        <span className="font-semibold text-gray-700 mr-2">Status:</span>
        <span className={`font-medium ${isDone ? "text-green-600" : "text-red-500"}`}>
          {task.employeeStatus}
        </span>
      </div>
    </div>
  );
};

export default AllTaskCard;
