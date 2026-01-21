// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import toast, { Toaster } from "react-hot-toast";
// import {
//   fetchAdminTasks,
//   updateAdminTaskStatus,
//   fetchTasks   
// } from "../features/slices/taskSlice";

// const AdminTask = () => {
//   const dispatch = useDispatch();
//   const { adminTasks = [], loading, error } = useSelector((state) => state.tasks);

//   const [selectedStatus, setSelectedStatus] = useState({});

//   useEffect(() => {
//     dispatch(fetchAdminTasks());
//   }, [dispatch]);

//   const handleStatusChange = (taskId, status) => {
//     setSelectedStatus((prev) => ({ ...prev, [taskId]: status }));
//   };

//   const handleUpdateStatus = async (taskId) => {
//   const status = selectedStatus[taskId];
//   if (!status) {
//     toast.error("Please select a status first!");
//     return;
//   }

//   try {
//     await dispatch(updateAdminTaskStatus({ id: taskId, status })).unwrap();
    
//     const today = new Date().toISOString().split('T')[0];
    
//     dispatch(fetchTasks({ 
//       startDate: today, 
//       endDate: today,
//       _cacheBust: Date.now() 
//     }));
    
//     toast.success("Task status updated successfully!");
//     setSelectedStatus((prev) => ({ ...prev, [taskId]: "" }));
//   } catch (err) {
//     toast.error(err || "Failed to update status");
//   }
// };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <Toaster position="top-right" />
//       <h1 className="text-2xl font-bold mb-6">Admin / Super Admin Tasks</h1>

