import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks } from "../features/slices/taskSlice.js";
import { fetchEmployees } from "../features/slices/authSlice.js";
import { fetchRemarks, addRemark } from "../features/slices/remarkSlice.js";
import TaskCard from "./TaskCard.jsx";
import { FiX } from "react-icons/fi";
import Select from "react-select";

const TaskStatus = () => {
  const dispatch = useDispatch();
  const { tasks, loading } = useSelector((state) => state.tasks);
  const { employees } = useSelector((state) => state.auth);
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(fetchTasks(filters));
    dispatch(fetchEmployees());
  }, [dispatch, filters]);

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

    const finalReceiver = user.accountType === "admin" ? receiverId?.value || null : null;

    await dispatch(
      addRemark({
        taskId: selectedTask._id,
        message,
        receiverId: finalReceiver,
      })
    );

    setMessage("");
    if (user.accountType === "admin") setReceiverId(null);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];

  const filteredEmployees = filters.department
    ? employees.filter((e) => e.department === filters.department)
    : employees;

  const employeeOptions = employees.map((emp) => ({
    value: emp._id,
    label: emp.username,
  }));

  return (
    <div className="p-6 mt-10 relative min-h-[70vh]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-20">
          <div className="flex space-x-2">
            <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-4 h-4 bg-[#EAEAEA] rounded-full animate-bounce" />
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-3 text-gray-800">Task Status</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          max={today}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        />

        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          max={today}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        />

        <select
          name="department"
          value={filters.department}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          name="shift"
          value={filters.shift}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        >
          <option value="">All Shifts</option>
          <option value="Start">Start</option>
          <option value="Mid">Mid</option>
          <option value="End">End</option>
        </select>

        <select
          name="employee"
          value={filters.employee}
          onChange={handleFilterChange}
          className="border p-2 rounded w-full sm:w-1/4 cursor-pointer border-[#EAEAEA]"
        >
          <option value="">All Employees</option>
          {filteredEmployees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.username}
            </option>
          ))}
        </select>
      </div>

      {!loading &&
        (tasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} onOpenChat={handleOpenChat} />
            ))}
          </div>
        ) : (
          <h1 className="text-center text-gray-500 mt-10 text-4xl font-bold tracking-wide bg-gray-50 py-35 rounded-lg shadow-sm">
            No tasks found
          </h1>
        ))}

      {selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-[420px] max-h-[80vh] rounded-2xl shadow-lg flex flex-col">
            <div className="flex justify-between items-center p-4 border-b gap-3">

              {/* LEFT → Task title */}
              <h3 className="font-semibold text-gray-800 text-lg">{selectedTask.title}</h3>

              {/* RIGHT → Receiver dropdown + Close button */}
              <div className="flex items-center gap-2 rounded-full ">

                {user.accountType === "admin" && (
                  <div className="w-40 ">
                    <Select
                      value={receiverId}
                      onChange={setReceiverId}
                      options={
  Array.isArray(selectedTask.assignedTo)
    ? selectedTask.assignedTo.map((emp) => ({
        value: emp._id,
        label: emp.username,
      }))
    : [{
        value: selectedTask.assignedTo?._id,
        label: selectedTask.assignedTo?.username,
      }]
}


                      placeholder="Receiver"
                      isSearchable
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: "9999px",
                          borderColor: "#d1d5db", // tailwind gray-300
                          paddingLeft: "6px",
                          paddingRight: "6px",
                          minHeight: "38px",
                          boxShadow: "none",
                          "&:hover": {
                            borderColor: "#9ca3af",  
                          },
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: "12px",
                          overflow: "hidden",
                        }),
                      }}
                    />

                  </div>
                )}

                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={20} />
                </button>

              </div>
            </div>


            <div className="flex-1 overflow-y-auto p-4 bg-[#f5f7fa] space-y-3">
              {remarks.length > 0 ? (
                remarks.map((msg) => {
                  const isMine = String(msg.senderId?._id) === String(user.id);

                  return (
                    <div key={msg._id} className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl max-w-[75%] break-words shadow-sm ${isMine
                            ? "bg-[#0078d4] text-white rounded-br-none"
                            : "bg-gray-200 text-gray-800 rounded-bl-none"
                          }`}
                      >
                        <p className="text-sm">{msg.message}</p>

                        <div className="flex justify-between mt-1 text-[11px]">
                          <span className="font-medium text-gray-600">{msg.senderId?.username}</span>
                          <span className={isMine ? "text-white/80" : "text-gray-500"}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-center mt-4">No messages yet</p>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            <div className="p-3 border-t flex items-center gap-2 bg-white">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a remark..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />

              <button
                onClick={handleSendMessage}
                className="bg-[#0078d4] hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatus;
