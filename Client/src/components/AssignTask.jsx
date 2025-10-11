import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTask, fetchTasks } from "../features/slices/taskSlice";
import { fetchEmployees } from "../features/slices/authSlice";
import toast, { Toaster } from "react-hot-toast";

const AssignTask = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    deadline: "",
  });

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleInputChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createTask({
          data: formData,
          token: JSON.parse(localStorage.getItem("user")).token,
        })
      ).unwrap();
      toast.success("Task assigned successfully!");
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        priority: "Medium",
        deadline: "",
      });
    } catch (err) {
      toast.error(err || "Error assigning task");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-3">
      <Toaster />
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-5">
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Assign New Task
        </h2>
        <form
          onSubmit={handleAddTask}
          className="flex flex-col gap-4"
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
          <textarea
            name="description"
            placeholder="Task Description"
            value={formData.description}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="">Select Employee</option>
            {employees?.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.username}
              </option>
            ))}
          </select>
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
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Assign Task
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssignTask;
