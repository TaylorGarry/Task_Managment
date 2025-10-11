import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, updateTask } from "../features/slices/taskSlice";
import { FiMessageSquare } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);

  const [selectedTask, setSelectedTask] = useState(null);
  const [message, setMessage] = useState("");

  const statuses = ["Pending", "Working", "Reviewing", "Done"];

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleStatusChange = async (taskId, newStatus) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    try {
      await dispatch(updateTask({ id: taskId, updates: { status: newStatus }, token })).unwrap();
      toast.success("Task status updated");
    } catch (err) {
      toast.error(err || "Error updating task");
    }
  };

  const handleOpenMessage = (task) => {
    setSelectedTask(task);
    setMessage("");
  };

  const handleCloseMessage = () => {
    setSelectedTask(null);
    setMessage("");
  };

  const handleSendMessage = () => {
    console.log("Send message for task:", selectedTask?._id, message);
    handleCloseMessage();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-500 text-white";
      case "Medium":
        return "bg-yellow-400 text-black";
      case "Low":
        return "bg-green-400 text-black";
      default:
        return "bg-gray-300 text-black";
    }
  };

  return (
    <div className="p-6 mt-16">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6 text-center">Employee Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map((status) => (
          <div key={status} className="bg-gray-100 p-4 rounded-lg flex flex-col">
            <h3 className="font-semibold mb-3 text-center">{status}</h3>
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <div
                  key={task._id}
                  className="bg-white p-4 rounded shadow mb-3 hover:shadow-lg transition cursor-pointer flex flex-col gap-2"
                >
                  {/* Title + Priority */}
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-lg">{task.title}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <p className="text-sm mb-2">{task.description}</p>

                  <div className="flex justify-between items-center text-xs text-gray-700">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="border rounded px-1 text-xs"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleOpenMessage(task)}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                      title="Add Review"
                    >
                      <FiMessageSquare size={16} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold"
              onClick={handleCloseMessage}
            >
              X
            </button>
            <h3 className="text-lg font-semibold mb-4">
              Add Review for "{selectedTask.title}"
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="border rounded w-full p-2 mb-4 resize-none"
              placeholder="Write your message here..."
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
