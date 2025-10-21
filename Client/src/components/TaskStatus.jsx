import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import TaskCard from "./TaskCard.jsx";

const TaskStatus = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { employees, user } = useSelector((state) => state.auth);
  const todayDate = new Date().toISOString().split("T")[0];
  const [filters, setFilters] = useState({
    date: todayDate,
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
    if (name === "date" && value > todayDate) return;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { employee: "" } : {}),
    }));
  };
  const departments = [...new Set(tasks.map((t) => t.department).filter(Boolean))];
  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;
  const formatLocalDate = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const filteredTasks = tasks.filter((task) => {
    if (user.accountType === "employee") {
      if (!task.assignedTo.some((e) => e._id.toString() === user._id.toString()))
        return false;
    }
    if (filters.date && task.date) {
      if (formatLocalDate(task.date) !== filters.date) return false;
    }
    if (filters.department && task.department !== filters.department) return false;
    if (filters.shift && task.shift !== filters.shift) return false;
    if (
      filters.employee &&
      !task.assignedTo.some((e) => e._id.toString() === filters.employee.toString())
    )
      return false;

    return true;
  });
  return (
    <div className="p-6 mt-16">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Task Status</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          max={todayDate}
          // min={todayDate}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        />
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
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      ) : (
        <h1 className="text-center text-gray-500 mt-10 text-4xl font-bold tracking-wide bg-gray-50 py-35 rounded-lg shadow-sm">
          No tasks found
        </h1>
      )}
    </div>
  );
};
export default TaskStatus;
