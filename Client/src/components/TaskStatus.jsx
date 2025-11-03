import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import TaskCard from "./TaskCard.jsx";

const TaskStatus = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { employees, user } = useSelector((state) => state.auth);

  // today's date
  const today = new Date().toISOString().split("T")[0];

  // ✅ two date states instead of one
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    department: "",
    shift: "",
    employee: "",
  });

  useEffect(() => {
    dispatch(fetchTasks(filters));
    dispatch(fetchEmployees());
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    // Prevent selecting future dates
    if ((name === "startDate" || name === "endDate") && value > today) return;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { employee: "" } : {}),
    }));
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;

  // ✅ Removed single-date filter logic, now handled by backend

  return (
    <div className="p-6 mt-16 relative min-h-[70vh]">
      {/* Loader */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
          <div className="flex space-x-2">
            <div className="w-4 h-4 bg-gray-800 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-gray-800 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-gray-800 rounded-full animate-bounce"></div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-800">Task Status</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* From Date */}
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          max={today}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        />
        {/* To Date */}
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          max={today}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        />

        {/* Department */}
        <select
          name="department"
          value={filters.department}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Shift */}
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

        {/* Employee */}
        <select
          name="employee"
          value={filters.employee}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        >
          <option value="">All Employees</option>
          {filteredEmployees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.username}
            </option>
          ))}
        </select>
      </div>

      {!loading && (
        <>
          {tasks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          ) : (
            <h1 className="text-center text-gray-500 mt-10 text-4xl font-bold tracking-wide bg-gray-50 py-35 rounded-lg shadow-sm">
              No tasks found
            </h1>
          )}
        </>
      )}
    </div>
  );
};

export default TaskStatus;
