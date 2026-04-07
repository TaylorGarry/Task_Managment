import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTasks, fetchCoreTasks, updateTaskStatus, updateTaskStatusCoreTeam } from "../features/slices/taskSlice";
import { fetchRemarks, addRemark, updateRemark } from "../features/slices/remarkSlice";
import { fetchEmployeeDashboardSummary } from "../features/slices/authSlice";
import TaskCard from "./TaskCard";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { MessageCircle } from "lucide-react";
import { FiX, FiSend, FiEdit2, FiCheck, FiXCircle } from "react-icons/fi";
import { subscribeUserToPush } from "../utils/pushNotifications";

const STATIC_POLICY_DOCS = [
  "/policies/Leave Policy.pdf",
  "/policies/IT Usage Policy.pdf",
  "/policies/Exit Policy 1.1.pdf",
  "/policies/Data Security Agreement.pdf",
  "/policies/Code of Conduct.pdf",
];
const LEGACY_POLICY_DOC = "/policy-sample.txt";
const normalizePolicyKey = (value = "") => {
  const raw = String(value || "").trim().split("?")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const getPolicyName = (url = "") => {
  const clean = normalizePolicyKey(url);
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean || "Policy";
};

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { remarks, loading: remarksLoading } = useSelector((state) => state.remarks);
  const { employeeDashboardSummary } = useSelector((state) => state.auth);
  const user = JSON.parse(localStorage.getItem("user"));
  const currentUserId = user?._id || user?.id;
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
  const [policyPreviewText, setPolicyPreviewText] = useState("");
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activePolicyUrl, setActivePolicyUrl] = useState("");
  const [activePolicyPreviewUrl, setActivePolicyPreviewUrl] = useState("");
  const [activePolicyText, setActivePolicyText] = useState("");
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyLoadError, setPolicyLoadError] = useState("");
  const delegatedFromUserId =
    new URLSearchParams(location.search).get("delegatedFrom") || "";
  const visibleTasks = delegatedFromUserId
    ? tasks.filter((task) => String(task?.actingForUserId || "") === delegatedFromUserId)
    : tasks;

  const shiftOptions = ["Start", "Mid", "End"];
  const departmentOptions = [employeeDepartment];
  const messagesEndRef = useRef(null);

useEffect(() => {
  let isSubscribed = false;
  
  const initPush = async () => {
    if (isSubscribed) return;
    isSubscribed = true;
    
    await subscribeUserToPush();
  };
  
  initPush();
  
  return () => {
    isSubscribed = true;
  };
}, []);

  useEffect(() => {
    if (user?.accountType === "employee") {
      dispatch(fetchEmployeeDashboardSummary());
    }
  }, [dispatch, user?.accountType]);

  useEffect(() => {
    const loadPolicyText = async () => {
      try {
        const res = await fetch("/policy-sample.txt");
        const text = await res.text();
        setPolicyPreviewText(text);
      } catch (err) {
        setPolicyPreviewText("Unable to load policy text preview.");
      }
    };
    loadPolicyText();
  }, []);


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
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }

    if (status === "") {
      toast.error("Please select a valid status");
      return;
    }


    const normalizeDate = (dateInput) => {
      if (!dateInput) return '';

      try {
        if (dateInput instanceof Date) {
          return dateInput.toISOString().split('T')[0];
        }

        if (typeof dateInput === 'string') {
          const d = new Date(dateInput);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
        }

        return '';
      } catch (error) {
        return '';
      }
    };

    const taskNormalizedDate = normalizeDate(task.date);

    // Get all tasks for the same normalized date
    const sameDayTasks = tasks.filter(t => {
      const tDate = normalizeDate(t.date);
      return tDate === taskNormalizedDate && tDate !== '';
    });



    // Group tasks by shift
    const startTasks = sameDayTasks.filter(t => t.shift === "Start");
    const midTasks = sameDayTasks.filter(t => t.shift === "Mid");


    // Check if current task is missed
    const isTaskMissed = (task.employeeStatus === "" || !task.employeeStatus) &&
      task.canUpdate === false;

    if (isTaskMissed) {
      toast.error(`${task.shift} shift time window has passed. Can update tomorrow.`);
      return;
    }

    const canTaskBeUpdated = task.canUpdate === true;

    if (!canTaskBeUpdated) {
      toast.error(`${task.shift} shift time window is not currently open.`);
      return;
    }


    const areAllTasksInShiftHandled = (shiftTasks) => {
      if (shiftTasks.length === 0) {
        return true;
      }

      const unhandledTasks = shiftTasks.filter(t => {
        const hasStatus = t.employeeStatus && t.employeeStatus !== "";
        const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
        return !hasStatus && !isMissed;
      });


      return unhandledTasks.length === 0;
    };

    let isBlocked = false;
    let blockReason = "";

    if (task.shift === "Mid") {
      if (startTasks.length > 0) {
        const allStartHandled = areAllTasksInShiftHandled(startTasks);

        if (!allStartHandled) {
          isBlocked = true;

          const pendingStart = startTasks.filter(t => {
            const hasStatus = t.employeeStatus && t.employeeStatus !== "";
            const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
            return !hasStatus && !isMissed;
          });

          const missedStart = startTasks.filter(t =>
            (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false
          );

          let reason = `Cannot update Mid shift. `;
          if (pendingStart.length > 0) {
            reason += `${pendingStart.length} Start shift task(s) pending completion. `;
          }
          if (missedStart.length > 0) {
            reason += `${missedStart.length} Start shift task(s) missed (time window passed).`;
          }
          blockReason = reason.trim();
        }
      } else {
      }
    }

    if (task.shift === "End") {
      const allStartHandled = areAllTasksInShiftHandled(startTasks);
      const allMidHandled = areAllTasksInShiftHandled(midTasks);


      if (startTasks.length > 0 && !allStartHandled) {
        isBlocked = true;

        const pendingStart = startTasks.filter(t => {
          const hasStatus = t.employeeStatus && t.employeeStatus !== "";
          const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
          return !hasStatus && !isMissed;
        });

        const missedStart = startTasks.filter(t =>
          (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false
        );

        let reason = `Cannot update End shift. `;
        if (pendingStart.length > 0) {
          reason += `${pendingStart.length} Start shift task(s) pending completion. `;
        }
        if (missedStart.length > 0) {
          reason += `${missedStart.length} Start shift task(s) missed (time window passed).`;
        }
        blockReason = reason.trim();

      } else if (midTasks.length > 0 && !allMidHandled) {
        isBlocked = true;

        const pendingMid = midTasks.filter(t => {
          const hasStatus = t.employeeStatus && t.employeeStatus !== "";
          const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
          return !hasStatus && !isMissed;
        });

        const missedMid = midTasks.filter(t =>
          (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false
        );

        let reason = `Cannot update End shift. `;
        if (pendingMid.length > 0) {
          reason += `${pendingMid.length} Mid shift task(s) pending completion. `;
        }
        if (missedMid.length > 0) {
          reason += `${missedMid.length} Mid shift task(s) missed (time window passed).`;
        }
        blockReason = reason.trim();
      }
    }

    if (isBlocked) {
      toast.error(blockReason);
      return;
    }


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
        const payload = { id: taskId, status };
        if (task.actingForUserId && task.actingForUserId !== currentUserId) {
          payload.actingForUserId = task.actingForUserId;
        }

        updatedStatus = await dispatch(
          updateTaskStatus(payload)
        ).unwrap();
        dispatch({
          type: "tasks/updateTaskStatus/fulfilled",
          payload: updatedStatus,
        });
      }

      toast.success("Task status updated successfully!");
    } catch (err) {
      const errorMessage = err?.message || err || "Failed to update status, please try again.";
      toast.error(errorMessage);
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

  const formatDate = (dateVal) => {
    if (!dateVal) return "-";
    return new Date(dateVal).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatHour = (hour) => {
    if (hour === undefined || hour === null) return "-";
    const h = Number(hour);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12} ${suffix}`;
  };

  const getPolicySignatureStatus = (docUrl, profileData) => {
    const signatures = Array.isArray(profileData?.policySignatures) ? profileData.policySignatures : [];
    const target = normalizePolicyKey(docUrl);
    return signatures.find((item) => normalizePolicyKey(item?.documentUrl || "") === target) || null;
  };
  const getPolicyPreviewUrl = (docUrl, profileData) => {
    const status = getPolicySignatureStatus(docUrl, profileData);
    return status?.signedPdfUrl || docUrl;
  };

  const isTextPolicy = (url = "") => {
    const clean = String(url).toLowerCase().split("?")[0];
    return clean.endsWith(".txt") || clean.endsWith(".md");
  };

  const isImagePolicy = (url = "") => {
    const clean = String(url).toLowerCase().split("?")[0];
    return [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].some((ext) => clean.endsWith(ext));
  };

  const openPolicyModal = async (url, previewUrl = url) => {
    setActivePolicyUrl(url);
    setActivePolicyPreviewUrl(previewUrl || url);
    setActivePolicyText("");
    setPolicyLoadError("");
    setShowPolicyModal(true);

    if (isTextPolicy(previewUrl || url)) {
      try {
        setPolicyLoading(true);
        const res = await fetch(previewUrl || url);
        const text = await res.text();
        setActivePolicyText(text);
      } catch (err) {
        setPolicyLoadError("Unable to load policy text.");
      } finally {
        setPolicyLoading(false);
      }
    }
  };

  const profile = employeeDashboardSummary?.profile;
  const policyLinks = (() => {
    const docs = Array.isArray(profile?.policyDocuments) ? profile.policyDocuments.filter(Boolean) : [];
    if (!docs.length) return STATIC_POLICY_DOCS;
    const allLegacy = docs.every((d) => String(d || "").trim() === LEGACY_POLICY_DOC);
    return allLegacy ? STATIC_POLICY_DOCS : docs;
  })();

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen relative">
        {profile && (
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Employee Profile</p>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Real Name</p>
                  <p className="font-semibold text-slate-800">{profile.realName || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Pseudo Name</p>
                  <p className="font-semibold text-slate-800">{profile.pseudoName || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Employee ID</p>
                  <p className="font-semibold text-slate-800">{profile.empId || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Department</p>
                  <p className="font-semibold text-slate-800">{profile.department || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Designation</p>
                  <p className="font-semibold text-slate-800">{profile.designation || "-"}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-slate-500">Joining Date</p>
                  <p className="font-semibold text-slate-800">{formatDate(profile.dateOfJoining)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Policy Agreement</p>
              <p className="mt-3 text-sm text-slate-600">
                {profile.policyAgreement?.agreed
                  ? `Accepted on ${formatDate(profile.policyAgreement?.agreedAt)}`
                  : "Sign each policy document to complete onboarding."}
              </p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Policy Details</p>
                <p className="mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                  {policyPreviewText || "Loading policy content..."}
                </p>
              </div>
                <div className="mt-3 text-xs text-slate-500">
                Docs:
                <div className="mt-1 flex flex-wrap gap-2">
                  {policyLinks.map((doc, idx) => (
                    <div key={`${doc}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-2 py-1">
                      <button
                        type="button"
                        onClick={() => openPolicyModal(doc, getPolicyPreviewUrl(doc, profile))}
                        className="rounded-full px-1.5 text-cyan-700 hover:bg-cyan-50"
                      >
                        {getPolicyName(doc)}
                      </button>
                      {getPolicySignatureStatus(doc, profile)?.employee?.signed ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Signed
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!profile && (
          <div className="mb-8">
            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Policy Agreement</p>
              <p className="mt-3 text-sm text-slate-600">Read and sign each policy document to complete onboarding.</p>
              <div className="mt-3 text-xs text-slate-500">
                Docs:
                <div className="mt-1 flex flex-wrap gap-2">
                  {policyLinks.map((doc, idx) => (
                    <div key={`${doc}-${idx}`} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-2 py-1">
                      <button
                        type="button"
                        onClick={() => openPolicyModal(doc, getPolicyPreviewUrl(doc, profile))}
                        className="rounded-full px-1.5 text-cyan-700 hover:bg-cyan-50"
                      >
                        {getPolicyName(doc)}
                      </button>
                      {getPolicySignatureStatus(doc, profile)?.employee?.signed ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Signed
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {showPolicyModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Policy Document</p>
                  <p className="text-xs text-slate-500">
                    Status:{" "}
                    {getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signed ? "Signed by you" : "Pending your signature"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(activePolicyPreviewUrl || activePolicyUrl) ? (
                    <a
                      href={activePolicyPreviewUrl || activePolicyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-cyan-200 px-3 py-1 text-sm text-cyan-700 hover:bg-cyan-50"
                    >
                      Download
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="h-[calc(85vh-56px)] overflow-auto p-4">
                {policyLoading && <p className="text-sm text-slate-500">Loading policy...</p>}
                {policyLoadError && <p className="text-sm text-rose-600">{policyLoadError}</p>}
                {!policyLoading && !policyLoadError && isTextPolicy(activePolicyPreviewUrl || activePolicyUrl) && (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {activePolicyText}
                  </pre>
                )}
                {!policyLoading &&
                  !policyLoadError &&
                  !isTextPolicy(activePolicyPreviewUrl || activePolicyUrl) &&
                  isImagePolicy(activePolicyPreviewUrl || activePolicyUrl) && (
                  <img
                    src={activePolicyPreviewUrl || activePolicyUrl}
                    alt="Policy"
                    className="mx-auto max-h-[70vh] rounded-lg border border-slate-200"
                  />
                )}
                {!policyLoading &&
                  !policyLoadError &&
                  !isTextPolicy(activePolicyPreviewUrl || activePolicyUrl) &&
                  !isImagePolicy(activePolicyPreviewUrl || activePolicyUrl) && (
                  <iframe
                    src={activePolicyPreviewUrl || activePolicyUrl}
                    title="Policy Preview"
                    className="h-[70vh] w-full rounded-lg border border-slate-200"
                  />
                )}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employee Signature</p>
                  {getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signed ? (
                    <div className="space-y-2">
                      <p className="text-xs text-emerald-700">
                        Already signed on {formatDate(getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signedAt)}
                      </p>
                      {getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signatureUrl && (
                        <img
                          src={getPolicySignatureStatus(activePolicyUrl, profile)?.employee?.signatureUrl}
                          alt="Employee signature"
                          className="max-h-28 rounded border border-emerald-200 bg-white p-2"
                        />
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">
                      Pending. Please contact HR to capture your signature from HR panel.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        {delegatedFromUserId && (
          <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-800">
            Showing only delegated tasks for selected team leader.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTasks.length === 0 && !loading ? (
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
            visibleTasks.map((task) => (
              <div key={task._id} className="relative">
                <TaskCard
                  task={task}
                  onStatusChange={handleStatusChange}
                  allTasks={visibleTasks}
                />
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
                    className={`p-3 rounded-full shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer ${newMessage.trim()
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