//       {loading && <p>Loading tasks...</p>}
//       {error && <p className="text-red-500">{error}</p>}
//       {!loading && adminTasks.length === 0 && <p>No tasks created for you</p>}

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {adminTasks.map((task) => (
//           <div
//             key={task._id}
//             className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between"
//           >
//             <div>
//               <h2 className="font-semibold text-lg">{task.title}</h2>
//               <p className="text-gray-600 mb-2">{task.description}</p>
//               <p className="text-sm text-gray-500">
//                 Department: {task.department || "N/A"}
//               </p>
//               <p className="text-sm text-gray-500">
//                 Priority: {task.priority || "N/A"}
//               </p>
//               <p className="text-sm text-gray-500">
//                 Shift: {task.shift || "N/A"}
//               </p>

//               <div className="mt-2">
//                 <h3 className="font-medium text-gray-700 mb-1">
//                   Employees Status:
//                 </h3>
//                 <ul className="text-sm">
//                   {task.doneEmployees?.map((e) => (
//                     <li key={e._id} className="text-green-600">
//                       {e.username} - Done
//                     </li>
//                   ))}
//                   {task.notDoneEmployees?.map((e) => (
//                     <li key={e._id} className="text-red-600">
//                       {e.username} - Not Done
//                     </li>
//                   ))}
//                   {!task.doneEmployees?.length && !task.notDoneEmployees?.length && (
//                     <li className="text-gray-500">No employee status yet</li>
//                   )}
//                 </ul>
//               </div>
//             </div>

//             <div className="mt-4">
//               <select
//                 className="border border-gray-300 rounded-lg p-2 w-full mb-2"
//                 value={selectedStatus[task._id] || ""}
//                 onChange={(e) =>
//                   handleStatusChange(task._id, e.target.value)
//                 }
//               >
//                 <option value="">Select Status</option>
//                 <option value="Done">Done</option>
//                 <option value="Not Done">Not Done</option>
//               </select>
//               <button
//                 onClick={() => handleUpdateStatus(task._id)}
//                 className="bg-blue-600 text-white py-2 px-4 rounded-lg w-full hover:bg-blue-700 transition"
//               >
//                 Update Status
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AdminTask;


import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import {
  fetchAdminTasks,
  updateAdminTaskStatus,
} from "../features/slices/taskSlice";
import { MessageCircle, Send, User, X } from "lucide-react";
import {
  fetchRemarks,
  addRemark,
  clearRemarks,
} from "../features/slices/remarkSlice";
import { useRef } from "react";

const AdminTask = () => {
  const dispatch = useDispatch();
  const { adminTasks = [], loading, error } = useSelector(
    (state) => state.tasks
  );
  const { remarks, loading: remarksLoading } = useSelector((state) => state.remarks);
  const { user } = useSelector((state) => state.auth);

  const [selectedStatus, setSelectedStatus] = useState({});
  const [showRemarkPopup, setShowRemarkPopup] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [remarkMessage, setRemarkMessage] = useState("");
  const remarksEndRef = useRef(null);
  useEffect(() => {
    dispatch(fetchAdminTasks());
  }, [dispatch]);
  useEffect(() => {
    if (showRemarkPopup) {
      remarksEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [remarks, showRemarkPopup]);

  useEffect(() => {
    const map = {};
    adminTasks.forEach((task) => {
      if (task.employeeStatus) {
        map[task._id] = task.employeeStatus;
      }
    });
    setSelectedStatus(map);
  }, [adminTasks]);

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
      await dispatch(fetchAdminTasks());
      toast.success("Task status updated successfully!");
    } catch (err) {
      toast.error(err || "Failed to update status");
    }
  };
  const openRemarkPopup = (task) => {
    setCurrentTask(task);
    setShowRemarkPopup(true);
    dispatch(fetchRemarks(task._id));
  };

  const closeRemarkPopup = () => {
    setShowRemarkPopup(false);
    setCurrentTask(null);
    setRemarkMessage("");
    dispatch(clearRemarks());
  };

  const handleSendRemark = async (e) => {
    if (e) e.preventDefault();
    if (!remarkMessage.trim()) {
      toast.error("Remark message cannot be empty");
      return;
    }

    try {
      await dispatch(
        addRemark({ taskId: currentTask._id, message: remarkMessage.trim() })
      ).unwrap();
      setRemarkMessage("");
      dispatch(fetchRemarks(currentTask._id));
    } catch (err) {
      toast.error(err || "Failed to send remark");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendRemark();
    }
  };
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">
        Admin / Super Admin Tasks
      </h1>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && adminTasks.length === 0 && <p>No tasks created for you</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminTasks.map((task) => {
          const assigneeCount = (task.doneEmployees?.length || 0) + (task.notDoneEmployees?.length || 0);
          const remarkCount = task.remarks?.length || 0;
          
          return (
            <div
              key={task._id}
              className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between border border-gray-200"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="font-semibold text-lg">{task.title}</h2>
                </div>

                <p className="text-gray-600 mb-2 text-sm">{task.description}</p>

                <div className="space-y-1 text-sm">
                  <p className="text-gray-500">
                    <span className="font-medium">Department:</span> {task.department || "N/A"}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-medium">Priority:</span> {task.priority || "N/A"}
                  </p>
                  <p className="text-gray-500">
                    <span className="font-medium">Shift:</span> {task.shift || "N/A"}
                  </p>
                </div>

                <div className="mt-3">
                  <h3 className="font-medium text-gray-700 mb-1 text-sm">
                    Employees Status:
                  </h3>
                  <div className="space-y-1 text-sm">
                    {task.doneEmployees?.map((e) => (
                      <div key={e._id} className="text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>{e.username} - Done</span>
                      </div>
                    ))}
                    {task.notDoneEmployees?.map((e) => (
                      <div key={e._id} className="text-red-600 flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span>{e.username} - Not Done</span>
                      </div>
                    ))}
                    {!task.doneEmployees?.length &&
                      !task.notDoneEmployees?.length && (
                        <div className="text-gray-500 text-sm">No employee status yet</div>
                      )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <select
                  className="border border-gray-300 rounded-lg p-2 w-full mb-3 text-sm"
                  value={selectedStatus[task._id] || ""}
                  onChange={(e) =>
                    handleStatusChange(task._id, e.target.value)
                  }
                >
                  <option value="">Select Status</option>
                  <option value="Done">Done</option>
                  <option value="Not Done">Not Done</option>
                </select>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(task._id)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg flex-1 hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Update Status
                  </button>

                  <button
                    onClick={() => openRemarkPopup(task)}
                    title="Add / View Remark"
                    className="relative border border-gray-300 rounded-lg p-2 text-gray-600 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition"
                  >
                    <MessageCircle size={20} />
                    {remarkCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {remarkCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showRemarkPopup && currentTask && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{currentTask.title}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {currentTask.doneEmployees?.length || 0 + currentTask.notDoneEmployees?.length || 0} assignee(s)
                  </p>
                </div>
                <button
                  onClick={closeRemarkPopup}
                  className="text-white hover:text-gray-200 transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="border-b border-gray-200"></div>
            <div className="p-5 bg-gray-50">
              <p className="text-gray-600 text-sm italic">
                {currentTask.description || "No description provided"}
              </p>
            </div>
            <div className="border-b border-gray-200"></div>
            <div className="flex-1 overflow-y-auto p-5 max-h-[50vh]">
              {remarksLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : remarks.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No remarks yet</p>
                  <p className="text-sm mt-1">Be the first to add a remark</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {remarks.map((remark) => {
                    const isCurrentUser = remark.senderId?._id === user?._id;
                    return (
                      <div key={remark._id} className={`${isCurrentUser ? "text-right" : ""}`}>
                        <div className={`inline-block max-w-[80%] ${isCurrentUser ? "bg-blue-100" : "bg-gray-100"} rounded-2xl p-3`}>
                          <div className="flex items-center gap-2 mb-1">
                            {!isCurrentUser && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                <User size={12} />
                              </div>
                            )}
                            <span className={`font-semibold text-sm ${isCurrentUser ? "text-blue-700" : "text-gray-700"}`}>
                              {remark.senderId?.username || "Unknown"}
                            </span>
                            {isCurrentUser && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                <User size={12} />
                              </div>
                            )}
                          </div>
                          <p className="text-gray-800 mb-1">{remark.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatDate(remark.createdAt)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(remark.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={remarksEndRef} />
                </div>
              )}
            </div>
            <div className="border-t border-gray-200"></div>
            <div className="p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-gray-300 rounded-xl overflow-hidden">
                  <textarea
                    placeholder="Type your remark here..."
                    className="w-full px-4 py-3 text-sm focus:outline-none resize-none max-h-32"
                    rows={2}
                    value={remarkMessage}
                    onChange={(e) => setRemarkMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    Press Enter to send • Shift + Enter for new line
                  </div>
                </div>
                <button
                  onClick={handleSendRemark}
                  disabled={!remarkMessage.trim()}
                  className={`p-3 rounded-xl ${remarkMessage.trim() ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300"} text-white transition`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTask;