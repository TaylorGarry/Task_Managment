import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./Navbar";
import { fetchAllTasks } from "../features/slices/taskSlice.js";

const AllTasks = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);

  const todayDate = new Date().toISOString().split("T")[0];  

  const [filters, setFilters] = useState({
    date: todayDate,
    shift: "",
  });

  useEffect(() => {
    dispatch(fetchAllTasks(filters));  
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      <Navbar />
      <div className="p-6 mt-16">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Your Tasks</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            max={todayDate}
            className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
          />

          <select
            name="shift"
            value={filters.shift}
            onChange={handleFilterChange}
            className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
          >
            <option value="">All Shifts</option>
            <option value="Start">Start</option>
            <option value="Mid">Mid</option>
            <option value="End">End</option>
          </select>
        </div>

        {loading && <p>Loading tasks...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {tasks.length === 0 && !loading && <p>No tasks found.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`border p-5 rounded-2xl shadow-sm ${
                task.employeeStatus === "Done"
                  ? "border-green-300 bg-green-50"
                  : "border-[#EAEAEA] bg-white"
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Shift:</span> {task.shift}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Department:</span> {task.department}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Priority:</span> {task.priority}
              </p>
              <p className="mt-2 font-semibold">
                Status:{" "}
                <span
                  className={`${
                    task.employeeStatus === "Done" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {task.employeeStatus}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AllTasks;
