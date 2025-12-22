import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchAdminTasks,
  updateAdminTaskStatus,
  fetchTasks   
} from "../features/slices/taskSlice";

const AdminTask = () => {
  const dispatch = useDispatch();
  const { adminTasks = [], loading, error } = useSelector((state) => state.tasks);

  const [selectedStatus, setSelectedStatus] = useState({});

  useEffect(() => {
    dispatch(fetchAdminTasks());
  }, [dispatch]);

  const handleStatusChange = (taskId, status) => {
    setSelectedStatus((prev) => ({ ...prev, [taskId]: status }));
  };

  const handleUpdateStatus = async (taskId) => {
  const status = selectedStatus[taskId];
  if (!status) {
    toast.error("Please select a status first!");
    return;
  }

  try {
    await dispatch(updateAdminTaskStatus({ id: taskId, status })).unwrap();
    
    // Force refresh by changing filters slightly to bypass cache
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch with a slight variation to bypass cache
    dispatch(fetchTasks({ 
      startDate: today, 
      endDate: today,
      _cacheBust: Date.now() // Add timestamp to bypass cache
    }));
    
    toast.success("Task status updated successfully!");
    setSelectedStatus((prev) => ({ ...prev, [taskId]: "" }));
  } catch (err) {
    toast.error(err || "Failed to update status");
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">Admin / Super Admin Tasks</h1>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && adminTasks.length === 0 && <p>No tasks created for you</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminTasks.map((task) => (
          <div
            key={task._id}
            className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between"
          >
            <div>
              <h2 className="font-semibold text-lg">{task.title}</h2>
              <p className="text-gray-600 mb-2">{task.description}</p>
              <p className="text-sm text-gray-500">
                Department: {task.department || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Priority: {task.priority || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Shift: {task.shift || "N/A"}
              </p>

              <div className="mt-2">
                <h3 className="font-medium text-gray-700 mb-1">
                  Employees Status:
                </h3>
                <ul className="text-sm">
                  {task.doneEmployees?.map((e) => (
                    <li key={e._id} className="text-green-600">
                      {e.username} - Done
                    </li>
                  ))}
                  {task.notDoneEmployees?.map((e) => (
                    <li key={e._id} className="text-red-600">
                      {e.username} - Not Done
                    </li>
                  ))}
                  {!task.doneEmployees?.length && !task.notDoneEmployees?.length && (
                    <li className="text-gray-500">No employee status yet</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <select
                className="border border-gray-300 rounded-lg p-2 w-full mb-2"
                value={selectedStatus[task._id] || ""}
                onChange={(e) =>
                  handleStatusChange(task._id, e.target.value)
                }
              >
                <option value="">Select Status</option>
                <option value="Done">Done</option>
                <option value="Not Done">Not Done</option>
              </select>
              <button
                onClick={() => handleUpdateStatus(task._id)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg w-full hover:bg-blue-700 transition"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTask;