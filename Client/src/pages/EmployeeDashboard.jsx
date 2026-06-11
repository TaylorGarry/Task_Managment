// import React, { useEffect, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import axios from "axios";
// import { fetchTasks, fetchCoreTasks, updateTaskStatus, updateTaskStatusCoreTeam } from "../features/slices/taskSlice";
// import { fetchRemarks, addRemark, updateRemark } from "../features/slices/remarkSlice";
// import { fetchEmployeeDashboardSummary } from "../features/slices/authSlice";
// import TaskCard from "./TaskCard";
// import Navbar from "./Navbar";
// import { useLocation } from "react-router-dom";
// import { Toaster, toast } from "react-hot-toast";
// import { MessageCircle } from "lucide-react";
// import { FiX, FiSend, FiEdit2, FiCheck, FiXCircle } from "react-icons/fi";
// import { subscribeUserToPush } from "../utils/pushNotifications";
// import { getRoleType } from "../utils/roleAccess.js";
// import AgentDashboard from "../components/punchx/AgentDashboard";
// import { getApiBaseUrl } from "../utils/apiUrl";

// const EmployeeDashboard = () => {
//   const dispatch = useDispatch();
//   const location = useLocation();
//   const { tasks, loading, error } = useSelector((state) => state.tasks);
//   const { remarks, loading: remarksLoading } = useSelector((state) => state.remarks);
//   const { employeeDashboardSummary } = useSelector((state) => state.auth);
//   const user = JSON.parse(localStorage.getItem("user"));
//   const API_URL = getApiBaseUrl();
//   const currentUserId = user?._id || user?.id;
//   const roleType = getRoleType(user || {});
//   const isSupervisorUser = roleType === "supervisor";
//   const isAgentUser = roleType === "agent";
//   const isCoreTeam = user?.isCoreTeam;
//   const employeeDepartment = user?.department || "";
//   const [punchSession, setPunchSession] = useState(null);
//   const [attendanceScore, setAttendanceScore] = useState(null);
//   const [breakNowMs, setBreakNowMs] = useState(Date.now());
//   const [announcements, setAnnouncements] = useState([]);
//   const [announcementsLoading, setAnnouncementsLoading] = useState(false);
//   const [announcementsError, setAnnouncementsError] = useState("");

//   const [filters, setFilters] = useState({
//     date: new Date().toISOString().split("T")[0],
//     shift: "",
//     department: employeeDepartment,
//   });

//   const [selectedTask, setSelectedTask] = useState(null);
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [newMessage, setNewMessage] = useState("");
//   const [editingRemarkId, setEditingRemarkId] = useState(null);
//   const [editingMessage, setEditingMessage] = useState("");
//   const activityInFlightRef = useRef(false);
//   const lastActivitySentAtRef = useRef(0);
//   const delegatedFromUserId =
//     new URLSearchParams(location.search).get("delegatedFrom") || "";
//   const visibleTasks = delegatedFromUserId
//     ? tasks.filter((task) => String(task?.actingForUserId || "") === delegatedFromUserId)
//     : tasks;

//   const shiftOptions = ["Start", "Mid", "End"];
//   const departmentOptions = [employeeDepartment];
//   const messagesEndRef = useRef(null);

// useEffect(() => {
//   let isSubscribed = false;
  
//   const initPush = async () => {
//     if (isSubscribed) return;
//     isSubscribed = true;
    
//     await subscribeUserToPush();
//   };
  
//   initPush();
  
//   return () => {
//     isSubscribed = true;
//   };
// }, []);

//   useEffect(() => {
//     if (user?.accountType === "employee") {
//       dispatch(fetchEmployeeDashboardSummary());
//     }
//   }, [dispatch, user?.accountType]);

//   const authHeaders = () => {
//     const token = user?.token;
//     if (!token) throw new Error("Missing auth token for PunchX request");
//     return { headers: { Authorization: `Bearer ${token}` } };
//   };

//   const syncPunchSession = async () => {
//     try {
//       const res = await axios.get(`${API_URL}/punchx/session/today`, authHeaders());
//       setPunchSession(res.data?.session || null);
//       setAttendanceScore(res.data?.attendanceScore || null);
//     } catch (err) {
//       console.error("PunchX session sync failed:", err?.response?.data || err.message);
//     }
//   };


//   const callPunchAction = async (path, body = {}) => {
//     const res = await axios.post(`${API_URL}/punchx${path}`, body, authHeaders());
//     setPunchSession(res.data?.session || null);
//     setAttendanceScore(res.data?.attendanceScore || null);
//     return res;
//   };

//   const handleStartShift = async () => {
//     await callPunchAction("/shift/start");
//   };

//   const handleEndShift = async () => {
//     await callPunchAction("/shift/end");
//   };

//   const handleStartBreak = async (type = "manual") => {
//     await callPunchAction("/break/start", { type });
//   };

//   const handleEndBreak = async () => {
//     await callPunchAction("/break/end");
//   };

//   useEffect(() => {
//     if (!user?.token) return;
//     syncPunchSession();
//   }, [user?.token]);

//   useEffect(() => {
//     if (!user?.token) return;

//     const loadAnnouncements = async () => {
//       try {
//         setAnnouncementsLoading(true);
//         setAnnouncementsError("");
//         const res = await axios.get(`${API_URL}/announcements`, authHeaders());
//         setAnnouncements(Array.isArray(res.data?.announcements) ? res.data.announcements : []);
//       } catch (err) {
//         setAnnouncementsError(err?.response?.data?.message || "Failed to load announcements");
//       } finally {
//         setAnnouncementsLoading(false);
//       }
//     };

