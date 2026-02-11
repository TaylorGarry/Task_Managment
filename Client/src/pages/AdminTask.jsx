import React, { useEffect, useState, useRef } from "react";
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

const AdminTask = () => {
  const dispatch = useDispatch();
  const { adminTasks = [], loading, error } = useSelector(
    (state) => state.tasks
  );
  const { remarks, loading: remarksLoading } = useSelector(
    (state) => state.remarks
  );
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
    <div className="relative min-h-screen bg-[#f8f7fb]">
      <Toaster position="top-right" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_0%,rgba(248,113,113,0.18),rgba(248,247,251,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_0%_30%,rgba(59,130,246,0.16),rgba(248,247,251,0))]" />

      <div className="relative mx-auto max-w-6xl py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Oversight Hub
            </p>
            <h1
              className="mt-2 text-3xl font-semibold text-slate-900"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Admin Task Review
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor status, priorities, and team remarks in one place.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
              {adminTasks.length} total task{adminTasks.length === 1 ? "" : "s"}
            </div>
            <div className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-500 sm:block">
              Updated live
            </div>
          </div>
        </div>

        {loading && <p className="mt-6 text-slate-500">Loading tasks...</p>}
        {error && <p className="mt-6 text-rose-600">{error}</p>}
        {!loading && adminTasks.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No tasks created for you
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminTasks.map((task) => {
            const assigneeCount =
              (task.doneEmployees?.length || 0) +
              (task.notDoneEmployees?.length || 0);
            const remarkCount = task.remarks?.length || 0;

            return (
              <div
                key={task._id}
                className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_25px_60px_-50px_rgba(15,23,42,0.5)]"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {task.title}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {assigneeCount} assignee{assigneeCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {task.description || "No description provided."}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Department</span>
                      <span className="font-semibold text-slate-900">
                        {task.department || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Priority</span>
                      <span className="font-semibold text-slate-900">
                        {task.priority || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shift</span>
                      <span className="font-semibold text-slate-900">
                        {task.shift || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Employee Status
                    </h3>
                    <div className="mt-3 space-y-2 text-sm">
                      {task.doneEmployees?.map((e) => (
                        <div key={e._id} className="flex items-center text-emerald-600">
                          <div className="mr-2 h-2 w-2 rounded-full bg-emerald-500"></div>
                          <span>{e.username} - Done</span>
                        </div>
                      ))}
                      {task.notDoneEmployees?.map((e) => (
                        <div key={e._id} className="flex items-center text-rose-600">
                          <div className="mr-2 h-2 w-2 rounded-full bg-rose-500"></div>
                          <span>{e.username} - Not Done</span>
                        </div>
                      ))}
                      {!task.doneEmployees?.length &&
                        !task.notDoneEmployees?.length && (
                          <div className="text-sm text-slate-400">
                            No employee status yet
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                    value={selectedStatus[task._id] || ""}
                    onChange={(e) =>
                      handleStatusChange(task._id, e.target.value)
                    }
                  >
                    <option value="">Select Status</option>
                    <option value="Done">Done</option>
                    <option value="Not Done">Not Done</option>
                  </select>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(task._id)}
                      className="flex-1 rounded-2xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Update Status
                    </button>

                    <button
                      onClick={() => openRemarkPopup(task)}
                      title="Add / View Remark"
                      className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:border-slate-300 hover:bg-white"
                    >
                      <MessageCircle size={20} />
                      {remarkCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-200 bg-slate-900 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{currentTask.title}</h2>
                    <p className="mt-1 text-xs text-slate-300">
                      {(currentTask.doneEmployees?.length || 0) +
                        (currentTask.notDoneEmployees?.length || 0)}{" "}
                      assignee(s)
                    </p>
                  </div>
                  <button
                    onClick={closeRemarkPopup}
                    className="text-white/80 transition hover:text-white"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  {currentTask.description || "No description provided"}
                </p>
              </div>

              <div className="max-h-[50vh] flex-1 overflow-y-auto p-5">
                {remarksLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900"></div>
                  </div>
                ) : remarks.length === 0 ? (
                  <div className="py-10 text-center text-slate-500">
                    <MessageCircle size={48} className="mx-auto mb-3 text-slate-300" />
                    <p>No remarks yet</p>
                    <p className="mt-1 text-sm">Be the first to add a remark</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {remarks.map((remark) => {
                      const isCurrentUser = remark.senderId?._id === user?._id;
                      return (
                        <div key={remark._id} className={isCurrentUser ? "text-right" : ""}>
                          <div
                            className={`inline-block max-w-[80%] rounded-2xl p-3 ${
                              isCurrentUser ? "bg-blue-100" : "bg-slate-100"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              {!isCurrentUser && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                                  <User size={12} />
                                </div>
                              )}
                              <span
                                className={`text-sm font-semibold ${
                                  isCurrentUser ? "text-blue-700" : "text-slate-700"
                                }`}
                              >
                                {remark.senderId?.username || "Unknown"}
                              </span>
                              {isCurrentUser && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                                  <User size={12} />
                                </div>
                              )}
                            </div>
                            <p className="mb-2 text-slate-800">{remark.message}</p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{formatDate(remark.createdAt)}</span>
                              <span>{formatTime(remark.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={remarksEndRef} />
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <textarea
                      placeholder="Type your remark here..."
                      className="w-full resize-none px-4 py-3 text-sm focus:outline-none"
                      rows={2}
                      value={remarkMessage}
                      onChange={(e) => setRemarkMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                      Press Enter to send • Shift + Enter for new line
                    </div>
                  </div>
                  <button
                    onClick={handleSendRemark}
                    disabled={!remarkMessage.trim()}
                    className={`rounded-2xl p-3 text-white transition ${
                      remarkMessage.trim()
                        ? "bg-slate-900 hover:bg-slate-800"
                        : "bg-slate-300"
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTask;
