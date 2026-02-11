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
    <div className="relative min-h-screen mt-5 bg-[#0f172a]">
      <Toaster />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_10%,rgba(56,189,248,0.25),rgba(15,23,42,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_15%_85%,rgba(244,63,94,0.18),rgba(15,23,42,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.25),rgba(15,23,42,0.9))]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12">
        <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_40px_90px_-45px_rgba(2,6,23,0.9)] backdrop-blur">
          <div className="grid lg:grid-cols-[1.05fr_1.4fr]">
            <div className="relative p-8 text-white lg:p-10">
              <div
                className="text-sm uppercase tracking-[0.35em] text-cyan-300/90"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Task Intake
              </div>
              <h2
                className="mt-5 text-3xl font-semibold leading-tight"
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
              >
                Assign work with clarity and control.
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Segment tasks by team, shift, and priority so delivery stays on track.
              </p>

              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase text-slate-400">Mode</p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {activeTab === "core" ? "Core Team" : "Normal"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase text-slate-400">Priority</p>
                  <p className="mt-1 text-base font-semibold text-white">
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
                        ? "rounded-full bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setActiveTab("core")}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      activeTab === "core"
                        ? "rounded-full bg-slate-900 text-white"
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
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="mt-2 w-full rounded-2xl cursor-pointer border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
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
                    className="mt-2 w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
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
                      className="mt-2 w-full rounded-2xl cursor-pointer border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
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
                    className="mt-2 h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
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
                      className="mt-2 h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="lg:col-span-2 w-full rounded-2xl bg-slate-900 py-3 cursor-pointer text-base font-semibold text-white transition hover:bg-slate-800"
                >
                  {activeTab === "core" ? "Assign Core Team Task" : "Assign Task"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTask;