//     loadAnnouncements();
//   }, [API_URL, user?.token]);

//   useEffect(() => {
//     const id = setInterval(() => setBreakNowMs(Date.now()), 1000);
//     return () => clearInterval(id);
//   }, []);

//   useEffect(() => {
//     if (!user?.token) return;


//     const sendActivity = async (eventType) => {
//       const nowMs = Date.now();
//       const throttleMs = eventType === "heartbeat" ? 2 * 60 * 1000 : 30 * 1000;
//       if (nowMs - lastActivitySentAtRef.current < throttleMs) return;
//       if (activityInFlightRef.current) return;

//       activityInFlightRef.current = true;
//       try {
//         await callPunchAction("/activity", { eventType, occurredAt: new Date().toISOString() });
//         lastActivitySentAtRef.current = Date.now();
//       } catch (err) {
//         console.error("PunchX activity failed:", err?.response?.data || err.message);
//       } finally {
//         activityInFlightRef.current = false;
//       }
//     };

//     const markActivity = () => {
//       sendActivity("activity");
//     };

//     const onVisibility = () => {
//       if (document.visibilityState === "visible") {
//         markActivity();
//       }
//     };

//     const interval = setInterval(() => {
//       sendActivity("heartbeat");
//     }, 2 * 60 * 1000);

//     window.addEventListener("mousemove", markActivity);
//     window.addEventListener("keydown", markActivity);
//     window.addEventListener("click", markActivity);
//     document.addEventListener("visibilitychange", onVisibility);

//     return () => {
//       clearInterval(interval);
//       window.removeEventListener("mousemove", markActivity);
//       window.removeEventListener("keydown", markActivity);
//       window.removeEventListener("click", markActivity);
//       document.removeEventListener("visibilitychange", onVisibility);
//     };
//   }, [user?.token]);


//   useEffect(() => {
//     if (isCoreTeam) {
//       dispatch(fetchCoreTasks({ department: employeeDepartment }));
//     } else {
//       dispatch(fetchTasks(filters));
//     }
//   }, [dispatch, filters, isCoreTeam]);

//   useEffect(() => {
//     if (selectedTask?._id && isChatOpen) {
//       dispatch(fetchRemarks(selectedTask._id));
//     }
//   }, [dispatch, selectedTask, isChatOpen]);

//   useEffect(() => {
//     if (isChatOpen) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [remarks, isChatOpen]);

//   const handleFilterChange = (e) => {
//     setFilters({ ...filters, [e.target.name]: e.target.value });
//   };

//   const handleStatusChange = async (taskId, status) => {
//     const task = tasks.find(t => t._id === taskId);
//     if (!task) {
//       toast.error("Task not found");
//       return;
//     }

//     if (status === "") {
//       toast.error("Please select a valid status");
//       return;
//     }


//     const normalizeDate = (dateInput) => {
//       if (!dateInput) return '';

//       try {
//         if (dateInput instanceof Date) {
//           return dateInput.toISOString().split('T')[0];
//         }

//         if (typeof dateInput === 'string') {
//           const d = new Date(dateInput);
//           if (!isNaN(d.getTime())) {
//             return d.toISOString().split('T')[0];
//           }
//         }

//         return '';
//       } catch (error) {
//         return '';
//       }
//     };

//     const taskNormalizedDate = normalizeDate(task.date);

//     // Get all tasks for the same normalized date
//     const sameDayTasks = tasks.filter(t => {
//       const tDate = normalizeDate(t.date);
//       return tDate === taskNormalizedDate && tDate !== '';
//     });



//     // Group tasks by shift
//     const startTasks = sameDayTasks.filter(t => t.shift === "Start");
//     const midTasks = sameDayTasks.filter(t => t.shift === "Mid");


//     // Check if current task is missed
//     const isTaskMissed = (task.employeeStatus === "" || !task.employeeStatus) &&
//       task.canUpdate === false;

//     if (isTaskMissed) {
//       toast.error(`${task.shift} shift time window has passed. Can update tomorrow.`);
//       return;
//     }

//     const canTaskBeUpdated = task.canUpdate === true;

//     if (!canTaskBeUpdated) {
//       toast.error(`${task.shift} shift time window is not currently open.`);
//       return;
//     }


//     const areAllTasksInShiftHandled = (shiftTasks) => {
//       if (shiftTasks.length === 0) {
//         return true;
//       }

//       const unhandledTasks = shiftTasks.filter(t => {
//         const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//         const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
//         return !hasStatus && !isMissed;
//       });


//       return unhandledTasks.length === 0;
//     };

//     let isBlocked = false;
//     let blockReason = "";

//     if (task.shift === "Mid") {
//       if (startTasks.length > 0) {
//         const allStartHandled = areAllTasksInShiftHandled(startTasks);

//         if (!allStartHandled) {
//           isBlocked = true;

//           const pendingStart = startTasks.filter(t => {
//             const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//             const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
//             return !hasStatus && !isMissed;
//           });

//           const missedStart = startTasks.filter(t =>
//             (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false
//           );

//           let reason = `Cannot update Mid shift. `;
//           if (pendingStart.length > 0) {
//             reason += `${pendingStart.length} Start shift task(s) pending completion. `;
//           }
//           if (missedStart.length > 0) {
//             reason += `${missedStart.length} Start shift task(s) missed (time window passed).`;
//           }
//           blockReason = reason.trim();
//         }
//       } else {
//       }
//     }

//     if (task.shift === "End") {
//       const allStartHandled = areAllTasksInShiftHandled(startTasks);
//       const allMidHandled = areAllTasksInShiftHandled(midTasks);


//       if (startTasks.length > 0 && !allStartHandled) {
//         isBlocked = true;

//         const pendingStart = startTasks.filter(t => {
//           const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//           const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
//           return !hasStatus && !isMissed;
//         });

//         const missedStart = startTasks.filter(t =>
//           (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false
//         );

//         let reason = `Cannot update End shift. `;
//         if (pendingStart.length > 0) {
//           reason += `${pendingStart.length} Start shift task(s) pending completion. `;
//         }
//         if (missedStart.length > 0) {
//           reason += `${missedStart.length} Start shift task(s) missed (time window passed).`;
//         }
//         blockReason = reason.trim();

//       } else if (midTasks.length > 0 && !allMidHandled) {
//         isBlocked = true;

//         const pendingMid = midTasks.filter(t => {
//           const hasStatus = t.employeeStatus && t.employeeStatus !== "";
//           const isMissed = (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false;
//           return !hasStatus && !isMissed;
//         });

//         const missedMid = midTasks.filter(t =>
//           (!t.employeeStatus || t.employeeStatus === "") && t.canUpdate === false
//         );

//         let reason = `Cannot update End shift. `;
//         if (pendingMid.length > 0) {
//           reason += `${pendingMid.length} Mid shift task(s) pending completion. `;
//         }
//         if (missedMid.length > 0) {
//           reason += `${missedMid.length} Mid shift task(s) missed (time window passed).`;
//         }
//         blockReason = reason.trim();
//       }
//     }

//     if (isBlocked) {
//       toast.error(blockReason);
//       return;
//     }


//     try {
//       let updatedStatus;

//       if (isCoreTeam) {
//         updatedStatus = await dispatch(
//           updateTaskStatusCoreTeam({ id: taskId, status })
//         ).unwrap();
//         dispatch({
//           type: "tasks/updateTaskStatusCoreTeam/fulfilled",
//           payload: updatedStatus,
//         });
//       } else {
//         const payload = { id: taskId, status };
//         if (task.actingForUserId && task.actingForUserId !== currentUserId) {
//           payload.actingForUserId = task.actingForUserId;
//         }

//         updatedStatus = await dispatch(
//           updateTaskStatus(payload)
//         ).unwrap();
//         dispatch({
//           type: "tasks/updateTaskStatus/fulfilled",
//           payload: updatedStatus,
//         });
//       }

//       toast.success("Task status updated successfully!");
//     } catch (err) {
//       const errorMessage = err?.message || err || "Failed to update status, please try again.";
//       toast.error(errorMessage);
//     }
//   };

//   const openChat = (task) => {
//     setSelectedTask(task);
//     setIsChatOpen(true);
//   };

//   const closeChat = () => {
//     setIsChatOpen(false);
//     setSelectedTask(null);
//     setNewMessage("");
//     setEditingRemarkId(null);
//     setEditingMessage("");
//   };

//   const handleSendRemark = async () => {
//     if (!newMessage.trim()) return;
//     try {
//       await dispatch(
//         addRemark({ taskId: selectedTask._id, message: newMessage })
//       ).unwrap();

//       setNewMessage("");
//       toast.success("Remark sent!");

//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//       }, 50);
//     } catch (err) {
//       toast.error(err || "Failed to send remark");
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSendRemark();
//     }
//   };

//   const formatHour = (hour) => {
//     if (hour === undefined || hour === null) return "-";
//     const h = Number(hour);
//     const suffix = h >= 12 ? "PM" : "AM";
//     const hour12 = h % 12 === 0 ? 12 : h % 12;
//     return `${hour12} ${suffix}`;
//   };

//   const openBreak = punchSession?.breaks?.find((b) => !b.endAt) || null;
//   const liveBreakMs = openBreak?.startAt ? Math.max(0, breakNowMs - new Date(openBreak.startAt).getTime()) : 0;
//   const weeklyAnniversaries = Array.isArray(employeeDashboardSummary?.workAnniversaries?.weekly)
//     ? employeeDashboardSummary.workAnniversaries.weekly
//     : [];
//   const toIstDateKey = (value) => {
//     const d = value ? new Date(value) : new Date();
//     if (Number.isNaN(d.getTime())) return "";
//     const parts = new Intl.DateTimeFormat("en-CA", {
//       timeZone: "Asia/Kolkata",
//       year: "numeric",
//       month: "2-digit",
//       day: "2-digit",
//     }).formatToParts(d);
//     const year = parts.find((p) => p.type === "year")?.value;
//     const month = parts.find((p) => p.type === "month")?.value;
//     const day = parts.find((p) => p.type === "day")?.value;
//     return year && month && day ? `${year}-${month}-${day}` : "";
//   };
//   const getEffectiveIstDate = () => {
//     const now = new Date();
//     const istHourRaw = new Intl.DateTimeFormat("en-US", {
//       timeZone: "Asia/Kolkata",
//       hour: "2-digit",
//       hour12: false,
//     }).format(now);
//     const istHour = Number.parseInt(istHourRaw, 10);
//     if (Number.isNaN(istHour)) return now;
//     if (istHour < 11) {
//       const prev = new Date(now);
//       prev.setUTCDate(prev.getUTCDate() - 1);
//       return prev;
//     }
//     return now;
//   };
//   const effectiveIstDate = getEffectiveIstDate();
//   const todayIstKey = toIstDateKey(effectiveIstDate);
//   const todayAnniversaries = weeklyAnniversaries.filter(
//     (item) => toIstDateKey(item?.anniversaryDate) === todayIstKey
//   );

//   const formatAnniversaryDate = (value) => {
//     if (!value) return "--";
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return "--";
//     return d.toLocaleDateString("en-IN", {
//       timeZone: "Asia/Kolkata",
//       weekday: "short",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   };
//   const liveBreakTimer = (() => {
//     const totalSec = Math.floor(liveBreakMs / 1000);
//     const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
//     const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
//     const ss = String(totalSec % 60).padStart(2, "0");
//     return `${hh}:${mm}:${ss}`;
//   })();

//   return (
//     <>
//       <Toaster position="top-right" reverseOrder={false} />
//       <Navbar />
//       {(isAgentUser || isSupervisorUser) && openBreak && (
//         <div className="fixed inset-x-0 top-3 z-[9999] flex justify-center px-3">
//           <div className="w-full max-w-3xl rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-4 py-3 shadow-2xl">
//             <div className="flex flex-wrap items-center justify-between gap-3">
//               <div>
//                 <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Break Alert</p>
//                 <p className="text-2xl font-extrabold text-rose-700">ON BREAK</p>
//                 <p className="text-sm font-semibold text-slate-700">
//                   Live Break Time: <span className="font-mono text-base">{liveBreakTimer}</span>
//                 </p>
//               </div>
//               <button
//                 onClick={handleEndBreak}
//                 className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-rose-700"
//               >
//                 End Break
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//       <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen relative">
//         {announcementsLoading ? (
//           <section className="mb-8 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm md:p-5">
//             <div className="flex items-center gap-2 text-sky-700">
//               <MessageCircle className="h-4 w-4" />
//               <h2 className="text-sm font-semibold md:text-base">Announcements</h2>
//             </div>
//             <p className="mt-3 text-sm text-slate-500">Loading announcements...</p>
//           </section>
//         ) : announcementsError ? (
//           <section className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm md:p-5">
//             {announcementsError}
//           </section>
//         ) : announcements.length > 0 ? (
//           <section className="mb-8 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm md:p-5">
//             <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
//               <div className="flex items-center gap-2 text-sky-700">
//                 <MessageCircle className="h-4 w-4" />
//                 <h2 className="text-sm font-semibold md:text-base">Announcements</h2>
//               </div>
//               <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
//                 Active only
//               </span>
//             </div>
//             <div className="grid grid-cols-1 gap-4">
//               {announcements.map((announcement) => (
//                 <article
//                   key={announcement._id}
//                   className="group relative w-full overflow-hidden rounded-[28px] border border-sky-100/80 bg-gradient-to-br from-white via-sky-50/40 to-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_28px_70px_-34px_rgba(15,23,42,0.34)]"
//                 >
//                   <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500" />
//                   <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-100/40 blur-2xl" />
//                   <div className="relative flex items-center justify-between gap-3">
//                     <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
//                       <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]" />
//                       Announcement
//                     </div>
//                     <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">
//                       Active
//                     </span>
//                   </div>

//                   <div className="relative mt-4">
//                     <div className="overflow-hidden">
//                       <div className="announcement-marquee flex w-max min-w-full items-center gap-14 whitespace-nowrap">
//                         <div className="shrink-0">
//                           <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
//                             {announcement.title}
//                           </h3>
//                         </div>
//                         <div className="shrink-0">
//                           <p className="mt-2 text-base leading-7 text-sky-500">
//                             {announcement.description}
//                           </p>
//                         </div>
//                         <div className="shrink-0" aria-hidden="true">
//                           <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
//                             {announcement.title}
//                           </h3>
//                         </div>
//                         <div className="shrink-0" aria-hidden="true">
//                           <p className="mt-2 text-base leading-7 text-sky-500">
//                             {announcement.description}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </article>
//               ))}
//             </div>
//           </section>
//         ) : null}

//         <style>{`
//           @keyframes announcement-marquee {
//             0% { transform: translateX(0); }
//             100% { transform: translateX(-50%); }
//           }
//           .announcement-marquee {
//             animation: announcement-marquee 22s linear infinite;
//           }
//         `}</style>

// 	        <section className="mb-8 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm md:p-4">
// 	          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
// 	            <h2 className="text-sm font-semibold text-violet-700 md:text-base">Work Anniversary Celebration!</h2>
// 	            <p className="text-xs text-slate-500">
// 	              {formatAnniversaryDate(effectiveIstDate)}
// 	            </p>
// 	          </div>
	
// 	          {todayAnniversaries.length === 0 ? (
// 	            <div className="rounded-2xl border border-dashed border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-10 text-center text-sm font-medium text-violet-700">
// 	              No work anniversary today.
// 	            </div>
// 	          ) : (
// 	            <div className="space-y-4">
// 	              {todayAnniversaries.map((item) => (
// 	                <div
// 	                  key={`${item.userId}-${item.anniversaryDate}`}
// 	                  className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-[#efe9ff] via-[#f4efff] to-[#ecebff] p-4 md:p-6"
//                 >
//                   <div className="pointer-events-none absolute -left-3 top-10 h-20 w-14 rounded-full bg-violet-300/40" />
//                   <div className="pointer-events-none absolute left-8 top-16 h-14 w-10 rounded-full bg-amber-300/50" />

//                   <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
//                     <div>
//                       <p className="text-3xl font-bold italic text-violet-700">Congratulations!</p>
//                       <p className="text-3xl font-bold text-slate-800">Work Anniversary</p>
//                       <p className="mt-2 text-sm text-slate-600">
//                         Let&apos;s celebrate the dedication and contribution of our teammate.
//                       </p>

//                       <div className="mt-4 grid max-w-md grid-cols-2 overflow-hidden rounded-xl border border-violet-200 bg-white/80">
//                         <div className="p-3">
//                           <p className="text-lg font-bold text-violet-700">{item.name}</p>
//                           <p className="text-xs text-slate-500">{item.designation || "Employee"}</p>
//                         </div>
//                         <div className="border-l border-violet-200 p-3 text-center">
//                           <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
//                           <p className="text-3xl font-black text-indigo-700">{item.yearsCompleted}</p>
//                           <p className="text-xs font-semibold text-slate-600">Year{item.yearsCompleted > 1 ? "s" : ""} Anniversary</p>
//                         </div>
//                       </div>

//                       <p className="mt-3 text-xs font-medium text-violet-700">
//                         Anniversary Date: {formatAnniversaryDate(item.anniversaryDate)}
//                       </p>
//                     </div>

//                     <div className="flex items-center justify-center">
//                       <div className="relative">
//                         <div className="h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-lg">
//                           {item.profilePhotoUrl ? (
//                             <img
//                               src={item.profilePhotoUrl}
//                               alt={item.name}
//                               className="h-full w-full object-cover"
//                             />
//                           ) : (
//                             <div className="flex h-full w-full items-center justify-center bg-violet-100 text-5xl font-bold text-violet-500">
//                               {String(item.name || "E").trim().charAt(0).toUpperCase()}
//                             </div>
//                           )}
//                         </div>
//                         <div className="absolute -bottom-3 left-1/2 w-36 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-2 text-center text-lg font-extrabold text-white shadow-md">
//                           {item.yearsCompleted} YEAR{item.yearsCompleted > 1 ? "S" : ""}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </section>

//         {(isAgentUser || isSupervisorUser) && (
//           <>
//             <AgentDashboard
//               session={punchSession}
//               attendanceScore={attendanceScore}
//               employeeDashboardSummary={employeeDashboardSummary}
//               onStartShift={handleStartShift}
//               onEndShift={handleEndShift}
//               onStartBreak={handleStartBreak}
//               onEndBreak={handleEndBreak}
//             />
//           </>
//         )}

//         {isSupervisorUser && !isCoreTeam && (
//           <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EAEAEA] mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="flex flex-col w-full">
//               <label className="text-gray-700 font-semibold mb-2">Date</label>
//               <input
//                 type="date"
//                 name="date"
//                 value={filters.date}
//                 onChange={handleFilterChange}
//                 className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all"
//               />
//             </div>
//             <div className="flex flex-col w-full">
//               <label className="text-gray-700 font-semibold mb-2">Shift</label>
//               <select
//                 name="shift"
//                 value={filters.shift}
//                 onChange={handleFilterChange}
//                 className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all"
//               >
//                 <option value="">All Shifts</option>
//                 {shiftOptions.map((s) => (
//                   <option key={s} value={s}>
//                     {s}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="flex flex-col w-full">
//               <label className="text-gray-700 font-semibold mb-2">Department</label>
//               <select
//                 name="department"
//                 value={filters.department}
//                 onChange={handleFilterChange}
//                 className="w-full p-3 rounded-xl border border-[#EAEAEA] bg-white text-gray-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-100 outline-none transition-all"
//               >
//                 {departmentOptions.map((d) => (
//                   <option key={d} value={d}>
//                     {d}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         )}

//         {isSupervisorUser && loading && (
//           <div className="flex justify-center items-center py-8">
//             <div className="flex space-x-2">
//               <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
//               <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
//               <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce" />
//             </div>
//           </div>
//         )}

//         {isSupervisorUser && error && (
//           <p className="text-red-500">
//             {typeof error === "string" ? error : error.message || "Something went wrong"}
//           </p>
//         )}

//         {isSupervisorUser && delegatedFromUserId && (
//           <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-800">
//             Showing only delegated tasks for selected team leader.
//           </div>
//         )}

//         {isSupervisorUser && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {visibleTasks.length === 0 && !loading ? (
//             <div className="col-span-full text-center py-12">
//               <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
//                 <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks found</h3>
//               <p className="text-gray-500">Try adjusting your filters to see more results</p>
//             </div>
//           ) : (
//             visibleTasks.map((task) => (
//               <div key={task._id} className="relative">
//                 <TaskCard
//                   task={task}
//                   onStatusChange={handleStatusChange}
//                   allTasks={visibleTasks}
//                 />
//                 <button
//                   onClick={() => openChat(task)}
//                   className="absolute top-3 right-3 bg-white hover:bg-gray-50 border border-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
//                   title="Open chat"
//                 >
//                   <MessageCircle className="w-5 h-5" />
//                 </button>
//               </div>
//             ))
//           )}
//         </div>}

//         {isSupervisorUser && isChatOpen && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
//             <div className="bg-white w-full max-w-[480px] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
//               <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
//                 <div className="flex-1 min-w-0">
//                   <h3 className="font-semibold text-gray-800 text-lg truncate">{selectedTask?.title}</h3>
//                   <p className="text-sm text-gray-500 mt-1">
//                     {Array.isArray(selectedTask?.assignedTo)
//                       ? `${selectedTask?.assignedTo.length} assignee(s)`
//                       : selectedTask?.assignedTo?.username || 'Unassigned'}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <button
//                     onClick={closeChat}
//                     className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700 cursor-pointer"
//                   >
//                     <FiX size={22} />
//                   </button>
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-4">
//                 {selectedTask?.initialRemark && (
//                   <div className="flex justify-start w-full">
//                     <div className="relative max-w-[80%] mr-8">
//                       <div className="px-4 py-3 rounded-2xl break-words shadow-sm bg-white text-gray-800 border border-gray-100 rounded-bl-none">
//                         <p className="text-sm">{selectedTask.initialRemark}</p>
//                         <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
//                           <span className="text-xs font-medium text-gray-600">
//                             System
//                           </span>
//                           <span className="text-xs text-gray-500">
//                             {new Date(selectedTask.createdAt).toLocaleTimeString([], {
//                               hour: "2-digit",
//                               minute: "2-digit",
//                             })}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {remarks.length > 0 ? (
//                   remarks.map((msg) => {
//                     const isMine = String(msg.senderId?._id) === String(user.id);
//                     const isEditing = editingRemarkId === msg._id;

