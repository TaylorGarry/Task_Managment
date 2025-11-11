import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createTask,
  createCoreTask,
  fetchTasks,
} from "../features/slices/taskSlice";
import { fetchEmployees } from "../features/slices/authSlice";
import toast, { Toaster } from "react-hot-toast";

const AssignTask = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("normal");  

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    shift: "Start",
    department: "",
    priority: "Medium",
    initialRemark: "",
  });

  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchTasks());
  }, [dispatch]);

  useEffect(() => {
    if (formData.department) {
      setFilteredEmployees(
        employees.filter((emp) => emp.department === formData.department)
      );
    } else {
      setFilteredEmployees([]);
    }
  }, [formData.department, employees]);

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.department || !formData.title) {
      toast.error("Please fill all required fields!");
      return;
    }

    const dataToSend = {
      ...formData,
      assignedTo: formData.assignedTo ? [formData.assignedTo] : [],
    };

    try {
      if (activeTab === "core") {
        dataToSend.isCoreTeamTask = true;
        await dispatch(createCoreTask({ data: dataToSend })).unwrap();
      } else {
        await dispatch(createTask({ data: dataToSend })).unwrap();
      }

      toast.success("Task assigned successfully!");
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        shift: "Start",
        department: "",
        priority: "Medium",
        initialRemark: "",
      });
    } catch (err) {
      toast.error(err || "Error assigning task");
    }
  };

  const departments = [...new Set(employees.map((emp) => emp.department))];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-10">
      <Toaster />
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-5">
        <div className="flex justify-center mb-6 ">
          <button
            onClick={() => setActiveTab("normal")}
            className={`px-6 py-2 rounded-l-lg font-semibold cursor-pointer ${
              activeTab === "normal"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Normal Task
          </button>
          <button
            onClick={() => setActiveTab("core")}
            className={`px-6 py-2 rounded-r-lg font-semibold cursor-pointer ${
              activeTab === "core"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Core Team Task
          </button>
        </div>

        <form
          onSubmit={handleAddTask}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-500"
        >
          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={formData.title}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Employees in Department</option>
            {filteredEmployees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.username}
              </option>
            ))}
          </select>

          {activeTab === "normal" && (
            <select
              name="shift"
              value={formData.shift}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Start">Start</option>
              <option value="Mid">Mid</option>
              <option value="End">End</option>
            </select>
          )}

          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <textarea
            name="description"
            placeholder="Task Description"
            value={formData.description}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-400 lg:col-span-2"
          />

          {activeTab === "core" && (
            <textarea
              name="initialRemark"
              placeholder="Initial Remark (for Core Team Task)"
              value={formData.initialRemark}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg p-3 h-20 focus:outline-none focus:ring-2 focus:ring-blue-400 lg:col-span-2"
            />
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 cursor-pointer rounded-lg font-semibold hover:bg-blue-700 transition duration-300 lg:col-span-2"
          >
            {activeTab === "core" ? "Assign Core Team Task" : "Assign Task"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssignTask;
