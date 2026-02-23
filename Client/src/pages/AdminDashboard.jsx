import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTasks,
  createTask,
  deleteTask,
} from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar.jsx";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { employees } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "Medium",
    deadline: "",
  });

<<<<<<< HEAD
  const statuses = ["Pending", "Working", "Reviewing", "Done"];
=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleDelete = async (taskId) => {
    try {
      await dispatch(deleteTask({ id: taskId, token: JSON.parse(localStorage.getItem("user")).token })).unwrap();
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err || "Error deleting task");
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createTask({ data: formData, token: JSON.parse(localStorage.getItem("user")).token })).unwrap();
      toast.success("Task created successfully");
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        priority: "Medium",
        deadline: "",
      });
    } catch (err) {
      toast.error(err || "Error creating task");
    }
  };

  return (
   <div className="p-4">
  <Toaster />
  <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

  <Sidebar />

  <form
    onSubmit={handleAddTask}
    className="bg-gray-100 p-4 rounded-md mb-6 flex flex-col gap-2"
  >
    <h2 className="font-semibold mb-2">Add New Task</h2>
    <input
      type="text"
      name="title"
      placeholder="Task Title"
      value={formData.title}
      onChange={handleInputChange}
      className="border rounded p-2 w-full"
      required
    />
    <textarea
      name="description"
      placeholder="Task Description"
      value={formData.description}
      onChange={handleInputChange}
      className="border rounded p-2 w-full"
    />
    <select
      name="assignedTo"
      value={formData.assignedTo}
      onChange={handleInputChange}
      required
      className="border rounded p-2 w-full"
    >
      <option value="">Select Employee</option>
      {employees?.map((user) => (
        <option key={user._id} value={user._id}>
          {user.username}
        </option>
      ))}
    </select>
    <select
      name="priority"
      value={formData.priority}
      onChange={handleInputChange}
      className="border rounded p-2 w-full"
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
      className="border rounded p-2 w-full"
    />
    <button
      type="submit"
      className="bg-blue-500 text-white px-4 py-2 rounded mt-2 w-full hover:bg-blue-600"
    >
      Add Task
    </button>
  </form>

  <div className="grid grid-cols-1 gap-4">
    {tasks.map((task) => (
      <div
        key={task._id}
        className="bg-gray-100 p-3 rounded-md shadow flex flex-col gap-2"
      >
        <h3 className="font-medium">{task.title}</h3>
        <p className="text-sm">{task.description}</p>
        <p className="text-xs text-gray-500">
          Assigned to: {task.assignedTo?.username || "Unassigned"}
        </p>
        <p className="text-sm font-medium">Status: {task.status}</p>
        <button
          onClick={() => handleDelete(task._id)}
          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    ))}
  </div>
</div>


  );
};

export default AdminDashboard;
