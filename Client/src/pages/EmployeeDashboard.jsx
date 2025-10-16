import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, updateTaskStatus } from "../features/slices/taskSlice";
import TaskCard from "./TaskCard";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeDepartment = user?.department || "";

  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "",
    department: employeeDepartment,
  });

  const shiftOptions = ["Start", "Mid", "End"];
  const departmentOptions = [employeeDepartment];

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const updatedStatus = await dispatch(updateTaskStatus({ id: taskId, status })).unwrap();
      dispatch({
        type: "tasks/updateTaskStatus/fulfilled",
        payload: updatedStatus,
      });

    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status, please try again.");
    }
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Employee Dashboard</h2>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="p-2 rounded border"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-1">Shift</label>
          <select
            name="shift"
            value={filters.shift}
            onChange={handleFilterChange}
            className="p-2 rounded border"
          >
            <option value="">All Shifts</option>
            {shiftOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-1">Department</label>
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
            className="p-2 rounded border"
          >
            {departmentOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-gray-700">Loading tasks...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.length === 0 && !loading ? (
          <p className="text-gray-700">No tasks assigned for this date/shift.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
