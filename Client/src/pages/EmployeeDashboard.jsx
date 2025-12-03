import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, fetchCoreTasks, updateTaskStatus, updateTaskStatusCoreTeam } from "../features/slices/taskSlice";
import { fetchRemarks, addRemark, updateRemark } from "../features/slices/remarkSlice";
import TaskCard from "./TaskCard";
import Navbar from "./Navbar";
import { Toaster, toast } from "react-hot-toast";
import { MessageCircle } from "lucide-react";
import { FiX, FiSend, FiEdit2, FiCheck, FiXCircle } from "react-icons/fi";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { remarks, loading: remarksLoading } = useSelector((state) => state.remarks);
  const user = JSON.parse(localStorage.getItem("user"));
  const isCoreTeam = user?.isCoreTeam;
  const employeeDepartment = user?.department || "";
  
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "",
    department: employeeDepartment,
  });
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editingMessage, setEditingMessage] = useState("");
  
  const shiftOptions = ["Start", "Mid", "End"];
  const departmentOptions = [employeeDepartment];
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isCoreTeam) {
      dispatch(fetchCoreTasks({ department: employeeDepartment }));
    } else {
      dispatch(fetchTasks(filters));
    }
  }, [dispatch, filters, isCoreTeam]);

  useEffect(() => {
    if (selectedTask?._id && isChatOpen) {
      dispatch(fetchRemarks(selectedTask._id));
    }
  }, [dispatch, selectedTask, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [remarks, isChatOpen]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      let updatedStatus;

      if (isCoreTeam) {
        updatedStatus = await dispatch(
          updateTaskStatusCoreTeam({ id: taskId, status })
        ).unwrap();
        dispatch({
          type: "tasks/updateTaskStatusCoreTeam/fulfilled",
          payload: updatedStatus,
        });
      } else {
        updatedStatus = await dispatch(
          updateTaskStatus({ id: taskId, status })
        ).unwrap();
        dispatch({
          type: "tasks/updateTaskStatus/fulfilled",
          payload: updatedStatus,
        });
      }

      toast.success("Task status updated successfully!");
    } catch (err) {
      toast.error(err || "Failed to update status, please try again.");
    }
  };

  const openChat = (task) => {
    setSelectedTask(task);
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedTask(null);
    setNewMessage("");
    setEditingRemarkId(null);
    setEditingMessage("");
  };

  const handleSendRemark = async () => {
    if (!newMessage.trim()) return;
    try {
      await dispatch(
        addRemark({ taskId: selectedTask._id, message: newMessage })
      ).unwrap();

      setNewMessage("");
      toast.success("Remark sent!");

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
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

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen relative">
        {!isCoreTeam && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAEAEA] mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col w-full">
              <label className="text-gray-700 font-semibold mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col w-full">
              <label className="text-gray-700 font-semibold mb-2">Shift</label>
              <select
                name="shift"
                value={filters.shift}
                onChange={handleFilterChange}
                className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all"
              >
                <option value="">All Shifts</option>
                {shiftOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col w-full">
              <label className="text-gray-700 font-semibold mb-2">Department</label>
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all"
              >
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500">
            {typeof error === "string" ? error : error.message || "Something went wrong"}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 && !loading ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="relative">
                <TaskCard task={task} onStatusChange={handleStatusChange} />
                <button
                  onClick={() => openChat(task)}
                  className="absolute top-3 right-3 bg-white hover:bg-gray-50 border border-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
                  title="Open chat"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>

        {isChatOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div className="bg-white w-full max-w-[480px] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-lg truncate">{selectedTask?.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {Array.isArray(selectedTask?.assignedTo) 
                      ? `${selectedTask?.assignedTo.length} assignee(s)` 
                      : selectedTask?.assignedTo?.username || 'Unassigned'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeChat}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <FiX size={22} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-4">
                {selectedTask?.initialRemark && (
                  <div className="flex justify-start w-full">
                    <div className="relative max-w-[80%] mr-8">
                      <div className="px-4 py-3 rounded-2xl break-words shadow-sm bg-white text-gray-800 border border-gray-100 rounded-bl-none">
                        <p className="text-sm">{selectedTask.initialRemark}</p>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                          <span className="text-xs font-medium text-gray-600">
                            System
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(selectedTask.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {remarks.length > 0 ? (
                  remarks.map((msg) => {
                    const isMine = String(msg.senderId?._id) === String(user.id);
                    const isEditing = editingRemarkId === msg._id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
                      >
                        <div
                          className={`relative max-w-[80%] ${isMine ? "ml-8" : "mr-8"}`}
                        >
                          <div
                            className={`px-4 py-3 rounded-2xl break-words shadow-sm relative transition-all duration-200 hover:shadow-md ${
                              isMine
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editingMessage}
                                  onChange={(e) => setEditingMessage(e.target.value)}
                                  className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all duration-200 ${
                                    isMine 
                                      ? "bg-blue-700/20 text-white placeholder-blue-300 border-blue-400/30 focus:ring-blue-300/30" 
                                      : "bg-white text-gray-800 border-gray-300 focus:ring-blue-100"
                                  }`}
                                  placeholder="Edit remark..."
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      dispatch(
                                        updateRemark({ remarkId: msg._id, message: editingMessage })
                                      ).unwrap().then(() => {
                                        setEditingRemarkId(null);
                                        toast.success("Remark updated");
                                      }).catch((err) => {
                                        toast.error(err?.message || "Failed to update remark");
                                      });
                                    }
                                  }}
                                />

                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await dispatch(
                                          updateRemark({ remarkId: msg._id, message: editingMessage })
                                        ).unwrap();
                                        setEditingRemarkId(null);
                                        toast.success("Remark updated");
                                      } catch (err) {
                                        toast.error(err?.message || "Failed to update remark");
                                      }
                                    }}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
                                  >
                                    <FiCheck size={16} />
                                    Save
                                  </button>

                                  <button
                                    onClick={() => setEditingRemarkId(null)}
                                    className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
                                  >
                                    <FiXCircle size={16} />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="relative">
                                  <p className="text-sm pr-8">{msg.message}</p>
                                  
                                  {isMine && (
                                    <div className="absolute -top-2 -right-2">
                                      <button
                                        onClick={() => {
                                          setEditingRemarkId(msg._id);
                                          setEditingMessage(msg.message);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white hover:bg-gray-50 border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-lg hover:shadow-xl transform hover:scale-110 cursor-pointer"
                                        title="Edit message"
                                      >
                                        <FiEdit2 size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-opacity-20">
                                  <span className={`text-xs font-medium ${isMine ? "text-white/90" : "text-gray-600"}`}>
                                    {msg.senderId?.username}
                                  </span>
                                  <span className={`text-xs ${isMine ? "text-white/80" : "text-gray-500"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : !selectedTask?.initialRemark && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-700 mb-1">No messages yet</h4>
                      <p className="text-gray-500 text-sm">Start the conversation by sending a remark</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}></div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your remark here..."
                      className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 pr-12"
                    />
                    {newMessage && (
                      <button
                        onClick={() => setNewMessage("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <FiXCircle size={18} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSendRemark}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-full shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer ${
                      newMessage.trim()
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FiSend size={18} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EmployeeDashboard;