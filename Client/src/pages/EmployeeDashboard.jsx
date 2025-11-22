import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, fetchCoreTasks, updateTaskStatus, updateTaskStatusCoreTeam } from "../features/slices/taskSlice";
import { fetchRemarks, addRemark } from "../features/slices/remarkSlice";
import TaskCard from "./TaskCard";
import Navbar from "./Navbar";
import { Toaster, toast } from "react-hot-toast";
import { MessageCircle } from "lucide-react";

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
            <span className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></span>
            <span className="w-3 h-3 bg-gray-300 rounded-full animate-bounce200"></span>
            <span className="w-3 h-3 bg-gray-300 rounded-full animate-bounce400"></span>
          </div>
        )}

       {error && (
  <p className="text-red-500">
    {typeof error === "string" ? error : error.message || "Something went wrong"}
  </p>
)}


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.length === 0 && !loading ? (
            <h1 className="text-center text-gray-400 text-xl font-medium p-8 rounded-2xl border border-[#EAEAEA] bg-white shadow-sm">
              No tasks found
            </h1>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="relative">
                <TaskCard task={task} onStatusChange={handleStatusChange} />
                 
                  <button
                    onClick={() => openChat(task)}
                    className="absolute top-3 right-3 bg-sky-100 hover:bg-sky-200 p-2 rounded-full transition"
                  >
                    <MessageCircle className="w-5 h-5 text-sky-600 cursor-pointer" />
                  </button>
                
              </div>
            ))
          )}
        </div>
       {isChatOpen && (
        <div className="fixed top-20 right-4 w-96 rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col z-50 max-h-[80vh]">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">{selectedTask?.title}</h2>
            <button onClick={closeChat} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {selectedTask?.initialRemark && (
              <div className="flex justify-start w-full">
                <div className="bg-gray-200 p-3 rounded-xl rounded-tr-none max-w-[70%] break-words">
                  {selectedTask.initialRemark}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(selectedTask.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )}

            {remarks.length > 0 ? remarks.map((r) => {
              const isMine = String(r.senderId?._id).trim() === String(user.id).trim();
              return (
                <div key={r._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 max-w-[70%] break-words ${isMine ? 'bg-sky-500 text-white rounded-xl rounded-tl-none' : 'bg-gray-200 text-gray-700 rounded-xl rounded-tr-none'}`}>
                    {r.message}
                    <div className="flex justify-between mt-1 text-[11px]">
                          <span className="font-medium text-gray-600">
                            {r.senderId?.username}
                          </span>
                          <span className={`${isMine ? "text-white/80" : "text-gray-500"}`}>
                            {new Date(r.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-gray-400 text-center mt-2">No remarks yet</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder="Add a remark..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 border rounded-full focus:ring focus:ring-sky-100 outline-none"
            />
            <button
              onClick={handleSendRemark}
              className="bg-sky-500 text-white px-4 py-2 rounded-full hover:bg-sky-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default EmployeeDashboard;
