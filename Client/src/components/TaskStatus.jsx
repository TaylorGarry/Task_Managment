import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTasks
} from "../features/slices/taskSlice.js";
import {
  fetchEmployees
} from "../features/slices/authSlice.js";
import {
  fetchRemarks,
  addRemark,
  deleteRemark,
  updateRemark
} from "../features/slices/remarkSlice.js";
import TaskCard from "./TaskCard.jsx";
import {
  FiX,
  FiTrash2,
  FiSend,
  FiEdit2,
  FiCheck,
  FiXCircle
} from "react-icons/fi";
import Select from "react-select";
import toast from "react-hot-toast";

const TaskStatus = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { employees, loading: employeesLoading } = useSelector((state) => state.auth);
  const { remarks } = useSelector((state) => state.remarks);

  const user = JSON.parse(localStorage.getItem("user"));
  const today = new Date().toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    department: "",
    shift: "",
    employee: "",
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [message, setMessage] = useState("");
  const [receiverId, setReceiverId] = useState(null);
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editingMessage, setEditingMessage] = useState("");

  const messagesEndRef = useRef(null);
  const hasFetchedEmployees = useRef(false);

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (!hasFetchedEmployees.current) {
      hasFetchedEmployees.current = true;
      dispatch(fetchEmployees());
    }
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [remarks]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if ((name === "startDate" || name === "endDate") && value > today) return;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { employee: "" } : {}),
    }));
  };

  const handleOpenChat = (task) => {
    setSelectedTask(task);
    dispatch(fetchRemarks(task._id));
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      let finalReceiver = null;
      let sendToAll = false;

      if (user.accountType === "admin") {
        if (receiverId?.value === "all") {
          sendToAll = true;
        } else {
          finalReceiver = receiverId?.value || null;
        }
      }

      await dispatch(
        addRemark({
          taskId: selectedTask._id,
          message,
          receiverId: finalReceiver,
          sendToAll,
        })
      ).unwrap();

      setMessage("");
      if (!sendToAll) setReceiverId(null);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      toast.error(err?.message || "Failed to send remark");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;

  return (
    <div className="p-6 mt-10 relative min-h-[70vh]">
      {(loading || employeesLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce" />
            </div>
            <p className="text-gray-600 text-sm font-medium">Loading tasks...</p>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Task Status</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
            <div className="flex gap-2 ">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                max={today}
                className="flex-1 border cursor-pointer border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200"
              />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                max={today}
                className="flex-1 border cursor-pointer border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <select
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              className="w-full cursor-pointer border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1 cursor-pointer">Shift</label>
            <select
              name="shift"
              value={filters.shift}
              onChange={handleFilterChange}
              className="w-full cursor-pointer border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 bg-white"
            >
              <option value="">All Shifts</option>
              <option value="Start">Start</option>
              <option value="Mid">Mid</option>
              <option value="End">End</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1 cursor-pointer">Employee</label>
            <select
              name="employee"
              value={filters.employee}
              onChange={handleFilterChange}
              className="w-full cursor-pointer border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 bg-white"
            >
              <option value="">All Employees</option>
              {filteredEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!loading && (
        tasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onOpenChat={handleOpenChat} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No tasks found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        )
      )}

      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white w-full max-w-[480px] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-lg truncate">{selectedTask.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {Array.isArray(selectedTask.assignedTo)
                    ? `${selectedTask.assignedTo.length} assignee(s)`
                    : selectedTask.assignedTo?.username || 'Unassigned'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {user.accountType === "admin" && (
                  <div className="w-40">
                    <Select
                      value={receiverId}
                      onChange={setReceiverId}
                      options={
                        Array.isArray(selectedTask.assignedTo)
                          ? [
                            { value: "all", label: "Send to All" },
                            ...selectedTask.assignedTo.map((emp) => ({
                              value: emp._id,
                              label: emp.username,
                            })),
                          ]
                          : [
                            { value: "all", label: "Send to All" },
                            {
                              value: selectedTask.assignedTo?._id,
                              label: selectedTask.assignedTo?.username,
                            },
                          ]
                      }
                      placeholder="Select receiver..."
                      isSearchable
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: 'none',
                          minHeight: '38px',
                          '&:hover': {
                            borderColor: '#3b82f6',
                          }
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        })
                      }}
                    />
                  </div>
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700"
                >
                  <FiX size={22} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-4">
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
                          className={`px-4 py-3 rounded-2xl break-words shadow-sm relative transition-all duration-200 hover:shadow-md ${isMine
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
                                className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all duration-200 ${isMine
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
                                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                >
                                  <FiCheck size={16} />
                                  Save
                                </button>

                                <button
                                  onClick={() => setEditingRemarkId(null)}
                                  className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
                                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white hover:bg-gray-50 border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-lg hover:shadow-xl transform hover:scale-110"
                                      title="Edit message"
                                    >
                                      <FiEdit2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-opacity-20">
                                <span className={`text-xs font-medium ${isMine ? "text-white/90" : "text-gray-600"}`}>
                                  {msg.senderId?.username ||
                                    (msg.sendToAll ? "All" : "All")}
                                </span>
                                <span className={`text-xs ${isMine ? "text-white/80" : "text-gray-500"}`}>
                                  {new Date(msg.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })} • {new Date(msg.createdAt).toLocaleTimeString([], {
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
              ) : (
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your remark here..."
                    className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 pr-12"
                  />
                  {message && (
                    <button
                      onClick={() => setMessage("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiXCircle size={18} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className={`p-3 rounded-full shadow-md transition-all duration-200 transform hover:scale-105 ${message.trim()
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
  );
};

export default TaskStatus;