//                     return (
//                       <div
//                         key={msg._id}
//                         className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
//                       >
//                         <div
//                           className={`relative max-w-[80%] ${isMine ? "ml-8" : "mr-8"}`}
//                         >
//                           <div
//                             className={`px-4 py-3 rounded-2xl break-words shadow-sm relative transition-all duration-200 hover:shadow-md ${isMine
//                                 ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
//                                 : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
//                               }`}
//                           >
//                             {isEditing ? (
//                               <div className="space-y-3">
//                                 <input
//                                   type="text"
//                                   value={editingMessage}
//                                   onChange={(e) => setEditingMessage(e.target.value)}
//                                   className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all duration-200 ${isMine
//                                       ? "bg-blue-700/20 text-white placeholder-blue-300 border-blue-400/30 focus:ring-blue-300/30"
//                                       : "bg-white text-gray-800 border-gray-300 focus:ring-blue-100"
//                                     }`}
//                                   placeholder="Edit remark..."
//                                   autoFocus
//                                   onKeyPress={(e) => {
//                                     if (e.key === 'Enter') {
//                                       e.preventDefault();
//                                       dispatch(
//                                         updateRemark({ remarkId: msg._id, message: editingMessage })
//                                       ).unwrap().then(() => {
//                                         setEditingRemarkId(null);
//                                         toast.success("Remark updated");
//                                       }).catch((err) => {
//                                         toast.error(err?.message || "Failed to update remark");
//                                       });
//                                     }
//                                   }}
//                                 />

//                                 <div className="flex gap-2">
//                                   <button
//                                     onClick={async () => {
//                                       try {
//                                         await dispatch(
//                                           updateRemark({ remarkId: msg._id, message: editingMessage })
//                                         ).unwrap();
//                                         setEditingRemarkId(null);
//                                         toast.success("Remark updated");
//                                       } catch (err) {
//                                         toast.error(err?.message || "Failed to update remark");
//                                       }
//                                     }}
//                                     className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
//                                   >
//                                     <FiCheck size={16} />
//                                     Save
//                                   </button>

//                                   <button
//                                     onClick={() => setEditingRemarkId(null)}
//                                     className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
//                                   >
//                                     <FiXCircle size={16} />
//                                     Cancel
//                                   </button>
//                                 </div>
//                               </div>
//                             ) : (
//                               <>
//                                 <div className="relative">
//                                   <p className="text-sm pr-8">{msg.message}</p>

//                                   {isMine && (
//                                     <div className="absolute -top-2 -right-2">
//                                       <button
//                                         onClick={() => {
//                                           setEditingRemarkId(msg._id);
//                                           setEditingMessage(msg.message);
//                                         }}
//                                         className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white hover:bg-gray-50 border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 shadow-lg hover:shadow-xl transform hover:scale-110 cursor-pointer"
//                                         title="Edit message"
//                                       >
//                                         <FiEdit2 size={14} />
//                                       </button>
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="flex justify-between items-center mt-3 pt-2 border-t border-opacity-20">
//                                   <span className={`text-xs font-medium ${isMine ? "text-white/90" : "text-gray-600"}`}>
//                                     {msg.senderId?.username}
//                                   </span>
//                                   <span className={`text-xs ${isMine ? "text-white/80" : "text-gray-500"}`}>
//                                     {new Date(msg.createdAt).toLocaleDateString('en-US', {
//                                       month: 'short',
//                                       day: 'numeric'
//                                     })} • {new Date(msg.createdAt).toLocaleTimeString([], {
//                                       hour: "2-digit",
//                                       minute: "2-digit",
//                                     })}
//                                   </span>
//                                 </div>
//                               </>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })
//                 ) : !selectedTask?.initialRemark && (
//                   <div className="h-full flex items-center justify-center">
//                     <div className="text-center py-12">
//                       <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
//                         <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
//                         </svg>
//                       </div>
//                       <h4 className="text-lg font-medium text-gray-700 mb-1">No messages yet</h4>
//                       <p className="text-gray-500 text-sm">Start the conversation by sending a remark</p>
//                     </div>
//                   </div>
//                 )}
//                 <div ref={messagesEndRef}></div>
//               </div>

//               <div className="p-4 border-t border-gray-100 bg-white">
//                 <div className="flex items-center gap-3">
//                   <div className="flex-1 relative">
//                     <input
//                       type="text"
//                       value={newMessage}
//                       onChange={(e) => setNewMessage(e.target.value)}
//                       onKeyPress={handleKeyPress}
//                       placeholder="Type your remark here..."
//                       className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200 pr-12"
//                     />
//                     {newMessage && (
//                       <button
//                         onClick={() => setNewMessage("")}
//                         className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
//                       >
//                         <FiXCircle size={18} />
//                       </button>
//                     )}
//                   </div>
//                   <button
//                     onClick={handleSendRemark}
//                     disabled={!newMessage.trim()}
//                     className={`p-3 rounded-full shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer ${newMessage.trim()
//                         ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
//                         : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                       }`}
//                   >
//                     <FiSend size={18} />
//                   </button>
//                 </div>
//                 <p className="text-xs text-gray-400 text-center mt-2">
//                   Press Enter to send • Shift + Enter for new line
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </>
//   );
// };

// export default EmployeeDashboard;




import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
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
import { getRoleType } from "../utils/roleAccess.js";
import AgentDashboard from "../components/punchx/AgentDashboard";
import { getApiBaseUrl } from "../utils/apiUrl";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
  const { remarks, loading: remarksLoading } = useSelector((state) => state.remarks);
  const { employeeDashboardSummary } = useSelector((state) => state.auth);
  const user = JSON.parse(localStorage.getItem("user"));
  const API_URL = getApiBaseUrl();
  const currentUserId = user?._id || user?.id;
  const roleType = getRoleType(user || {});
  const isSupervisorUser = roleType === "supervisor";
  const isAgentUser = roleType === "agent";
  const isCoreTeam = user?.isCoreTeam;
  const employeeDepartment = user?.department || "";
  const [punchSession, setPunchSession] = useState(null);
  const [attendanceScore, setAttendanceScore] = useState(null);
  const [breakNowMs, setBreakNowMs] = useState(Date.now());
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");

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
  const activityInFlightRef = useRef(false);
  const lastActivitySentAtRef = useRef(0);
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

  const authHeaders = () => {
    const token = user?.token;
    if (!token) throw new Error("Missing auth token for PunchX request");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const syncPunchSession = async () => {
    try {
      const res = await axios.get(`${API_URL}/punchx/session/today`, authHeaders());
      setPunchSession(res.data?.session || null);
      setAttendanceScore(res.data?.attendanceScore || null);
    } catch (err) {
      console.error("PunchX session sync failed:", err?.response?.data || err.message);
    }
  };


  const callPunchAction = async (path, body = {}) => {
    const res = await axios.post(`${API_URL}/punchx${path}`, body, authHeaders());
    setPunchSession(res.data?.session || null);
    setAttendanceScore(res.data?.attendanceScore || null);
    return res;
  };

  const handleStartShift = async () => {
    await callPunchAction("/shift/start");
  };

  const handleEndShift = async () => {
    await callPunchAction("/shift/end");
  };

  const handleStartBreak = async (type = "manual") => {
    await callPunchAction("/break/start", { type });
  };

  const handleEndBreak = async () => {
    await callPunchAction("/break/end");
  };

  useEffect(() => {
    if (!user?.token) return;
    syncPunchSession();
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;

    const loadAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);
        setAnnouncementsError("");
        const res = await axios.get(`${API_URL}/announcements`, authHeaders());
        setAnnouncements(Array.isArray(res.data?.announcements) ? res.data.announcements : []);
      } catch (err) {
        setAnnouncementsError(err?.response?.data?.message || "Failed to load announcements");
      } finally {
        setAnnouncementsLoading(false);
      }
    };

    loadAnnouncements();
  }, [API_URL, user?.token]);

  useEffect(() => {
    const id = setInterval(() => setBreakNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user?.token) return;


    const sendActivity = async (eventType) => {
      const nowMs = Date.now();
      const throttleMs = eventType === "heartbeat" ? 2 * 60 * 1000 : 30 * 1000;
      if (nowMs - lastActivitySentAtRef.current < throttleMs) return;
      if (activityInFlightRef.current) return;

      activityInFlightRef.current = true;
      try {
        await callPunchAction("/activity", { eventType, occurredAt: new Date().toISOString() });
        lastActivitySentAtRef.current = Date.now();
      } catch (err) {
        console.error("PunchX activity failed:", err?.response?.data || err.message);
      } finally {
        activityInFlightRef.current = false;
      }
    };

    const markActivity = () => {
      sendActivity("activity");
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };

    const interval = setInterval(() => {
      sendActivity("heartbeat");
    }, 2 * 60 * 1000);

    window.addEventListener("mousemove", markActivity);
    window.addEventListener("keydown", markActivity);
    window.addEventListener("click", markActivity);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("click", markActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.token]);


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

  const formatHour = (hour) => {
    if (hour === undefined || hour === null) return "-";
    const h = Number(hour);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12} ${suffix}`;
  };

  const openBreak = punchSession?.breaks?.find((b) => !b.endAt) || null;
  const liveBreakMs = openBreak?.startAt ? Math.max(0, breakNowMs - new Date(openBreak.startAt).getTime()) : 0;
  const weeklyAnniversaries = Array.isArray(employeeDashboardSummary?.workAnniversaries?.weekly)
    ? employeeDashboardSummary.workAnniversaries.weekly
    : [];
  const toIstDateKey = (value) => {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    return year && month && day ? `${year}-${month}-${day}` : "";
  };
  const getEffectiveIstDate = () => {
    const now = new Date();
    const istHourRaw = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(now);
    const istHour = Number.parseInt(istHourRaw, 10);
    if (Number.isNaN(istHour)) return now;
    if (istHour < 11) {
      const prev = new Date(now);
      prev.setUTCDate(prev.getUTCDate() - 1);
      return prev;
    }
    return now;
  };
  const effectiveIstDate = getEffectiveIstDate();
  const todayIstKey = toIstDateKey(effectiveIstDate);
  const todayAnniversaries = weeklyAnniversaries.filter(
    (item) => toIstDateKey(item?.anniversaryDate) === todayIstKey
  );

  const formatAnniversaryDate = (value) => {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--";
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const liveBreakTimer = (() => {
    const totalSec = Math.floor(liveBreakMs / 1000);
    const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  })();

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Navbar />
      {(isAgentUser || isSupervisorUser) && openBreak && (
        <div className="fixed inset-x-0 top-3 z-[9999] flex justify-center px-3">
          <div className="w-full max-w-3xl rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 px-4 py-3 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Break Alert</p>
                <p className="text-2xl font-extrabold text-rose-700">ON BREAK</p>
                <p className="text-sm font-semibold text-slate-700">
                  Live Break Time: <span className="font-mono text-base">{liveBreakTimer}</span>
                </p>
              </div>
              <button
                onClick={handleEndBreak}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-rose-700"
              >
                End Break
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="p-8 bg-gradient-to-b from-sky-50 to-white min-h-screen relative">
        {announcementsLoading ? (
          <section className="mb-8 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center gap-2 text-sky-700">
              <MessageCircle className="h-4 w-4" />
              <h2 className="text-sm font-semibold md:text-base">Announcements</h2>
            </div>
            <p className="mt-3 text-sm text-slate-500">Loading announcements...</p>
          </section>
        ) : announcementsError ? (
          <section className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm md:p-5">
            {announcementsError}
          </section>
        ) : announcements.length > 0 ? (
          <section className="mb-8 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2 text-sky-700">
                <MessageCircle className="h-4 w-4" />
                <h2 className="text-sm font-semibold md:text-base">Announcements</h2>
              </div>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                Active only
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {announcements.map((announcement) => (
                <article
                  key={announcement._id}
                  className="group relative w-full overflow-hidden rounded-[28px] border border-sky-100/80 bg-gradient-to-br from-white via-sky-50/40 to-white p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.28)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_28px_70px_-34px_rgba(15,23,42,0.34)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500" />
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-100/40 blur-2xl" />
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                      <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)]" />
                      Announcement
                    </div>
                    <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">
                      Active
                    </span>
                  </div>

                  <div className="relative mt-4">
                    <div className="overflow-hidden">
                      <div className="announcement-marquee flex w-max min-w-full items-center gap-14 whitespace-nowrap">
                        <div className="shrink-0">
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="shrink-0">
                          <p className="mt-2 text-base leading-7 text-sky-500">
                            {announcement.description}
                          </p>
                        </div>
                        <div className="shrink-0" aria-hidden="true">
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="shrink-0" aria-hidden="true">
                          <p className="mt-2 text-base leading-7 text-sky-500">
                            {announcement.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <style>{`
          @keyframes announcement-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .announcement-marquee {
            animation: announcement-marquee 22s linear infinite;
          }
        `}</style>

	        <section className="mb-8 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm md:p-4">
	          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
	            <h2 className="text-sm font-semibold text-violet-700 md:text-base">Work Anniversary Celebration!</h2>
	            <p className="text-xs text-slate-500">
	              {formatAnniversaryDate(effectiveIstDate)}
	            </p>
	          </div>
	
	          {todayAnniversaries.length === 0 ? (
	            <div className="rounded-2xl border border-dashed border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-10 text-center text-sm font-medium text-violet-700">
	              No work anniversary today.
	            </div>
	          ) : (
	            <div className="space-y-4">
	              {todayAnniversaries.map((item) => (
	                <div
	                  key={`${item.userId}-${item.anniversaryDate}`}
	                  className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-[#efe9ff] via-[#f4efff] to-[#ecebff] p-4 md:p-6"
                >
                  <div className="pointer-events-none absolute -left-3 top-10 h-20 w-14 rounded-full bg-violet-300/40" />
                  <div className="pointer-events-none absolute left-8 top-16 h-14 w-10 rounded-full bg-amber-300/50" />

                  <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-3xl font-bold italic text-violet-700">Congratulations!</p>
                      <p className="text-3xl font-bold text-slate-800">Work Anniversary</p>
                      <p className="mt-2 text-sm text-slate-600">
                        Let&apos;s celebrate the dedication and contribution of our teammate.
                      </p>

                      <div className="mt-4 grid max-w-md grid-cols-2 overflow-hidden rounded-xl border border-violet-200 bg-white/80">
                        <div className="p-3">
                          <p className="text-lg font-bold text-violet-700">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.designation || "Employee"}</p>
                        </div>
                        <div className="border-l border-violet-200 p-3 text-center">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
                          <p className="text-3xl font-black text-indigo-700">{item.yearsCompleted}</p>
                          <p className="text-xs font-semibold text-slate-600">Year{item.yearsCompleted > 1 ? "s" : ""} Anniversary</p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs font-medium text-violet-700">
                        Anniversary Date: {formatAnniversaryDate(item.anniversaryDate)}
                      </p>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <div className="h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-lg">
                          {item.profilePhotoUrl ? (
                            <img
                              src={item.profilePhotoUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-violet-100 text-5xl font-bold text-violet-500">
                              {String(item.name || "E").trim().charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 w-36 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-2 text-center text-lg font-extrabold text-white shadow-md">
                          {item.yearsCompleted} YEAR{item.yearsCompleted > 1 ? "S" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {(isAgentUser || isSupervisorUser) && (
          <>
            <AgentDashboard
              session={punchSession}
              token={user?.token}
              attendanceScore={attendanceScore}
              employeeDashboardSummary={employeeDashboardSummary}
              onStartShift={handleStartShift}
              onEndShift={handleEndShift}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
            />
          </>
        )}

        {isSupervisorUser && !isCoreTeam && (
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

        {isSupervisorUser && loading && (
          <div className="flex justify-center items-center py-8">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {isSupervisorUser && error && (
          <p className="text-red-500">
            {typeof error === "string" ? error : error.message || "Something went wrong"}
          </p>
        )}

        {isSupervisorUser && delegatedFromUserId && (
          <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-cyan-800">
            Showing only delegated tasks for selected team leader.
          </div>
        )}

        {isSupervisorUser && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>}

        {isSupervisorUser && isChatOpen && (
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
