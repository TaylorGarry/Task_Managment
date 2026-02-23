import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTask, createCoreTask, fetchTasks } from "../features/slices/taskSlice";
import { fetchEmployees } from "../features/slices/authSlice";
import toast, { Toaster } from "react-hot-toast";

const AssignTask = () => {
  const dispatch = useDispatch();
  const { employees } = useSelector((state) => state.auth);
  const user = JSON.parse(localStorage.getItem("user"));

  const [activeTab, setActiveTab] = useState("normal");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: [],
    shift: "Start",
    department: "",
    priority: "Medium",
    initialRemark: "",
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchTasks());
  }, [dispatch]);

  useEffect(() => {
    if (formData.department) {
      let usersInDept = [];
      if (user.accountType === "superAdmin") {
        usersInDept = employees.filter(emp => emp.department === formData.department);
      } else {
        usersInDept = employees.filter(emp => emp.department === formData.department && emp.accountType === "employee");
      }
      setFilteredUsers(usersInDept);
    } else {
      setFilteredUsers([]);
    }
    setFormData(prev => ({ ...prev, assignedTo: [] }));
    setSelectAll(false);
  }, [formData.department, employees, user.accountType]);

  const handleInputChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCheckboxChange = (id) => {
    setFormData(prev => {
      const assigned = prev.assignedTo.includes(id)
        ? prev.assignedTo.filter(u => u !== id)
        : [...prev.assignedTo, id];
      return { ...prev, assignedTo: assigned };
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setFormData(prev => ({ ...prev, assignedTo: [] }));
    } else {
      setFormData(prev => ({ ...prev, assignedTo: filteredUsers.map(u => u._id) }));
    }
    setSelectAll(!selectAll);
  };

  const shouldShowShift = () => {
    if (formData.assignedTo.length === 0) return true;
    const selectedUsers = filteredUsers.filter(u => formData.assignedTo.includes(u._id));
    return !selectedUsers.some(u => ["admin", "superAdmin"].includes(u.accountType));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.department || !formData.title) {
      toast.error("Please fill all required fields!");
      return;
    }

    const dataToSend = {
      ...formData,
      assignedTo: formData.assignedTo.length ? formData.assignedTo : [],
    };

    try {
      if (activeTab === "core") {
        dataToSend.isCoreTeamTask = true;
        await dispatch(createCoreTask({ data: dataToSend })).unwrap();
      } else {
        await dispatch(createTask({ data: dataToSend })).unwrap();
      }

      toast.success("Task assigned successfully!");
      setFormData({
        title: "",
        description: "",
        assignedTo: [],
        shift: "Start",
        department: "",
        priority: "Medium",
        initialRemark: "",
      });
      setSelectAll(false);
    } catch (err) {
      toast.error(err || "Error assigning task");
    }
  };

  const departments = [...new Set(employees.map(emp => emp.department))];

  return (
<<<<<<< HEAD
    <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-10">
      <Toaster />
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-4xl p-5">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setActiveTab("normal")}
            className={`px-6 py-2 rounded-l-lg font-semibold cursor-pointer ${
              activeTab === "normal"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Normal Task
          </button>
          <button
            onClick={() => setActiveTab("core")}
            className={`px-6 py-2 rounded-r-lg font-semibold cursor-pointer ${
              activeTab === "core"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Core Team Task
          </button>
        </div>

        <form
          onSubmit={handleAddTask}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-500"
        >
          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={formData.title}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          <div className="border border-gray-300 rounded-lg p-3 overflow-y-auto max-h-64">
            {filteredUsers.length > 0 && (
              <div className="mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="mr-2"
                  />
                  Select All
                </label>
              </div>
            )}
            {filteredUsers.map(emp => (
              <label key={emp._id} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={formData.assignedTo.includes(emp._id)}
                  onChange={() => handleCheckboxChange(emp._id)}
                  className="mr-2"
                />
                {emp.username} ({emp.accountType})
              </label>
            ))}
          </div>

          {activeTab === "normal" && shouldShowShift() && (
            <select
              name="shift"
              value={formData.shift}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Start">Start</option>
              <option value="Mid">Mid</option>
              <option value="End">End</option>
            </select>
          )}

          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <textarea
            name="description"
            placeholder="Task Description"
            value={formData.description}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-400 lg:col-span-2"
          />

          {activeTab === "core" && (
            <textarea
              name="initialRemark"
              placeholder="Initial Remark (for Core Team Task)"
              value={formData.initialRemark}
              onChange={handleInputChange}
              className="border border-gray-300 rounded-lg p-3 h-20 focus:outline-none focus:ring-2 focus:ring-blue-400 lg:col-span-2"
            />
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 cursor-pointer rounded-lg font-semibold hover:bg-blue-700 transition duration-300 lg:col-span-2"
          >
            {activeTab === "core" ? "Assign Core Team Task" : "Assign Task"}
          </button>
        </form>
=======
    <div className="relative min-h-screen mt-5 bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Toaster />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_10%,rgba(37,99,235,0.14),rgba(248,250,252,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_15%_85%,rgba(14,116,144,0.12),rgba(248,250,252,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.15),rgba(248,250,252,0.85))]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
          <div className="grid lg:grid-cols-[1.05fr_1.4fr]">
            <div className="relative p-8 lg:p-10 bg-gradient-to-br from-slate-100 via-blue-50 to-white border-r border-slate-200">
              <div
                className="text-sm uppercase tracking-[0.35em] text-blue-700"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Task Intake
              </div>
              <h2
                className="mt-5 text-3xl font-semibold leading-tight text-slate-900"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Assign work with clarity and control.
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Segment tasks by team, shift, and priority so delivery stays on track.
              </p>

              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase text-slate-500">Mode</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {activeTab === "core" ? "Core Team" : "Normal"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase text-slate-500">Priority</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {formData.priority}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-white p-8 lg:p-10"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">Assign Task</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Complete the details below to allocate work.
                  </p>
                </div>
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                  <button
                    onClick={() => setActiveTab("normal")}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      activeTab === "normal"
                        ? "rounded-full bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setActiveTab("core")}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      activeTab === "core"
                        ? "rounded-full bg-blue-600 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Core Team
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleAddTask}
                className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2"
              >
                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Task Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. Reconcile onboarding queue"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-2xl cursor-pointer border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dep => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="mt-2 w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Assign To</label>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {filteredUsers.length > 0 && (
                      <div className="mb-3 flex items-center justify-between">
                        <label className="flex items-center text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="mr-2"
                          />
                          Select All
                        </label>
                        <span className="text-xs text-slate-400">
                          {formData.assignedTo.length} selected
                        </span>
                      </div>
                    )}
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {filteredUsers.map(emp => (
                        <label key={emp._id} className="flex items-center text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={formData.assignedTo.includes(emp._id)}
                            onChange={() => handleCheckboxChange(emp._id)}
                            className="mr-2"
                          />
                          {emp.username} ({emp.accountType})
                        </label>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-sm text-slate-400">
                          Select a department to load employees.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {activeTab === "normal" && shouldShowShift() && (
                  <div>
                    <label className="text-sm font-medium text-slate-700">Shift</label>
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-2xl cursor-pointer border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                      <option value="Start">Start</option>
                      <option value="Mid">Mid</option>
                      <option value="End">End</option>
                    </select>
                  </div>
                )}

                <div className={activeTab === "normal" && shouldShowShift() ? "" : "lg:col-span-2"}>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    name="description"
                    placeholder="Add key details, expectations, or links"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-2 h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {activeTab === "core" && (
                  <div className="lg:col-span-2">
                    <label className="text-sm font-medium text-slate-700">
                      Initial Remark
                    </label>
                    <textarea
                      name="initialRemark"
                      placeholder="Context for core team execution"
                      value={formData.initialRemark}
                      onChange={handleInputChange}
                      className="mt-2 h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="lg:col-span-2 w-full rounded-2xl bg-blue-600 py-3 cursor-pointer text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  {activeTab === "core" ? "Assign Core Team Task" : "Assign Task"}
                </button>
              </form>
            </div>
          </div>
        </div>
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
      </div>
    </div>
  );
};

export default AssignTask;
<<<<<<< HEAD

=======
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
