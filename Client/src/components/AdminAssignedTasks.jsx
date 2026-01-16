import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchAdminAssignedTasks,
  updateAdminTaskStatus,
  fetchTasks  
} from "../features/slices/taskSlice";
import TaskCard from "./TaskCard.jsx";

const AdminAssignedTasks = () => {
  const dispatch = useDispatch();
  const { adminAssignedTasks = [], loading, error } = useSelector((state) => state.tasks);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    console.log("🔄 AdminAssignedTasks useEffect - fetching admin assigned tasks");
    dispatch(fetchAdminAssignedTasks());
  }, [dispatch]);

  useEffect(() => {
    console.log("📊 AdminAssignedTasks state updated");
    console.log("📋 adminAssignedTasks count:", adminAssignedTasks.length);
    if (adminAssignedTasks.length > 0) {
      console.log("📋 First admin assigned task:", {
        id: adminAssignedTasks[0]._id,
        title: adminAssignedTasks[0].title,
        doneEmployees: adminAssignedTasks[0].doneEmployees?.length || 0,
        notDoneEmployees: adminAssignedTasks[0].notDoneEmployees?.length || 0,
        date: adminAssignedTasks[0].date
      });
    }
  }, [adminAssignedTasks]);

  const handleStatusUpdate = async (taskId, status) => {
    console.log("🚀 handleStatusUpdate called for task:", taskId, "status:", status);
    
    try {
      await dispatch(updateAdminTaskStatus({ id: taskId, status })).unwrap();
      
      dispatch(fetchAdminAssignedTasks());
      dispatch(fetchTasks({}));
      
      toast.success("Task status updated successfully!");
    } catch (err) {
      console.error("❌ Update failed:", err);
      toast.error(err || "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">Your Assigned Tasks</h1>
      <p className="text-sm text-gray-600 mb-4">
        Showing tasks assigned to you ({user?.username})
      </p>

      {loading && <p className="text-gray-600">Loading your tasks...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && adminAssignedTasks.length === 0 && (
        <p className="text-gray-500">No tasks have been assigned to you</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {adminAssignedTasks.map((task) => (
          <div
            key={task._id}
            className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between relative min-h-[360px] transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 pr-10">
                  {task.title}
                </h3>
                <span className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-100 text-blue-700">
                  {task.priority || "Normal"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                <span>{task.department || "No Department"}</span>
                <span>{task.shift || "No Shift"}</span>
                <span>{new Date(task.date).toLocaleDateString()}</span>
              </div>

              <p className="text-gray-800 mb-3 text-sm">{task.description}</p>
              
              <div className="mb-3">
                <p className="font-semibold text-gray-800 mb-1">Your Status:</p>
                <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                  task.employeeStatus === "Done" 
                    ? "bg-green-100 text-green-700" 
                    : task.employeeStatus === "Not Done" 
                    ? "bg-red-100 text-red-700" 
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {task.employeeStatus || "Not Set"}
                </span>
              </div>

              <div className="mb-3">
                <p className="font-semibold text-gray-800 mb-1">Done ({task.doneEmployees?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {task.doneEmployees?.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-2">
                      <div className="bg-green-500 text-white text-xs font-semibold rounded-full w-8 h-8 flex items-center justify-center">
                        {emp.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm">{emp.username}</span>
                    </div>
                  )) || <span className="text-sm text-gray-500">None</span>}
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-800 mb-1">Not Done ({task.notDoneEmployees?.length || 0})</p>
                <div className="flex flex-wrap gap-2">
                  {task.notDoneEmployees?.map((emp) => (
                    <div key={emp._id} className="flex items-center gap-2">
                      <div className="bg-red-500 text-white text-xs font-semibold rounded-full w-8 h-8 flex items-center justify-center">
                        {emp.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm">{emp.username}</span>
                    </div>
                  )) || <span className="text-sm text-gray-500">None</span>}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleStatusUpdate(task._id, "Done")}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Mark as Done
                </button>
                <button
                  onClick={() => handleStatusUpdate(task._id, "Not Done")}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Mark as Not Done
                </button>
              </div>
              
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  Current: {task.employeeStatus || "Not Set"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAssignedTasks;