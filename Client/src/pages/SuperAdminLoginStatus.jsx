
// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import { getRoleType } from "../utils/roleAccess.js";
// import { getDailyStatus } from "../utils/dailyStatusApi.js";

// // const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
// const API_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";

// const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50];
// const IST_TIME_ZONE = "Asia/Kolkata";

// const toDateKey = (date) => {
//   const d = new Date(date);
//   const parts = new Intl.DateTimeFormat("en-CA", {
//     timeZone: IST_TIME_ZONE,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(d);
//   const yyyy = parts.find((p) => p.type === "year")?.value;
//   const mm = parts.find((p) => p.type === "month")?.value;
//   const dd = parts.find((p) => p.type === "day")?.value;
//   return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "";
// };

// const getDefaultDateKey = () => toDateKey(new Date());

// const formatDateTime = (value) => {
//   if (!value) return null;
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return null;
  
//   const dateStr = d.toLocaleDateString("en-GB", {
//     timeZone: IST_TIME_ZONE,
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric"
//   });
  
//   const timeStr = d.toLocaleTimeString("en-US", {
//     timeZone: IST_TIME_ZONE,
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: true
//   }).toLowerCase();

//   return { dateStr, timeStr };
// };

// const formatTime = (value) => {
//   if (!value) return "--";
//   const d = new Date(value);
//   if (Number.isNaN(d.getTime())) return "--";
//   return d.toLocaleTimeString("en-IN", {
//     timeZone: IST_TIME_ZONE,
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// const formatDuration = (ms = 0) => {
//   const safe = Math.max(0, Number(ms) || 0);
//   const totalMinutes = Math.floor(safe / 60000);
//   const h = Math.floor(totalMinutes / 60);
//   const m = totalMinutes % 60;
//   return `${h}h ${m}m`;
// };

// const getTransportLoginDifference = (transportArrivalTime, loginTime) => {
//   if (!transportArrivalTime || !loginTime) return null;
//   const arrival = new Date(transportArrivalTime);
//   const login = new Date(loginTime);
//   if (Number.isNaN(arrival.getTime()) || Number.isNaN(login.getTime())) return null;

//   const diffMs = login.getTime() - arrival.getTime();
//   const absDiffMs = Math.abs(diffMs);

//   if (diffMs === 0) {
//     return { label: "Same time", toneClass: "bg-emerald-50 text-emerald-700 border-emerald-100" };
//   }

//   // 10 minutes = 10 * 60 * 1000 = 600,000 milliseconds
//   const isWithinTenMinutes = absDiffMs <= 600000;

//   return {
//     label: formatDuration(absDiffMs),
//     toneClass: isWithinTenMinutes
//       ? "bg-emerald-50 text-emerald-700 border-emerald-100"
//       : "bg-rose-50 text-rose-700 border-rose-100",
//   };
// };

// const getLogoutTypeLabel = (reason = "") => {
//   const value = String(reason || "").trim();
//   if (value === "manual") return "Manual Logout";
//   if (value === "auto_9h" || value === "auto_window") return "Auto Logout";
//   return "";
// };

// const getRowPriorityScore = (row) => {
//   const status = String(row?.activityStatus || "").toLowerCase();
//   const liveStatuses = new Set(["active", "manual_break", "auto_break", "idle_warning"]);
//   const hasLogin = Boolean(row?.loginTime);
//   const hasLogout = Boolean(row?.logoutTime);
//   const isLive = liveStatuses.has(status) || row?.isOnBreak === true || (hasLogin && !hasLogout);
//   const incompleteNineHours = row?.hasCompletedNineHours === false;
//   const loginTs = hasLogin ? new Date(row.loginTime).getTime() : 0;
//   const logoutTs = hasLogout ? new Date(row.logoutTime).getTime() : 0;
//   const recencyTs = Math.max(loginTs || 0, logoutTs || 0);

//   let score = 0;
//   if (isLive) score += 1000;
//   if (incompleteNineHours) score += 200;
//   if (hasLogin && !hasLogout) score += 100;
//   score += Math.floor(recencyTs / 1000);
//   return score;
// };

// const normalizeShiftStartHour = (shiftStartHour, shiftEndHour) => {
//   const startHour = Number(shiftStartHour);
//   const endHour = Number(shiftEndHour);
//   if (!Number.isFinite(startHour)) return null;

//   const normalizedStart = ((startHour % 24) + 24) % 24;
//   const normalizedEnd = Number.isFinite(endHour) ? ((endHour % 24) + 24) % 24 : null;

//   if (normalizedStart > 0 && normalizedStart < 12 && normalizedEnd !== null && normalizedEnd < normalizedStart) {
//     return normalizedStart + 12;
//   }
//   return normalizedStart;
// };

// const getIstHourFromDateLike = (dateLike) => {
//   const date = new Date(dateLike);
//   if (Number.isNaN(date.getTime())) return null;
//   const parts = new Intl.DateTimeFormat("en-US", {
//     timeZone: IST_TIME_ZONE,
//     hour: "2-digit",
//     hour12: false,
//   }).formatToParts(date);
//   const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
//   return Number.isFinite(hour) ? hour : null;
// };

// const getLateByFallbackMs = (loginTime, shiftStartHour, shiftEndHour) => {
//   if (!loginTime) return 0;
//   const loginHour = getIstHourFromDateLike(loginTime);
//   const shiftHourNum = normalizeShiftStartHour(shiftStartHour, shiftEndHour);
//   const inferredShiftHour =
//     Number.isFinite(shiftHourNum) && shiftHourNum < 12 && Number.isFinite(loginHour) && loginHour >= 14
//       ? shiftHourNum + 12
//       : shiftHourNum;
//   if (!Number.isFinite(inferredShiftHour)) return 0;
//   const login = new Date(loginTime);
//   if (Number.isNaN(login.getTime())) return 0;
//   const parts = new Intl.DateTimeFormat("en-US", {
//     timeZone: IST_TIME_ZONE,
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   }).formatToParts(login);
//   const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
//   const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
//   const second = Number(parts.find((p) => p.type === "second")?.value || 0);
//   const loginClockMs = hour * 60 * 60 * 1000 + minute * 60 * 1000 + second * 1000;
//   const expectedClockMs = inferredShiftHour * 60 * 60 * 1000;
//   const HALF_DAY_MS = 12 * 60 * 60 * 1000;
//   const FULL_DAY_MS = 24 * 60 * 60 * 1000;

//   let adjustedLoginClockMs = loginClockMs;
//   const directDelta = loginClockMs - expectedClockMs;

//   if (directDelta > HALF_DAY_MS) {
//     adjustedLoginClockMs -= FULL_DAY_MS;
//   } else if (directDelta < -HALF_DAY_MS) {
//     adjustedLoginClockMs += FULL_DAY_MS;
//   }

//   const lateBy = adjustedLoginClockMs - expectedClockMs;
//   return lateBy > 0 ? lateBy : 0;
// };

// const resolveLateByMs = ({ serverLateByMs, loginTime, shiftStartHour, shiftEndHour }) => {
//   const safeServer = Number(serverLateByMs || 0);
//   const fallback = getLateByFallbackMs(loginTime, shiftStartHour, shiftEndHour);
//   if (!(safeServer > 0)) return fallback;

//   const HALF_DAY_MS = 12 * 60 * 60 * 1000;
//   if (safeServer > HALF_DAY_MS) return fallback;
//   return safeServer;
// };

// const getFloorRosterStatusClass = (status) => {
//   const key = String(status || "").trim().toUpperCase();

//   if (key === "P") return "bg-[#E6F4EA] text-[#137333]"; 
//   if (key === "WO") return "bg-[#E8F0FE] text-[#1A73E8]"; 
//   if (key === "L") return "bg-rose-100 text-rose-700";
//   if (key === "NCNS") return "bg-red-100 text-red-700";
//   if (key === "UL") return "bg-orange-100 text-orange-700";
//   if (key === "LWP") return "bg-yellow-100 text-yellow-700";
//   if (key === "BL") return "bg-violet-100 text-violet-700";
//   if (key === "H") return "bg-fuchsia-100 text-fuchsia-700";
//   if (key === "HD") return "bg-amber-100 text-amber-700";
//   if (key === "LWD") return "bg-lime-100 text-lime-700";
//   return "bg-slate-100 text-slate-600";
// };

// const SuperAdminLoginStatus = () => {
//   const currentUser = useMemo(() => {
//     try {
//       return JSON.parse(localStorage.getItem("user") || "{}");
//     } catch {
//       return {};
//     }
//   }, []);
//   const isSuperAdminView = getRoleType(currentUser) === "superAdmin";
//   const [dateKey, setDateKey] = useState(getDefaultDateKey());
//   const [isDateManuallySelected, setIsDateManuallySelected] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [summary, setSummary] = useState(null);
//   const [rows, setRows] = useState([]);
//   const [query, setQuery] = useState("");
//   const [dept, setDept] = useState("All");
//   const [status, setStatus] = useState("All");
//   const [pageSize, setPageSize] = useState(20);
//   const [page, setPage] = useState(1);
//   const [exporting, setExporting] = useState(false);
//   const [nowMs, setNowMs] = useState(Date.now());
//   const [lastSyncedAtMs, setLastSyncedAtMs] = useState(Date.now());

//   const token = useMemo(() => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       return user?.token || "";
//     } catch {
//       return "";
//     }
//   }, []);

//   const loadData = async (force = false) => {
//     if (!token) return;
//     setLoading(true);
//     setError("");
//     try {
//       const endpoint = isSuperAdminView
//         ? `${API_URL}/punchx/superadmin/daily-status`
//         : `${API_URL}/punchx/manager/team-status`;
//       const resCurrent = await getDailyStatus({ endpoint, dateKey, token, force });

//       const merged = Array.isArray(resCurrent?.data?.rows) ? resCurrent.data.rows : [];

//       const normalizedRows = merged.map((r) => {
//         const loginTime = r.loginTime || r.shiftStartedAt || r.shiftStartAt || null;
//         const serverLateByMs = Number(r.lateByMs || 0);
//         const explicitManualBreakMs = Number(r.manualBreakMs);
//         const hasExplicitSplit = Number.isFinite(explicitManualBreakMs);
//         const totalBreakMs = Number(r.totalBreakMs || 0);
//         const manualBreakMs = hasExplicitSplit ? explicitManualBreakMs : totalBreakMs;
//         return {
//           ...r,
//           loginTime,
//           logoutTime: r.logoutTime || r.shiftEndedAt || r.shiftEndAt || null,
//           isOnBreak:
//             typeof r.isOnBreak === "boolean"
//               ? r.isOnBreak
//               : Boolean(r.breakType) || ["manual_break", "auto_break"].includes(r.activityStatus),
//           lateByMs: resolveLateByMs({
//             serverLateByMs,
//             loginTime,
//             shiftStartHour: r.shiftStartHour,
//             shiftEndHour: r.shiftEndHour,
//           }),
//           totalWorkedMs: Number(r.totalWorkedMs || 0),
//           totalBreakMs,
//           manualBreakMs,
//           hasCompletedNineHours:
//             typeof r.hasCompletedNineHours === "boolean"
//               ? r.hasCompletedNineHours
//               : Number(r.totalWorkedMs || 0) >= 9 * 60 * 60 * 1000,
//           remainingForNineHoursMs:
//             typeof r.remainingForNineHoursMs === "number"
//               ? r.remainingForNineHoursMs
//               : Math.max(0, 9 * 60 * 60 * 1000 - Number(r.totalWorkedMs || 0)),
//         };
//       });

//       const byUser = new Map();
//       normalizedRows.forEach((row) => {
//         const key = String(row.userId || row.employeeId || row._id || row.username || Math.random());
//         const existing = byUser.get(key);
//         if (!existing) {
//           byUser.set(key, row);
//           return;
//         }
//         const existingScore = getRowPriorityScore(existing);
//         const currentScore = getRowPriorityScore(row);
//         if (currentScore > existingScore) {
//           byUser.set(key, row);
//         }
//       });

//       const finalRows = Array.from(byUser.values());
//       const syncedAt = Date.now();
//       setLastSyncedAtMs(syncedAt);
//       setRows(finalRows);
//       const serverSummary = resCurrent?.data?.summary;
//       setSummary(
//         serverSummary || {
//           totalEmployees: finalRows.length,
//           presentCount: 0,
//           loggedInCount: finalRows.filter((r) => Boolean(r.loginTime)).length,
//           onBreakCount: finalRows.filter((r) => r.isOnBreak).length,
//           notCompletedNineHoursCount: finalRows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
//           lateLoginCount: finalRows.filter((r) => r.loginTime && r.lateByMs > 0).length,
//         }
//       );
//     } catch (err) {
//       setError(err?.response?.data?.message || "Failed to load login status");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const exportExcel = async () => {
//     if (!token || !isSuperAdminView) return;
//     try {
//       setExporting(true);
//       const res = await axios.get(`${API_URL}/punchx/superadmin/daily-status/export`, {
//         params: { dateKey },
//         headers: { Authorization: `Bearer ${token}` },
//         responseType: "blob",
//       });
//       const disposition = res.headers?.["content-disposition"] || "";
//       const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
//       const fileName = fileNameMatch?.[1] || `superadmin-login-status-${dateKey}.xlsx`;
//       const url = window.URL.createObjectURL(res.data);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       setError(err?.response?.data?.message || "Failed to export login status");
//     } finally {
//       setExporting(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//     const id = setInterval(loadData, 30000);
//     return () => clearInterval(id);
//   }, [dateKey, isSuperAdminView]);

//   useEffect(() => {
//     const id = setInterval(() => setNowMs(Date.now()), 1000);
//     return () => clearInterval(id);
//   }, []);

//   const getLiveRemainingMs = (row) => {
//     if (!row?.loginTime || row?.hasCompletedNineHours) return 0;
//     if (row?.logoutTime) return Math.max(0, Number(row.remainingForNineHoursMs || 0));

//     const baseRemaining = Math.max(0, Number(row.remainingForNineHoursMs || 0));
//     const elapsedAfterSync = Math.max(0, nowMs - lastSyncedAtMs);
//     return Math.max(0, baseRemaining - elapsedAfterSync);
//   };

//   useEffect(() => {
//     if (isDateManuallySelected) return;
//     const syncDateKey = () => setDateKey(getDefaultDateKey());
//     syncDateKey();
//     const id = setInterval(syncDateKey, 60000);
//     return () => clearInterval(id);
//   }, [isDateManuallySelected]);

//   const departments = useMemo(() => {
//     const set = new Set(rows.map((r) => r.department).filter(Boolean));
//     return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
//   }, [rows]);

//   const filteredRows = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return rows.filter((r) => {
//       if (dept !== "All" && r.department !== dept) return false;
//       if (status === "On Break" && !r.isOnBreak) return false;
//       if (status === "Logged In" && !r.loginTime) return false;
//       if (status === "Not Logged In" && r.loginTime) return false;
//       if (status === "Late" && !(r.loginTime && r.lateByMs > 0)) return false;
//       if (status === "9h Incomplete" && !(r.loginTime && !r.hasCompletedNineHours)) return false;
//       if (!q) return true;
//       const hay = `${r.pseudoName || ""} ${r.name || ""} ${r.username || ""} ${r.department || ""} ${r.accountType || ""}`.toLowerCase();
//       return hay.includes(q);
//     });
//   }, [rows, query, dept, status]);

//   const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
//   const safePage = Math.min(page, totalPages);
//   const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

//   useEffect(() => {
//     setPage(1);
//   }, [query, dept, status, pageSize, dateKey]);

//   return (
//     <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans">
//       <div className="mx-auto max-w-[1600px] space-y-6">
        
//         {/* Upper Dashboard Header Controller bar */}
//         <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//           <div className="flex flex-wrap items-center gap-3">
//             <input
//               type="text"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search employee..."
//               className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white w-64"
//             />
//             <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white">
//               {departments.map((d) => <option key={d} value={d}>{d} Department</option>)}
//             </select>
//             <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white">
//               {["All", "Logged In", "Not Logged In", "On Break", "Late", "9h Incomplete"].map((s) => <option key={s} value={s}>{s} Status</option>)}
//             </select>
//           </div>

//           <div className="flex items-center gap-3">
//             <input
//               type="date"
//               value={dateKey}
//               onChange={(e) => {
//                 setIsDateManuallySelected(true);
//                 setDateKey(e.target.value);
//               }}
//               className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium outline-none"
//             />
//             {isSuperAdminView && (
//               <button
//                 onClick={exportExcel}
//                 disabled={exporting}
//                 className="rounded-xl bg-[#1E4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
//               >
//                 {exporting ? "Exporting..." : "Export"}
//               </button>
//             )}
//             <button
//               onClick={() => loadData(true)}
//               className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
//             >
//               Refresh
//             </button>
//           </div>
//         </div>

//         {/* High Fidelity Grid Table Area Container */}
//         <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//           <div className="overflow-x-auto">
//             <table className="min-w-full table-auto border-collapse text-left">
//               <thead>
//                 <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
//                   {/* Sticky Table Header for Employee */}
//                   <th className="sticky left-0 z-10 whitespace-nowrap bg-[#F8FAFC] border-r border-slate-200/80 px-6 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
//                       Employee
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
//                       Department
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       Status
//                       <svg className="w-3.5 h-3.5 text-slate-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
//                     </span>
//                   </th>
//                   {/* Transport Arrival Header */}
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" /></svg>
//                       Transport Arrival
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h7a3 3 0 013 3v1" /></svg>
//                       Login
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
//                       Login Difference
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
//                       Logout
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
//                       Floor Roster
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
//                       Worked
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" /></svg>
//                       9H Progress
//                     </span>
//                   </th>
//                   <th className="whitespace-nowrap px-6 py-4">
//                     <span className="flex items-center gap-2">
//                       <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
//                       Break Used
//                     </span>
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 text-[13px] text-[#334155]">
//                 {paginatedRows.map((row) => {
//                   const nameDisplay = row.pseudoName || row.name || row.username || "Unknown";
//                   const initialDisplay = nameDisplay.charAt(0).toUpperCase();
//                   const loginTimes = formatDateTime(row.loginTime);
//                   const logoutTimes = formatDateTime(row.logoutTime);
//                   const arrivalLoginDifference = getTransportLoginDifference(row.transportArrivalTime, row.loginTime);
  
//                   return (
//                     <tr key={row.userId} className="group hover:bg-slate-50/80 transition-colors">
//                       {/* Sticky Employee Row Body Cell */}
//                       <td className="sticky left-0 z-10 whitespace-nowrap bg-white group-hover:bg-[#F8FAFC] border-r border-slate-200/80 px-6 py-4.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
//                         <div className="flex items-center gap-3">
//                           <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8] font-bold text-sm border border-blue-100">
//                             {initialDisplay}
//                           </div>
//                           <span className="font-semibold text-[#0F172A]">{nameDisplay}</span>
//                         </div>
//                       </td>

//                       {/* Department designation */}
//                       <td className="px-6 py-4.5 text-[#64748B] whitespace-nowrap">
//                         {row.department || "Ops - Meta"}
//                       </td>

//                       {/* Presence Status Badges */}
//                       <td className="px-6 py-4.5 whitespace-nowrap">
//                         {row.isOnBreak ? (
//                           <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
//                             <span className="h-2 w-2 rounded-full bg-amber-500"></span>
//                             On Break
//                           </div>
//                         ) : row.loginTime ? (
//                           <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EA] px-2.5 py-1 text-xs font-semibold text-[#137333] border border-emerald-200">
//                             <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
//                             On Shift
//                           </div>
//                         ) : (
//                           <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
//                             <span className="h-2 w-2 rounded-full bg-slate-400"></span>
//                             Offline
//                           </div>
//                         )}
//                       </td>

//                       {/* Transport Arrival Data Cell */}
//                       <td className="px-6 py-4.5 whitespace-nowrap text-slate-400">
//                         {row.transportArrivalTime ? (
//                           <span className="text-[#1E293B] font-medium">{formatTime(row.transportArrivalTime)}</span>
//                         ) : (
//                           <span className="text-slate-400">—</span>
//                         )}
//                       </td>

//                       {/* Login Timestamp view */}
//                       <td className="px-6 py-4.5 whitespace-nowrap font-medium text-[#1E293B]">
//                         {loginTimes ? (
//                           <div className="flex items-center gap-2">
//                             <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
//                             <div className="flex flex-col text-left">
//                               <span>{loginTimes.dateStr}</span>
//                               <span className="text-[11px] text-slate-400 font-normal">{loginTimes.timeStr}</span>
//                             </div>
//                           </div>
//                         ) : (
//                           <span className="text-slate-400">—</span>
//                         )}
//                       </td>

//                       {/* Difference between transport arrival and login */}
//                       <td className="px-6 py-4.5 whitespace-nowrap">
//                         {arrivalLoginDifference ? (
//                           <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${arrivalLoginDifference.toneClass}`}>
//                             {arrivalLoginDifference.label}
//                           </span>
//                         ) : (
//                           <span className="text-slate-400">--</span>
//                         )}
//                       </td>

//                       {/* Logout Timestamp view */}
//                       <td className="px-6 py-4.5 whitespace-nowrap font-medium text-[#1E293B]">
//                         {logoutTimes ? (
//                           <div className="flex flex-col text-left">
//                             <span>{logoutTimes.dateStr}</span>
//                             <span className="text-[11px] text-slate-400 font-normal">{logoutTimes.timeStr}</span>
//                             {row.logoutReason && (
//                               <span className="text-[10px] text-rose-500 font-normal mt-0.5">{getLogoutTypeLabel(row.logoutReason)}</span>
//                             )}
//                           </div>
//                         ) : (
//                           <span className="text-slate-400">—</span>
//                         )}
//                       </td>

//                       {/* Floor Roster Status Circle */}
//                       <td className="px-6 py-4.5 whitespace-nowrap text-center">
//                         <div className={`inline-flex h-7 w-10 items-center justify-center rounded-full font-bold text-xs shadow-sm ${getFloorRosterStatusClass(row.floorRosterStatus)}`}>
//                           {row.floorRosterStatus || "P"}
//                         </div>
//                       </td>

//                       {/* Total Hours Worked */}
//                       <td className="px-6 py-4.5 whitespace-nowrap">
//                         {row.loginTime ? (
//                           <div className="flex items-center gap-2 font-bold text-[#1E293B]">
//                             <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
//                             {formatDuration(row.totalWorkedMs || 0)}
//                           </div>
//                         ) : (
//                           <span className="text-slate-400">—</span>
//                         )}
//                       </td>

//                       {/* 9H Circular Indicator Progress */}
//                       <td className="px-6 py-4.5 whitespace-nowrap">
//                         {!row.loginTime ? (
//                           <span className="text-slate-400">—</span>
//                         ) : (
//                           <div className="flex flex-col items-center justify-center w-24">
//                             <div className="relative flex items-center justify-center h-12 w-12 rounded-full border-2 border-rose-100 border-t-rose-500 border-r-rose-400">
//                               <span className="text-[11px] font-bold text-rose-600">
//                                 {formatDuration(getLiveRemainingMs(row))}
//                               </span>
//                             </div>
//                           </div>
//                         )}
//                       </td>

//                       {/* Break Used Time Container */}
//                       <td className="px-6 py-4.5 whitespace-nowrap">
//                         {row.loginTime ? (
//                           <div className="flex items-center gap-2 font-medium text-[#475569]">
//                             <span>M: {formatDuration(row.manualBreakMs || 0)}</span>
//                             <span className="text-slate-300">|</span>
//                             <span>T: {formatDuration(row.totalBreakMs || 0)}</span>
//                           </div>
//                         ) : (
//                           <span className="text-slate-400">—</span>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//           <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#F8FAFC] px-4 py-3">
//             <div className="flex items-center gap-2 text-sm text-slate-600">
//               <span>Rows per page:</span>
//               <select
//                 value={pageSize}
//                 onChange={(e) => setPageSize(Number(e.target.value))}
//                 className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
//               >
//                 {PAGE_SIZE_OPTIONS.map((size) => (
//                   <option key={size} value={size}>
//                     {size}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="text-sm text-slate-600">
//               Showing {filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
//               {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 disabled={safePage <= 1}
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 Prev
//               </button>
//               <span className="text-sm font-medium text-slate-700">
//                 Page {safePage} / {totalPages}
//               </span>
//               <button
//                 type="button"
//                 disabled={safePage >= totalPages}
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SuperAdminLoginStatus;












import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getRoleType } from "../utils/roleAccess.js";
import { getDailyStatus } from "../utils/dailyStatusApi.js";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";
 const API_URL = import.meta.env.VITE_API_URL || "https://fdbs-server-a9gqg.ondigitalocean.app/api/v1";
 
const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 50];
const IST_TIME_ZONE = "Asia/Kolkata";

const toDateKey = (date) => {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const yyyy = parts.find((p) => p.type === "year")?.value;
  const mm = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;
  return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "";
};

const getDefaultDateKey = () => toDateKey(new Date());

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  
  const dateStr = d.toLocaleDateString("en-GB", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  const timeStr = d.toLocaleTimeString("en-US", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).toLowerCase();

  return { dateStr, timeStr };
};

const formatTime = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toLocaleTimeString("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ========== UPDATED: formatDuration without seconds for general use ==========
const formatDuration = (ms = 0) => {
  const safe = Math.max(0, Number(ms) || 0);
  const totalMinutes = Math.floor(safe / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  if (h > 0 && m > 0) {
    return `${h}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  if (m > 0) {
    return `${m}m`;
  }
  return `0m`;
};

// ========== NEW: formatDurationWithSeconds for break timer only ==========
const formatDurationWithSeconds = (ms = 0) => {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.floor(safe / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
};

// ========== NEW: Get active break duration ==========
const getActiveBreakDuration = (row) => {
  if (!row?.breakStartAt || !row?.isOnBreak) return null;
  const start = new Date(row.breakStartAt);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return diffMs > 0 ? diffMs : 0;
};

// ========== UPDATED: Break Timer Component with seconds ==========
const BreakTimer = ({ row }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  
  useEffect(() => {
    if (!row?.isOnBreak || !row?.breakStartAt) {
      setElapsedMs(0);
      return;
    }
    
    const updateTimer = () => {
      const duration = getActiveBreakDuration(row);
      setElapsedMs(duration || 0);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [row?.isOnBreak, row?.breakStartAt]);
  
  if (!row?.isOnBreak || !row?.breakStartAt) return null;
  
  return (
    <span className="text-[10px] font-medium text-amber-600 ml-1.5 animate-pulse">
      ({formatDurationWithSeconds(elapsedMs)})
    </span>
  );
};

const getTransportLoginDifference = (transportArrivalTime, loginTime) => {
  if (!transportArrivalTime || !loginTime) return null;
  const arrival = new Date(transportArrivalTime);
  const login = new Date(loginTime);
  if (Number.isNaN(arrival.getTime()) || Number.isNaN(login.getTime())) return null;

  const diffMs = login.getTime() - arrival.getTime();
  const absDiffMs = Math.abs(diffMs);

  if (diffMs === 0) {
    return { label: "Same time", toneClass: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  }

  const isWithinTenMinutes = absDiffMs <= 600000;

  return {
    label: formatDuration(absDiffMs),
    toneClass: isWithinTenMinutes
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-rose-50 text-rose-700 border-rose-100",
  };
};

const getLogoutTypeLabel = (reason = "") => {
  const value = String(reason || "").trim();
  if (value === "manual") return "Manual Logout";
  if (value === "auto_9h" || value === "auto_window") return "Auto Logout";
  return "";
};

const getRowPriorityScore = (row) => {
  const status = String(row?.activityStatus || "").toLowerCase();
  const liveStatuses = new Set(["active", "manual_break", "auto_break", "idle_warning"]);
  const hasLogin = Boolean(row?.loginTime);
  const hasLogout = Boolean(row?.logoutTime);
  const isLive = liveStatuses.has(status) || row?.isOnBreak === true || (hasLogin && !hasLogout);
  const incompleteNineHours = row?.hasCompletedNineHours === false;
  const loginTs = hasLogin ? new Date(row.loginTime).getTime() : 0;
  const logoutTs = hasLogout ? new Date(row.logoutTime).getTime() : 0;
  const recencyTs = Math.max(loginTs || 0, logoutTs || 0);

  let score = 0;
  if (isLive) score += 1000;
  if (incompleteNineHours) score += 200;
  if (hasLogin && !hasLogout) score += 100;
  score += Math.floor(recencyTs / 1000);
  return score;
};

const normalizeShiftStartHour = (shiftStartHour, shiftEndHour) => {
  const startHour = Number(shiftStartHour);
  const endHour = Number(shiftEndHour);
  if (!Number.isFinite(startHour)) return null;

  const normalizedStart = ((startHour % 24) + 24) % 24;
  const normalizedEnd = Number.isFinite(endHour) ? ((endHour % 24) + 24) % 24 : null;

  if (normalizedStart > 0 && normalizedStart < 12 && normalizedEnd !== null && normalizedEnd < normalizedStart) {
    return normalizedStart + 12;
  }
  return normalizedStart;
};

const getIstHourFromDateLike = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  return Number.isFinite(hour) ? hour : null;
};

const getLateByFallbackMs = (loginTime, shiftStartHour, shiftEndHour) => {
  if (!loginTime) return 0;
  const loginHour = getIstHourFromDateLike(loginTime);
  const shiftHourNum = normalizeShiftStartHour(shiftStartHour, shiftEndHour);
  const inferredShiftHour =
    Number.isFinite(shiftHourNum) && shiftHourNum < 12 && Number.isFinite(loginHour) && loginHour >= 14
      ? shiftHourNum + 12
      : shiftHourNum;
  if (!Number.isFinite(inferredShiftHour)) return 0;
  const login = new Date(loginTime);
  if (Number.isNaN(login.getTime())) return 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(login);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const second = Number(parts.find((p) => p.type === "second")?.value || 0);
  const loginClockMs = hour * 60 * 60 * 1000 + minute * 60 * 1000 + second * 1000;
  const expectedClockMs = inferredShiftHour * 60 * 60 * 1000;
  const HALF_DAY_MS = 12 * 60 * 60 * 1000;
  const FULL_DAY_MS = 24 * 60 * 60 * 1000;

  let adjustedLoginClockMs = loginClockMs;
  const directDelta = loginClockMs - expectedClockMs;

  if (directDelta > HALF_DAY_MS) {
    adjustedLoginClockMs -= FULL_DAY_MS;
  } else if (directDelta < -HALF_DAY_MS) {
    adjustedLoginClockMs += FULL_DAY_MS;
  }

  const lateBy = adjustedLoginClockMs - expectedClockMs;
  return lateBy > 0 ? lateBy : 0;
};

const resolveLateByMs = ({ serverLateByMs, loginTime, shiftStartHour, shiftEndHour }) => {
  const safeServer = Number(serverLateByMs || 0);
  const fallback = getLateByFallbackMs(loginTime, shiftStartHour, shiftEndHour);
  if (!(safeServer > 0)) return fallback;

  const HALF_DAY_MS = 12 * 60 * 60 * 1000;
  if (safeServer > HALF_DAY_MS) return fallback;
  return safeServer;
};

const getFloorRosterStatusClass = (status) => {
  const key = String(status || "").trim().toUpperCase();

  if (key === "P") return "bg-[#E6F4EA] text-[#137333]"; 
  if (key === "WO") return "bg-[#E8F0FE] text-[#1A73E8]"; 
  if (key === "L") return "bg-rose-100 text-rose-700";
  if (key === "NCNS") return "bg-red-100 text-red-700";
  if (key === "UL") return "bg-orange-100 text-orange-700";
  if (key === "LWP") return "bg-yellow-100 text-yellow-700";
  if (key === "BL") return "bg-violet-100 text-violet-700";
  if (key === "H") return "bg-fuchsia-100 text-fuchsia-700";
  if (key === "HD") return "bg-amber-100 text-amber-700";
  if (key === "LWD") return "bg-lime-100 text-lime-700";
  return "bg-slate-100 text-slate-600";
};

const getBreakTypeLabel = (type) => {
  const map = {
    "lunch": "Lunch",
    "bio_1": "Short Break 1",
    "bio_2": "Short Break 2",
  };
  return map[type] || type;
};

const SuperAdminLoginStatus = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const isSuperAdminView = getRoleType(currentUser) === "superAdmin";
  const [dateKey, setDateKey] = useState(getDefaultDateKey());
  const [isDateManuallySelected, setIsDateManuallySelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [lastSyncedAtMs, setLastSyncedAtMs] = useState(Date.now());

  const token = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.token || "";
    } catch {
      return "";
    }
  }, []);

  const loadData = async (force = false) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = isSuperAdminView
        ? `${API_URL}/punchx/superadmin/daily-status`
        : `${API_URL}/punchx/manager/team-status`;
      const resCurrent = await getDailyStatus({ endpoint, dateKey, token, force });

      const merged = Array.isArray(resCurrent?.data?.rows) ? resCurrent.data.rows : [];

      const normalizedRows = merged.map((r) => {
        const loginTime = r.loginTime || r.shiftStartedAt || r.shiftStartAt || null;
        const serverLateByMs = Number(r.lateByMs || 0);
        const totalBreakMs = Number(r.totalBreakMs || 0);
        const lunchBreakMs = Number(r.lunchBreakMs || 0);
        const bioBreak1Ms = Number(r.bioBreak1Ms || 0);
        const bioBreak2Ms = Number(r.bioBreak2Ms || 0);
        return {
          ...r,
          loginTime,
          logoutTime: r.logoutTime || r.shiftEndedAt || r.shiftEndAt || null,
          breakStartAt: r.breakStartAt || null,
          isOnBreak:
            typeof r.isOnBreak === "boolean"
              ? r.isOnBreak
              : Boolean(r.breakType) || ["manual_break", "auto_break"].includes(r.activityStatus),
          lateByMs: resolveLateByMs({
            serverLateByMs,
            loginTime,
            shiftStartHour: r.shiftStartHour,
            shiftEndHour: r.shiftEndHour,
          }),
          totalWorkedMs: Number(r.totalWorkedMs || 0),
          totalBreakMs,
          lunchBreakMs,
          bioBreak1Ms,
          bioBreak2Ms,
          hasCompletedNineHours:
            typeof r.hasCompletedNineHours === "boolean"
              ? r.hasCompletedNineHours
              : Number(r.totalWorkedMs || 0) >= 9 * 60 * 60 * 1000,
          remainingForNineHoursMs:
            typeof r.remainingForNineHoursMs === "number"
              ? r.remainingForNineHoursMs
              : Math.max(0, 9 * 60 * 60 * 1000 - Number(r.totalWorkedMs || 0)),
        };
      });

      const byUser = new Map();
      normalizedRows.forEach((row) => {
        const key = String(row.userId || row.employeeId || row._id || row.username || Math.random());
        const existing = byUser.get(key);
        if (!existing) {
          byUser.set(key, row);
          return;
        }
        const existingScore = getRowPriorityScore(existing);
        const currentScore = getRowPriorityScore(row);
        if (currentScore > existingScore) {
          byUser.set(key, row);
        }
      });

      const finalRows = Array.from(byUser.values());
      const syncedAt = Date.now();
      setLastSyncedAtMs(syncedAt);
      setRows(finalRows);
      const serverSummary = resCurrent?.data?.summary;
      setSummary(
        serverSummary || {
          totalEmployees: finalRows.length,
          presentCount: 0,
          loggedInCount: finalRows.filter((r) => Boolean(r.loginTime)).length,
          onBreakCount: finalRows.filter((r) => r.isOnBreak).length,
          notCompletedNineHoursCount: finalRows.filter((r) => r.loginTime && !r.hasCompletedNineHours).length,
          lateLoginCount: finalRows.filter((r) => r.loginTime && r.lateByMs > 0).length,
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load login status");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    if (!token || !isSuperAdminView) return;
    try {
      setExporting(true);
      const res = await axios.get(`${API_URL}/punchx/superadmin/daily-status/export`, {
        params: { dateKey },
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });
      const disposition = res.headers?.["content-disposition"] || "";
      const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const fileName = fileNameMatch?.[1] || `superadmin-login-status-${dateKey}.xlsx`;
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to export login status");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [dateKey, isSuperAdminView]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const getLiveRemainingMs = (row) => {
    if (!row?.loginTime || row?.hasCompletedNineHours) return 0;
    if (row?.logoutTime) return Math.max(0, Number(row.remainingForNineHoursMs || 0));

    const baseRemaining = Math.max(0, Number(row.remainingForNineHoursMs || 0));
    const elapsedAfterSync = Math.max(0, nowMs - lastSyncedAtMs);
    return Math.max(0, baseRemaining - elapsedAfterSync);
  };

  useEffect(() => {
    if (isDateManuallySelected) return;
    const syncDateKey = () => setDateKey(getDefaultDateKey());
    syncDateKey();
    const id = setInterval(syncDateKey, 60000);
    return () => clearInterval(id);
  }, [isDateManuallySelected]);

  const departments = useMemo(() => {
    const set = new Set(rows.map((r) => r.department).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (dept !== "All" && r.department !== dept) return false;
      if (status === "On Break" && !r.isOnBreak) return false;
      if (status === "Logged In" && !r.loginTime) return false;
      if (status === "Not Logged In" && r.loginTime) return false;
      if (status === "Late" && !(r.loginTime && r.lateByMs > 0)) return false;
      if (status === "9h Incomplete" && !(r.loginTime && !r.hasCompletedNineHours)) return false;
      if (!q) return true;
      const hay = `${r.pseudoName || ""} ${r.name || ""} ${r.username || ""} ${r.department || ""} ${r.accountType || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, dept, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, dept, status, pageSize, dateKey]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 font-sans">
      <div className="mx-auto max-w-[1600px] space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white w-64"
            />
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white">
              {departments.map((d) => <option key={d} value={d}>{d} Department</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white">
              {["All", "Logged In", "Not Logged In", "On Break", "Late", "9h Incomplete"].map((s) => <option key={s} value={s}>{s} Status</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateKey}
              onChange={(e) => {
                setIsDateManuallySelected(true);
                setDateKey(e.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium outline-none"
            />
            {isSuperAdminView && (
              <button
                onClick={exportExcel}
                disabled={exporting}
                className="rounded-xl bg-[#1E4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            )}
            <button
              onClick={() => loadData(true)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-[#F8FAFC] border-r border-slate-200/80 px-6 py-4 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Employee
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      Department
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      Status
                      <svg className="w-3.5 h-3.5 text-slate-400 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" /></svg>
                      Transport Arrival
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h7a3 3 0 013 3v1" /></svg>
                      Login
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
                      Login Difference
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Logout
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      Floor Roster
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Worked
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" /></svg>
                      9H Progress
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-6 py-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Breaks Used
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px] text-[#334155]">
                {paginatedRows.map((row) => {
                  const nameDisplay = row.pseudoName || row.name || row.username || "Unknown";
                  const initialDisplay = nameDisplay.charAt(0).toUpperCase();
                  const loginTimes = formatDateTime(row.loginTime);
                  const logoutTimes = formatDateTime(row.logoutTime);
                  const arrivalLoginDifference = getTransportLoginDifference(row.transportArrivalTime, row.loginTime);
  
                  return (
                    <tr key={row.userId} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-white group-hover:bg-[#F8FAFC] border-r border-slate-200/80 px-6 py-4.5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8] font-bold text-sm border border-blue-100">
                            {initialDisplay}
                          </div>
                          <span className="font-semibold text-[#0F172A]">{nameDisplay}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4.5 text-[#64748B] whitespace-nowrap">
                        {row.department || "Ops - Meta"}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {row.isOnBreak ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                            {row.breakType ? getBreakTypeLabel(row.breakType) : "On Break"}
                            <BreakTimer row={row} />
                          </div>
                        ) : row.loginTime ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F4EA] px-2.5 py-1 text-xs font-semibold text-[#137333] border border-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-[#10B981]"></span>
                            On Shift
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            Offline
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap text-slate-400">
                        {row.transportArrivalTime ? (
                          <span className="text-[#1E293B] font-medium">{formatTime(row.transportArrivalTime)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap font-medium text-[#1E293B]">
                        {loginTimes ? (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <div className="flex flex-col text-left">
                              <span>{loginTimes.dateStr}</span>
                              <span className="text-[11px] text-slate-400 font-normal">{loginTimes.timeStr}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {arrivalLoginDifference ? (
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${arrivalLoginDifference.toneClass}`}>
                            {arrivalLoginDifference.label}
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap font-medium text-[#1E293B]">
                        {logoutTimes ? (
                          <div className="flex flex-col text-left">
                            <span>{logoutTimes.dateStr}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{logoutTimes.timeStr}</span>
                            {row.logoutReason && (
                              <span className="text-[10px] text-rose-500 font-normal mt-0.5">{getLogoutTypeLabel(row.logoutReason)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        <div className={`inline-flex h-7 w-10 items-center justify-center rounded-full font-bold text-xs shadow-sm ${getFloorRosterStatusClass(row.floorRosterStatus)}`}>
                          {row.floorRosterStatus || "P"}
                        </div>
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {row.loginTime ? (
                          <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {formatDuration(row.totalWorkedMs || 0)}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {!row.loginTime ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-24">
                            <div className="relative flex items-center justify-center h-12 w-12 rounded-full border-2 border-rose-100 border-t-rose-500 border-r-rose-400">
                              <span className="text-[11px] font-bold text-rose-600">
                                {formatDuration(getLiveRemainingMs(row))}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {row.loginTime ? (
                          <div className="flex flex-col gap-0.5 font-medium text-[#475569] text-xs">
                            <span className="text-emerald-600">Lunch: {formatDuration(row.lunchBreakMs || 0)}</span>
                            <span className="text-blue-600">Short Break 1: {formatDuration(row.bioBreak1Ms || 0)}</span>
                            <span className="text-purple-600">Short Break 2: {formatDuration(row.bioBreak2Ms || 0)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-slate-600">
              Showing {filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
              {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm font-medium text-slate-700">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLoginStatus;