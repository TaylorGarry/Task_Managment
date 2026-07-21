
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { CalendarDays, Check, CheckCircle2, Clock3, Search, ShieldCheck, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
// import { toast } from "react-toastify";
// import Navbar from "./Navbar.jsx";
// import StyledDatePicker from "../components/StyledDatePicker.jsx";
// import { getRoleType } from "../utils/roleAccess.js";
// import {
//   applyLeave,
//   clearLeaveMessage,
//   fetchAdminLeaveDashboard,
//   fetchAdminLeaveRequests,
//   fetchMyLeaveRequests,
//   fetchTeamLeaveCalendarRequests,
//   reviewLeaveRequest,
// } from "../features/slices/leaveSlice.js";

// const formatDate = (value) => {
//   if (!value) return "-";
//   const str = String(value);
//   if (str.includes('T')) {
//     const d = new Date(str);
//     if (Number.isNaN(d.getTime())) return "-";
//     d.setHours(d.getHours() + 5.5);
//     return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "2-digit" });
//   } else {
//     const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//     if (!match) {
//       const d = new Date(str);
//       if (Number.isNaN(d.getTime())) return "-";
//       return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
//     }
//     const y = Number(match[1]);
//     const m = Number(match[2]) - 1;
//     const day = Number(match[3]);
//     const d = new Date(Date.UTC(y, m, day));
//     return d.toLocaleDateString("en-IN", {
//       timeZone: "Asia/Kolkata",
//       year: "numeric",
//       month: "short",
//       day: "2-digit",
//     });
//   }
// };

// const getStatusChipClass = (status) => {
//   const key = String(status || "").toLowerCase();
//   if (key === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
//   if (key === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
//   if (key === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
//   return "bg-slate-50 text-slate-600 border-slate-200";
// };

// const getLeaveTypeLabel = (leaveType) => {
//   const key = String(leaveType || "").trim().toUpperCase();
//   if (key === "BL") return "BL (Birthday Leave)";
//   if (key === "LWP") return "LWP (Leave Without Pay)";
//   return "Leave";
// };

// const toDateOnly = (value) => {
//   if (!value) return null;
//   const str = String(value);
//   const plainDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
//   if (plainDateMatch) {
//     return new Date(Number(plainDateMatch[1]), Number(plainDateMatch[2]) - 1, Number(plainDateMatch[3]));
//   }

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return null;
//   const parts = new Intl.DateTimeFormat("en-IN", {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(date);
//   const year = Number(parts.find((part) => part.type === "year")?.value);
//   const month = Number(parts.find((part) => part.type === "month")?.value);
//   const day = Number(parts.find((part) => part.type === "day")?.value);
//   if (!year || !month || !day) return null;
//   return new Date(year, month - 1, day);
// };

// const isDateWithinRange = (date, startDate, endDate) => {
//   const day = toDateOnly(date);
//   const start = toDateOnly(startDate);
//   const end = toDateOnly(endDate);
//   if (!day || !start || !end) return false;
//   return day >= start && day <= end;
// };

// const LeaveManagement = ({ embeddedAdmin = false }) => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const {
//     myRequests,
//     adminDashboard,
//     adminRequests,
//     teamCalendarRequests,
//     loadingRequests,
//     loadingTeamCalendarRequests,
//     applying,
//     reviewing,
//     error,
//     message,
//   } = useSelector((state) => state.leave);

//   const accountType = String(user?.accountType || "").trim().toLowerCase();
//   const roleType = getRoleType(user || {});
//   const isSuperAdmin = accountType === "superadmin";
//   const isEmployeeAccount = ["employee", "agent", "supervisor"].includes(accountType);
//   const isSupervisor = isEmployeeAccount && roleType === "supervisor" && !isSuperAdmin;
//   const canViewTeamLeave = isSuperAdmin || isSupervisor;
//   const canReviewLeave = isSuperAdmin;

//   const [leaveForm, setLeaveForm] = useState({
//     leaveType: "L",
//     startDate: "",
//     endDate: "",
//     startSession: "full",
//     endSession: "full",
//     reason: "",
//   });
//   const [requestFilter, setRequestFilter] = useState("pending");
//   const [search, setSearch] = useState("");
//   const [employeeSearch, setEmployeeSearch] = useState("");
//   const [employeePage, setEmployeePage] = useState(1);
//   const [employeePageSize, setEmployeePageSize] = useState(10);
//   const [reviewRemarks, setReviewRemarks] = useState({});
//   const [expandedText, setExpandedText] = useState(null);
//   const [calendarMonth, setCalendarMonth] = useState(() => {
//     const today = new Date();
//     return new Date(today.getFullYear(), today.getMonth(), 1);
//   });

//   // PAGINATION FOR ADMIN REQUESTS
//   const [adminRequestPage, setAdminRequestPage] = useState(1);
//   const [adminRequestPageSize, setAdminRequestPageSize] = useState(10);

//   // PAGINATION FOR MY LEAVE HISTORY
//   const [myHistoryPage, setMyHistoryPage] = useState(1);
//   const [myHistoryPageSize, setMyHistoryPageSize] = useState(10);

//   useEffect(() => {
//     if (!isSuperAdmin) {
//       dispatch(fetchMyLeaveRequests());
//     }
//   }, [dispatch, isSuperAdmin]);

//   useEffect(() => {
//     if (canViewTeamLeave) {
//       dispatch(fetchAdminLeaveDashboard());
//     }
//   }, [dispatch, canViewTeamLeave]);

//   useEffect(() => {
//     if (!canViewTeamLeave) return;
//     const timer = setTimeout(() => {
//       dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
//     }, 350);
//     return () => clearTimeout(timer);
//   }, [dispatch, canViewTeamLeave, requestFilter, search]);

//   useEffect(() => {
//     if (isSupervisor) {
//       dispatch(fetchTeamLeaveCalendarRequests());
//     }
//   }, [dispatch, isSupervisor]);

//   useEffect(() => {
//     if (error) toast.error(error);
//     if (message) {
//       toast.success(message);
//       dispatch(clearLeaveMessage());
//     }
//   }, [dispatch, error, message]);

//   // Reset to first page whenever search input text changes
//   const handleEmployeeSearchChange = (e) => {
//     setEmployeeSearch(e.target.value);
//     setEmployeePage(1);
//   };

//   // Reset admin request page when filter or search changes
//   useEffect(() => {
//     setAdminRequestPage(1);
//   }, [requestFilter, search]);

//   // Reset my history page when myRequests changes
//   useEffect(() => {
//     setMyHistoryPage(1);
//   }, [myRequests]);

//   const handleApply = async (e) => {
//     e.preventDefault();
//     if (!leaveForm.startDate || !leaveForm.endDate) {
//       toast.error("Please select start and end dates");
//       return;
//     }
//     if (!String(leaveForm.reason || "").trim() || String(leaveForm.reason || "").trim().length < 5) {
//       toast.error("Please enter your leave reason");
//       return;
//     }

//     const result = await dispatch(applyLeave(leaveForm));
//     if (applyLeave.fulfilled.match(result)) {
//       setLeaveForm((prev) => ({
//         ...prev,
//         startDate: "",
//         endDate: "",
//         startSession: "full",
//         endSession: "full",
//         reason: "",
//       }));
//       dispatch(fetchMyLeaveRequests());
//       if (isSupervisor) {
//         dispatch(fetchTeamLeaveCalendarRequests());
//       }
//     }
//   };

//   const handleReview = async (row, action) => {
//     const rowRemark = String(reviewRemarks[row._id] || "").trim();
//     if (action !== "reset" && rowRemark.length < 5) {
//       toast.error("Please enter approval/rejection remark");
//       return;
//     }
//     const result = await dispatch(
//       reviewLeaveRequest({
//         requestId: row._id,
//         action,
//         comment: rowRemark,
//       })
//     );
//     if (reviewLeaveRequest.fulfilled.match(result)) {
//       setReviewRemarks((prev) => ({ ...prev, [row._id]: "" }));
//       if (canViewTeamLeave) {
//         dispatch(fetchAdminLeaveDashboard());
//         dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
//       }
//     }
//   };

//   const renderExpandableText = (value, label, widthClass = "w-[160px]") => {
//     const text = String(value || "").trim() || "-";
//     const canExpand = text !== "-";

//     return (
//       <span
//         onClick={() => canExpand && setExpandedText({ label, value: text })}
//         className={`block ${widthClass} truncate text-sm ${
//           canExpand ? "cursor-pointer text-slate-700 hover:text-indigo-600 transition" : "text-slate-400"
//         }`}
//         title={canExpand ? "Click to view full text" : text}
//       >
//         {text}
//       </span>
//     );
//   };

//   const stats = adminDashboard?.stats || {};
  
//   const baseEmployees = canViewTeamLeave ? adminDashboard?.employees || [] : [];

//   const filteredEmployees = baseEmployees.filter(emp => {
//     if (!employeeSearch.trim()) return true;
//     const searchTerm = employeeSearch.toLowerCase();
//     return (
//       (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
//       (emp.empId && emp.empId.toLowerCase().includes(searchTerm)) ||
//       (emp.pseudoName && emp.pseudoName.toLowerCase().includes(searchTerm)) ||
//       (emp.department && emp.department.toLowerCase().includes(searchTerm))
//     );
//   });
  
//   // EMPLOYEE PAGINATION CALCULATION
//   const employeeTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
//   const safeEmployeePage = Math.min(employeePage, employeeTotalPages);
//   const employeeStart = (safeEmployeePage - 1) * employeePageSize;
//   const paginatedEmployees = filteredEmployees.slice(employeeStart, employeeStart + employeePageSize);

//   // ADMIN REQUESTS PAGINATION CALCULATION
//   const adminRequestsList = adminRequests || [];
//   const adminTotalPages = Math.max(1, Math.ceil(adminRequestsList.length / adminRequestPageSize));
//   const safeAdminPage = Math.min(adminRequestPage, adminTotalPages);
//   const adminStart = (safeAdminPage - 1) * adminRequestPageSize;
//   const paginatedAdminRequests = adminRequestsList.slice(adminStart, adminStart + adminRequestPageSize);

//   // MY LEAVE HISTORY PAGINATION CALCULATION
//   const myRequestsList = myRequests || [];
//   const myTotalPages = Math.max(1, Math.ceil(myRequestsList.length / myHistoryPageSize));
//   const safeMyPage = Math.min(myHistoryPage, myTotalPages);
//   const myStart = (safeMyPage - 1) * myHistoryPageSize;
//   const paginatedMyRequests = myRequestsList.slice(myStart, myStart + myHistoryPageSize);

//   const calendarYear = calendarMonth.getFullYear();
//   const calendarMonthIndex = calendarMonth.getMonth();
//   const calendarMonthLabel = calendarMonth.toLocaleDateString("en-IN", {
//     month: "long",
//     year: "numeric",
//   });
//   const monthStart = new Date(calendarYear, calendarMonthIndex, 1);
//   const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
//   const leadingBlankDays = monthStart.getDay();
//   const calendarCells = [
//     ...Array.from({ length: leadingBlankDays }, () => null),
//     ...Array.from({ length: daysInMonth }, (_, index) => new Date(calendarYear, calendarMonthIndex, index + 1)),
//   ];
//   const visibleTeamCalendarRequests = (teamCalendarRequests || []).filter((row) =>
//     ["approved", "pending"].includes(String(row?.status || "").toLowerCase())
//   );
//   const getCalendarDayRequests = (date) =>
//     visibleTeamCalendarRequests.filter((row) => isDateWithinRange(date, row.startDate, row.endDate));
//   const moveCalendarMonth = (offset) => {
//     setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
//   };

//   return (
//     <div className="min-h-screen bg-slate-50/50 antialiased font-sans">
//       {!embeddedAdmin && <Navbar />}
      
//       <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8 space-y-7">
        
// 	        {!isSuperAdmin && (
// 	          <div className={isSupervisor ? "grid grid-cols-1 gap-5 xl:grid-cols-2" : "w-full xl:w-1/2"}>
// 	          <form onSubmit={handleApply} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
// 	            <div className="flex items-center gap-2.5">
// 	              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
// 	                <CalendarDays className="w-5 h-5" />
//               </div>
//               <h2 className="text-base font-semibold text-slate-800">Apply Leave</h2>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
//               <div>
//                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</label>
//                 <select
//                   className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//                   value={leaveForm.leaveType}
//                   onChange={(e) => setLeaveForm((prev) => ({ ...prev, leaveType: e.target.value }))}
//                 >
//                   <option value="L">Leave</option>
//                   <option value="BL">BL (Birthday Leave)</option>
//                   <option value="LWP">LWP (Leave Without Pay)</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
//                 <div className="mt-1">
//                   <StyledDatePicker
//                     value={leaveForm.startDate}
//                     onChange={(value) => setLeaveForm((prev) => ({ ...prev, startDate: value }))}
//                     placeholder="Select start date"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Session</label>
//                 <select
//                   className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//                   value={leaveForm.startSession}
//                   onChange={(e) => setLeaveForm((prev) => ({ ...prev, startSession: e.target.value }))}
//                 >
//                   <option value="full">Full Day</option>
//                   <option value="first_half">First Half</option>
//                   <option value="second_half">Second Half</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
//                 <div className="mt-1">
//                   <StyledDatePicker
//                     value={leaveForm.endDate}
//                     onChange={(value) => setLeaveForm((prev) => ({ ...prev, endDate: value }))}
//                     placeholder="Select end date"
//                   />
//                 </div>
//               </div>
//               <div>
//                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Session</label>
//                 <select
//                   className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//                   value={leaveForm.endSession}
//                   onChange={(e) => setLeaveForm((prev) => ({ ...prev, endSession: e.target.value }))}
//                 >
//                   <option value="full">Full Day</option>
//                   <option value="first_half">First Half</option>
//                   <option value="second_half">Second Half</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
//                 <input
//                   type="text"
//                   value={leaveForm.reason}
//                   onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))}
//                   placeholder="Clearly mention reason for leave"
//                   className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//                 />
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={applying}
//               className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
//             >
// 	              {applying ? "Submitting..." : "Submit Leave Request"}
// 	            </button>
// 	          </form>
//               {isSupervisor && (
//                 <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
//                   <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                     <div className="flex items-center gap-2.5">
//                       <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
//                         <CalendarDays className="w-5 h-5" />
//                       </div>
//                       <div>
//                         <h2 className="text-base font-semibold text-slate-800">Team Leave Calendar</h2>
//                         <p className="text-xs text-slate-500">Approved and pending team leave by date</p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={() => moveCalendarMonth(-1)}
//                         className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                         title="Previous month"
//                       >
//                         <ChevronLeft className="h-4 w-4" />
//                       </button>
//                       <div className="min-w-[130px] text-center text-sm font-semibold text-slate-800">
//                         {calendarMonthLabel}
//                       </div>
//                       <button
//                         type="button"
//                         onClick={() => moveCalendarMonth(1)}
//                         className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                         title="Next month"
//                       >
//                         <ChevronRight className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </div>

//                   <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
//                     {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
//                       <div key={day} className="py-1">{day}</div>
//                     ))}
//                   </div>
//                   <div className="mt-1 grid grid-cols-7 gap-1">
//                     {calendarCells.map((date, index) => {
//                       if (!date) {
//                         return <div key={`blank-${index}`} className="min-h-[78px] rounded-lg bg-slate-50/60" />;
//                       }
//                       const dayRequests = getCalendarDayRequests(date);
//                       const isToday = toDateOnly(new Date())?.getTime() === date.getTime();

//                       return (
//                         <div
//                           key={date.toISOString()}
//                           className={`min-h-[78px] rounded-lg border p-1.5 text-left ${
//                             dayRequests.length
//                               ? "border-emerald-200 bg-emerald-50"
//                               : "border-slate-100 bg-white"
//                           } ${isToday ? "ring-2 ring-indigo-200" : ""}`}
//                         >
//                           <div className="flex items-center justify-between">
//                             <span className={`text-xs font-semibold ${isToday ? "text-indigo-700" : "text-slate-700"}`}>
//                               {date.getDate()}
//                             </span>
//                             {dayRequests.length > 0 && (
//                               <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
//                                 {dayRequests.length}
//                               </span>
//                             )}
//                           </div>
//                           <div className="mt-1 space-y-1">
//                             {dayRequests.slice(0, 2).map((row) => (
//                               <div
//                                 key={`${row._id}-${date.toISOString()}`}
//                                 className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
//                                   row.status === "pending"
//                                     ? "bg-amber-100 text-amber-700"
//                                     : "bg-emerald-100 text-emerald-700"
//                                 }`}
//                                 title={`${row.userId?.pseudoName || row.userId?.realName || row.userId?.username || "Employee"} - ${getLeaveTypeLabel(row.leaveType)} (${row.status})`}
//                               >
//                                 {row.userId?.pseudoName || row.userId?.realName || row.userId?.username || "Employee"}
//                               </div>
//                             ))}
//                             {dayRequests.length > 2 && (
//                               <div className="text-[10px] font-medium text-slate-500">+{dayRequests.length - 2} more</div>
//                             )}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                   {loadingTeamCalendarRequests ? (
//                     <p className="mt-3 text-xs text-slate-500">Loading team leave calendar...</p>
//                   ) : visibleTeamCalendarRequests.length === 0 ? (
//                     <p className="mt-3 text-xs text-slate-500">No approved or pending team leave found.</p>
//                   ) : (
//                     <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
//                       <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved</span>
//                       <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</span>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
// 	        )}

//         {!isSuperAdmin && (
//           <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
//             <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
//               <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
//                 <Clock3 className="w-5 h-5" />
//               </div>
//               <h2 className="text-base font-semibold text-slate-800">My Leave History</h2>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left border-collapse">
//                 <thead>
//                   <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
//                     <th className="py-3 px-5">Type</th>
//                     <th className="py-3 px-4">Session</th>
//                     <th className="py-3 px-4 whitespace-nowrap">Date Range</th>
//                     <th className="py-3 px-4 w-[180px]">Leave Reason</th>
//                     <th className="py-3 px-4 text-center">Requested</th>
//                     <th className="py-3 px-4 text-center">Charged</th>
//                     <th className="py-3 px-4 text-center">Status</th>
//                     <th className="py-3 px-5">Reviewed By</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100 text-sm">
//                   {paginatedMyRequests.map((row) => (
//                     <tr key={row._id} className="hover:bg-slate-50/50 transition duration-150">
//                       <td className="py-3.5 px-5 font-semibold text-slate-800">{getLeaveTypeLabel(row.leaveType)}</td>
//                       <td className="py-3.5 px-4 text-slate-600 capitalize">
//                         {String(row.startSession || "full").replace("_", " ")} to {String(row.endSession || "full").replace("_", " ")}
//                       </td>
//                       <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
//                         <div className="font-medium text-slate-700">{formatDate(row.startDate)}</div>
//                         <div className="text-xs text-slate-400 mt-0.5">{formatDate(row.endDate)}</div>
//                       </td>
//                       <td className="py-3.5 px-4 align-middle">
//                         {renderExpandableText(row.reason, "Leave Reason")}
//                       </td>
//                       <td className="py-3.5 px-4 text-center text-slate-700">{row.requestedDays ?? "-"}</td>
//                       <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{row.chargedDays ?? "-"}</td>
//                       <td className="py-3.5 px-4 text-center whitespace-nowrap">
//                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusChipClass(row.status)}`}>
//                           <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
//                           {row.status || "pending"}
//                         </span>
//                       </td>
//                       <td className="py-3.5 px-5 text-slate-600">
//                         {row.reviewedBy?.pseudoName || row.reviewedBy?.realName || row.reviewedBy?.username || "-"}
//                         {row.reviewedAt ? <div className="text-xs text-slate-400 mt-0.5">{formatDate(row.reviewedAt)}</div> : null}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               {!loadingRequests && myRequestsList.length === 0 && (
//                 <p className="py-8 text-center text-sm text-slate-400 italic">No leave requests yet.</p>
//               )}
//             </div>

//             {/* PAGINATION FOR MY LEAVE HISTORY */}
//             {myRequestsList.length > 0 && (
//               <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
//                 <div className="text-xs font-medium text-slate-500">
//                   Showing <span className="text-slate-700">{myStart + 1}</span> to{" "}
//                   <span className="text-slate-700">
//                     {Math.min(myStart + myHistoryPageSize, myRequestsList.length)}
//                   </span>{" "}
//                   of <span className="text-slate-700">{myRequestsList.length}</span> entries
//                 </div>
                
//                 <div className="flex items-center gap-1.5">
//                   <button
//                     onClick={() => setMyHistoryPage((prev) => Math.max(prev - 1, 1))}
//                     disabled={safeMyPage === 1}
//                     className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
//                   >
//                     <ChevronLeft className="w-4 h-4" />
//                   </button>

//                   {Array.from({ length: myTotalPages }, (_, index) => {
//                     const pageNum = index + 1;
//                     // Show limited page numbers with ellipsis for better UX
//                     if (myTotalPages <= 7) {
//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => setMyHistoryPage(pageNum)}
//                           className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
//                             safeMyPage === pageNum
//                               ? "bg-indigo-600 text-white shadow-sm"
//                               : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                           }`}
//                         >
//                           {pageNum}
//                         </button>
//                       );
//                     }
//                     // Show first page, last page, current page with neighbors
//                     if (pageNum === 1 || pageNum === myTotalPages || Math.abs(pageNum - safeMyPage) <= 1) {
//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => setMyHistoryPage(pageNum)}
//                           className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
//                             safeMyPage === pageNum
//                               ? "bg-indigo-600 text-white shadow-sm"
//                               : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                           }`}
//                         >
//                           {pageNum}
//                         </button>
//                       );
//                     }
//                     if (pageNum === 2 && safeMyPage > 3) {
//                       return <span key="ellipsis-start" className="text-slate-400">…</span>;
//                     }
//                     if (pageNum === myTotalPages - 1 && safeMyPage < myTotalPages - 2) {
//                       return <span key="ellipsis-end" className="text-slate-400">…</span>;
//                     }
//                     return null;
//                   })}

//                   <button
//                     onClick={() => setMyHistoryPage((prev) => Math.min(prev + 1, myTotalPages))}
//                     disabled={safeMyPage === myTotalPages}
//                     className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
//                   >
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {canViewTeamLeave && (
//           <>
//         {/* STATS ANALYTICS CARDS */}
//         {isSuperAdmin && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//           <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between border-l-4 border-l-indigo-500">
//             <div>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Employees</p>
//               <p className="text-3xl font-bold text-slate-800 mt-1.5">{stats.totalEmployees ?? 0}</p>
//             </div>
//             <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
//               <Users className="w-6 h-6" />
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
//             <div>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</p>
//               <p className="text-3xl font-bold text-amber-600 mt-1.5">{stats.pendingRequests ?? 0}</p>
//             </div>
//             <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
//               <Clock3 className="w-6 h-6" />
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
//             <div>
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Requests</p>
//               <p className="text-3xl font-bold text-emerald-600 mt-1.5">{stats.approvedRequests ?? 0}</p>
//             </div>
//             <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
//               <CheckCircle2 className="w-6 h-6" />
//             </div>
//           </div>
//           </div>
//         )}

//         {/* SECTION: LEAVE REQUESTS QUEUE */}
//         <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
//           <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//             <div className="flex items-center gap-2.5">
//               <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
//                 <CalendarDays className="w-5 h-5" />
//               </div>
//               <h2 className="text-base font-semibold text-slate-800">
//                 {isSupervisor ? "Team Leave Requests" : "Leave Requests Queue"}
//               </h2>
//             </div>
            
//             <div className="flex flex-wrap items-center gap-3">
//               <select
//                 value={requestFilter}
//                 onChange={(e) => setRequestFilter(e.target.value)}
//                 className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//               >
//                 <option value="pending">Pending</option>
//                 <option value="approved">Approved</option>
//                 <option value="rejected">Rejected</option>
//                 <option value="all">All</option>
//               </select>
              
//               <div className="relative min-w-[240px]">
//                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
//                 <input
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search employee name or ID..."
//                   className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
//                   <th className="py-3 px-5">Employee</th>
//                   <th className="py-3 px-4">Type</th>
//                   <th className="py-3 px-4">Session</th>
//                   <th className="py-3 px-4 whitespace-nowrap">Date Range</th>
//                   <th className="py-3 px-4 w-[180px]">Leave Reason</th>
//                   <th className="py-3 px-4 text-center">Charged</th>
//                   <th className="py-3 px-4 text-center">Status</th>
//                   <th className="py-3 px-4">Reviewed By</th>
//                   <th className="py-3 px-4 w-[200px]">Decision Remark</th>
//                   {canReviewLeave && <th className="py-3 px-5 text-right">Actions</th>}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 text-sm">
// 	                {paginatedAdminRequests.map((row) => (
//                   <tr key={row._id} className="hover:bg-slate-50/50 transition duration-150 group">
//                     <td className="py-3.5 px-5">
//                       <div className="font-semibold text-slate-800">{row.userId?.pseudoName || row.userId?.username || "Employee"}</div>
//                       <div className="text-xs text-slate-400 mt-0.5 font-mono">{row.userId?.empId || "-"}</div>
//                     </td>
//                     <td className="py-3.5 px-4 font-medium text-slate-700">
//                       <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-semibold">{getLeaveTypeLabel(row.leaveType)}</span>
//                     </td>
//                     <td className="py-3.5 px-4 text-slate-600 capitalize">
//                       {String(row.startSession || "full").replace("_", " ")}
//                     </td>
//                     <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
//                       <div className="font-medium text-slate-700">{formatDate(row.startDate)}</div>
//                       <div className="text-xs text-slate-400 mt-0.5">{formatDate(row.endDate)}</div>
//                     </td>
//                     <td className="py-3.5 px-4 align-middle">
//                       {renderExpandableText(row.reason, "Leave Reason")}
//                     </td>
//                     <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{row.chargedDays}</td>
//                     <td className="py-3.5 px-4 text-center whitespace-nowrap">
//                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusChipClass(row.status)}`}>
//                         <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
//                         {row.status}
//                       </span>
//                     </td>
//                     <td className="py-3.5 px-4 text-slate-500 font-medium">
//                       {row.reviewedBy?.pseudoName || "-"}
//                     </td>
// 	                    <td className="py-3.5 px-4">
// 	                      {canReviewLeave && row.status === "pending" ? (
// 	                        <input
// 	                          type="text"
// 	                          value={reviewRemarks[row._id] || ""}
//                           onChange={(e) => setReviewRemarks((prev) => ({ ...prev, [row._id]: e.target.value }))}
//                           placeholder="Type review remark..."
//                           className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50/50 rounded-md text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
//                         />
//                       ) : (
//                         renderExpandableText(row.reviewComment, "Decision Remark")
//                       )}
//                     </td>
//                     {canReviewLeave && (
//                     <td className="py-3.5 px-5 text-right whitespace-nowrap">
//                       {row.status === "pending" ? (
//                         <div className="flex items-center justify-end gap-1.5">
//                           <button
//                             onClick={() => handleReview(row, "approve")}
//                             className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-md transition shadow-sm"
//                           >
//                             <Check className="w-3.5 h-3.5" /> Approve
//                           </button>
//                           <button
//                             onClick={() => handleReview(row, "reject")}
//                             className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-md transition"
//                           >
//                             <X className="w-3.5 h-3.5" /> Reject
//                           </button>
//                         </div>
//                       ) : isSuperAdmin && ["approved", "rejected"].includes(String(row.status || "").toLowerCase()) ? (
//                         <button
//                           onClick={() => handleReview(row, "reset")}
//                           className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-md transition"
//                         >
//                           Reset
//                         </button>
//                       ) : (
//                         <span className="text-xs text-slate-400 font-medium italic">Processed</span>
//                       )}
//                     </td>
//                     )}
//                   </tr>
//                 ))}
// 	              </tbody>
// 	            </table>
//               {adminRequestsList.length === 0 && (
//                 <p className="py-8 text-center text-sm text-slate-400 italic">
//                   No requests found for selected filters.
//                 </p>
//               )}
// 	          </div>

//           {/* PAGINATION FOR ADMIN REQUESTS */}
//           {adminRequestsList.length > 0 && (
//             <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
//               <div className="text-xs font-medium text-slate-500">
//                 Showing <span className="text-slate-700">{adminStart + 1}</span> to{" "}
//                 <span className="text-slate-700">
//                   {Math.min(adminStart + adminRequestPageSize, adminRequestsList.length)}
//                 </span>{" "}
//                 of <span className="text-slate-700">{adminRequestsList.length}</span> entries
//               </div>
              
//               <div className="flex items-center gap-1.5">
//                 <button
//                   onClick={() => setAdminRequestPage((prev) => Math.max(prev - 1, 1))}
//                   disabled={safeAdminPage === 1}
//                   className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
//                 >
//                   <ChevronLeft className="w-4 h-4" />
//                 </button>

//                 {Array.from({ length: adminTotalPages }, (_, index) => {
//                   const pageNum = index + 1;
//                   // Show limited page numbers with ellipsis for better UX
//                   if (adminTotalPages <= 7) {
//                     return (
//                       <button
//                         key={pageNum}
//                         onClick={() => setAdminRequestPage(pageNum)}
//                         className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
//                           safeAdminPage === pageNum
//                             ? "bg-indigo-600 text-white shadow-sm"
//                             : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                         }`}
//                       >
//                         {pageNum}
//                       </button>
//                     );
//                   }
//                   // Show first page, last page, current page with neighbors
//                   if (pageNum === 1 || pageNum === adminTotalPages || Math.abs(pageNum - safeAdminPage) <= 1) {
//                     return (
//                       <button
//                         key={pageNum}
//                         onClick={() => setAdminRequestPage(pageNum)}
//                         className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
//                           safeAdminPage === pageNum
//                             ? "bg-indigo-600 text-white shadow-sm"
//                             : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                         }`}
//                       >
//                         {pageNum}
//                       </button>
//                     );
//                   }
//                   if (pageNum === 2 && safeAdminPage > 3) {
//                     return <span key="ellipsis-start" className="text-slate-400">…</span>;
//                   }
//                   if (pageNum === adminTotalPages - 1 && safeAdminPage < adminTotalPages - 2) {
//                     return <span key="ellipsis-end" className="text-slate-400">…</span>;
//                   }
//                   return null;
//                 })}

//                 <button
//                   onClick={() => setAdminRequestPage((prev) => Math.min(prev + 1, adminTotalPages))}
//                   disabled={safeAdminPage === adminTotalPages}
//                   className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
//                 >
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* SECTION: BALANCE MATRIX ACCORDION */}
//         <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
//           <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//             <div className="flex items-center gap-2.5">
//               <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
//                 <ShieldCheck className="w-5 h-5" />
//               </div>
//               <h2 className="text-base font-semibold text-slate-800">
//                 {isSupervisor ? "Team Remaining Leave" : "Current Leave Balance"}
//               </h2>
//             </div>
//             <div className="relative min-w-[240px]">
//               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
//               <input
//                 value={employeeSearch}
//                 onChange={handleEmployeeSearchChange}
//                 placeholder="Quick filter team..."
//                 className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
//               />
//             </div>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
//                   <th className="py-3 px-5">Employee Name</th>
//                   <th className="py-3 px-4">Pseudo Name</th>
//                   <th className="py-3 px-4">Department</th>
//                   <th className="py-3 px-5 text-right">Current Leave Balance</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
//                 {paginatedEmployees.map((row) => (
//                   <tr key={row._id || row.userId} className="hover:bg-slate-50/50 transition duration-150">
//                     <td className="py-3 px-5">
//                       <div className="font-semibold text-slate-800">{row.name || row.pseudoName}</div>
//                       <div className="text-xs text-slate-400 mt-0.5 font-mono">{row.empId || "-"}</div>
//                     </td>
//                     <td className="py-3 px-4 text-slate-600 font-medium">
//                       {row.pseudoName || row.name || "-"}
//                     </td>
//                     <td className="py-3 px-4">
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
//                         {row.department || "-"}
//                       </span>
//                     </td>
//                     <td className="py-3 px-5 text-right font-bold text-slate-800">
//                       <span className="bg-slate-100 rounded-lg px-3 py-1 text-sm">{row.currentLeaveBalance ?? 0}</span>
//                     </td>
//                   </tr>
//                 ))}
//                 {filteredEmployees.length === 0 && (
//                   <tr>
//                     <td colSpan="4" className="py-8 text-center text-slate-400 italic">
//                       No matching records found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* DYNAMIC PAGINATION CONTROLS FOOTER */}
//           {filteredEmployees.length > 0 && (
//             <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
//               <div className="text-xs font-medium text-slate-500">
//                 Showing <span className="text-slate-700">{employeeStart + 1}</span> to{" "}
//                 <span className="text-slate-700">
//                   {Math.min(employeeStart + employeePageSize, filteredEmployees.length)}
//                 </span>{" "}
//                 of <span className="text-slate-700">{filteredEmployees.length}</span> entries
//               </div>
              
//               <div className="flex items-center gap-1.5">
//                 <button
//                   onClick={() => setEmployeePage((prev) => Math.max(prev - 1, 1))}
//                   disabled={safeEmployeePage === 1}
//                   className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
//                 >
//                   <ChevronLeft className="w-4 h-4" />
//                 </button>

//                 {Array.from({ length: employeeTotalPages }, (_, index) => {
//                   const pageNum = index + 1;
//                   return (
//                     <button
//                       key={pageNum}
//                       onClick={() => setEmployeePage(pageNum)}
//                       className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
//                         safeEmployeePage === pageNum
//                           ? "bg-indigo-600 text-white shadow-sm"
//                           : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
//                       }`}
//                     >
//                       {pageNum}
//                     </button>
//                   );
//                 })}

//                 <button
//                   onClick={() => setEmployeePage((prev) => Math.min(prev + 1, employeeTotalPages))}
//                   disabled={safeEmployeePage === employeeTotalPages}
//                   className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
//                 >
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}
// 	        </div>
//           </>
//         )}

// 	      </div>
      
//       {/* TEXT EXPANSION DIALOG OVERLAY */}
//       {expandedText && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
//           <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
//             <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
//               <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">{expandedText.label}</h3>
//               <button onClick={() => setExpandedText(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition">
//                 <X className="w-4 h-4" />
//               </button>
//             </div>
//             <div className="p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
//               {expandedText.value}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default LeaveManagement;









import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, Check, CheckCircle2, Clock3, Search, ShieldCheck, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "./Navbar.jsx";
import StyledDatePicker from "../components/StyledDatePicker.jsx";
import { getRoleType } from "../utils/roleAccess.js";
import {
  applyLeave,
  applyLeaveOnBehalf,
  clearLeaveMessage,
  fetchAdminLeaveDashboard,
  fetchAdminLeaveRequests,
  fetchMyLeaveRequests,
  fetchTeamLeaveCalendarRequests,
  reviewLeaveRequest,
} from "../features/slices/leaveSlice.js";

const formatDate = (value) => {
  if (!value) return "-";
  const str = String(value);
  if (str.includes('T')) {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return "-";
    d.setHours(d.getHours() + 5.5);
    return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "2-digit" });
  } else {
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      const d = new Date(str);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
    }
    const y = Number(match[1]);
    const m = Number(match[2]) - 1;
    const day = Number(match[3]);
    const d = new Date(Date.UTC(y, m, day));
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
};

const getStatusChipClass = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (key === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  if (key === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

const getLeaveTypeLabel = (leaveType) => {
  const key = String(leaveType || "").trim().toUpperCase();
  if (key === "BL") return "BL (Birthday Leave)";
  if (key === "LWP") return "LWP (Leave Without Pay)";
  if (key === "FL") return "FL (Force Leave)";
  return "Leave";
};

const toDateOnly = (value) => {
  if (!value) return null;
  const str = String(value);
  const plainDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    return new Date(Number(plainDateMatch[1]), Number(plainDateMatch[2]) - 1, Number(plainDateMatch[3]));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const isDateWithinRange = (date, startDate, endDate) => {
  const day = toDateOnly(date);
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!day || !start || !end) return false;
  return day >= start && day <= end;
};

const LeaveManagement = ({ embeddedAdmin = false }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    myRequests,
    adminDashboard,
    adminRequests,
    teamCalendarRequests,
    loadingRequests,
    loadingTeamCalendarRequests,
    applying,
    applyingOnBehalf,
    reviewing,
    error,
    message,
  } = useSelector((state) => state.leave);

  const accountType = String(user?.accountType || "").trim().toLowerCase();
  const roleType = getRoleType(user || {});
  const isSuperAdmin = accountType === "superadmin";
  const isEmployeeAccount = ["employee", "agent", "supervisor"].includes(accountType);
  const isSupervisor = isEmployeeAccount && roleType === "supervisor" && !isSuperAdmin;
  const canViewTeamLeave = isSuperAdmin || isSupervisor;
  const canReviewLeave = isSuperAdmin;

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "L",
    startDate: "",
    endDate: "",
    startSession: "full",
    endSession: "full",
    reason: "",
  });
  const [behalfForm, setBehalfForm] = useState({
    employeeId: "",
    leaveType: "L",
    startDate: "",
    endDate: "",
    startSession: "full",
    endSession: "full",
    reason: "",
  });
  const [behalfEmployeeSearch, setBehalfEmployeeSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(10);
  const [reviewRemarks, setReviewRemarks] = useState({});
  const [expandedText, setExpandedText] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // PAGINATION FOR ADMIN REQUESTS
  const [adminRequestPage, setAdminRequestPage] = useState(1);
  const [adminRequestPageSize, setAdminRequestPageSize] = useState(10);

  // PAGINATION FOR MY LEAVE HISTORY
  const [myHistoryPage, setMyHistoryPage] = useState(1);
  const [myHistoryPageSize, setMyHistoryPageSize] = useState(10);

  useEffect(() => {
    if (!isSuperAdmin) {
      dispatch(fetchMyLeaveRequests());
    }
  }, [dispatch, isSuperAdmin]);

  useEffect(() => {
    if (canViewTeamLeave) {
      dispatch(fetchAdminLeaveDashboard());
    }
  }, [dispatch, canViewTeamLeave]);

  useEffect(() => {
    if (!canViewTeamLeave) return;
    const timer = setTimeout(() => {
      dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
    }, 350);
    return () => clearTimeout(timer);
  }, [dispatch, canViewTeamLeave, requestFilter, search]);

  useEffect(() => {
    if (isSupervisor) {
      dispatch(fetchTeamLeaveCalendarRequests());
    }
  }, [dispatch, isSupervisor]);

  useEffect(() => {
    if (error) toast.error(error);
    if (message) {
      toast.success(message);
      dispatch(clearLeaveMessage());
    }
  }, [dispatch, error, message]);

  // Reset to first page whenever search input text changes
  const handleEmployeeSearchChange = (e) => {
    setEmployeeSearch(e.target.value);
    setEmployeePage(1);
  };

  // Reset admin request page when filter or search changes
  useEffect(() => {
    setAdminRequestPage(1);
  }, [requestFilter, search]);

  // Reset my history page when myRequests changes
  useEffect(() => {
    setMyHistoryPage(1);
  }, [myRequests]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (!String(leaveForm.reason || "").trim() || String(leaveForm.reason || "").trim().length < 5) {
      toast.error("Please enter your leave reason");
      return;
    }

    const result = await dispatch(applyLeave(leaveForm));
    if (applyLeave.fulfilled.match(result)) {
      setLeaveForm((prev) => ({
        ...prev,
        startDate: "",
        endDate: "",
        startSession: "full",
        endSession: "full",
        reason: "",
      }));
      dispatch(fetchMyLeaveRequests());
      if (isSupervisor) {
        dispatch(fetchTeamLeaveCalendarRequests());
      }
    }
  };

  const handleApplyOnBehalf = async (e) => {
    e.preventDefault();
    if (!behalfForm.employeeId) {
      toast.error("Please select an employee");
      return;
    }
    if (!behalfForm.startDate || !behalfForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (!String(behalfForm.reason || "").trim() || String(behalfForm.reason || "").trim().length < 5) {
      toast.error("Please enter leave reason");
      return;
    }

    const result = await dispatch(applyLeaveOnBehalf(behalfForm));
    if (applyLeaveOnBehalf.fulfilled.match(result)) {
      setBehalfForm((prev) => ({
        ...prev,
        employeeId: "",
        startDate: "",
        endDate: "",
        startSession: "full",
        endSession: "full",
        reason: "",
      }));
      setBehalfEmployeeSearch("");
      dispatch(fetchAdminLeaveDashboard());
      dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
    }
  };

  const handleReview = async (row, action) => {
    const rowRemark = String(reviewRemarks[row._id] || "").trim();
    if (action !== "reset" && rowRemark.length < 5) {
      toast.error("Please enter approval/rejection remark");
      return;
    }
    const result = await dispatch(
      reviewLeaveRequest({
        requestId: row._id,
        action,
        comment: rowRemark,
      })
    );
    if (reviewLeaveRequest.fulfilled.match(result)) {
      setReviewRemarks((prev) => ({ ...prev, [row._id]: "" }));
      if (canViewTeamLeave) {
        dispatch(fetchAdminLeaveDashboard());
        dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
      }
    }
  };

  const renderExpandableText = (value, label, widthClass = "w-[160px]") => {
    const text = String(value || "").trim() || "-";
    const canExpand = text !== "-";

    return (
      <span
        onClick={() => canExpand && setExpandedText({ label, value: text })}
        className={`block ${widthClass} truncate text-sm ${
          canExpand ? "cursor-pointer text-slate-700 hover:text-indigo-600 transition" : "text-slate-400"
        }`}
        title={canExpand ? "Click to view full text" : text}
      >
        {text}
      </span>
    );
  };

  const getAppliedByText = (row) => {
    if (row?.appliedOnBehalf || String(row?.appliedBy || "").toLowerCase() === "superadmin") {
      const actor = row?.appliedByUser?.pseudoName || row?.appliedByUser?.realName || row?.appliedByUser?.username || "SuperAdmin";
      return `SuperAdmin (${actor})`;
    }
    return "Employee";
  };

  const stats = adminDashboard?.stats || {};
  
  const baseEmployees = canViewTeamLeave ? adminDashboard?.employees || [] : [];

  const filteredEmployees = baseEmployees.filter(emp => {
    if (!employeeSearch.trim()) return true;
    const searchTerm = employeeSearch.toLowerCase();
    return (
      (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
      (emp.empId && emp.empId.toLowerCase().includes(searchTerm)) ||
      (emp.pseudoName && emp.pseudoName.toLowerCase().includes(searchTerm)) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm))
    );
  });
  const behalfEmployeeOptions = baseEmployees.filter(emp => {
    const searchTerm = behalfEmployeeSearch.trim().toLowerCase();
    if (!searchTerm) return true;
    return (
      (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
      (emp.username && emp.username.toLowerCase().includes(searchTerm)) ||
      (emp.empId && emp.empId.toLowerCase().includes(searchTerm)) ||
      (emp.department && emp.department.toLowerCase().includes(searchTerm))
    );
  });
  
  // EMPLOYEE PAGINATION CALCULATION
  const employeeTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
  const safeEmployeePage = Math.min(employeePage, employeeTotalPages);
  const employeeStart = (safeEmployeePage - 1) * employeePageSize;
  const paginatedEmployees = filteredEmployees.slice(employeeStart, employeeStart + employeePageSize);

  // ADMIN REQUESTS PAGINATION CALCULATION
  const adminRequestsList = adminRequests || [];
  const adminTotalPages = Math.max(1, Math.ceil(adminRequestsList.length / adminRequestPageSize));
  const safeAdminPage = Math.min(adminRequestPage, adminTotalPages);
  const adminStart = (safeAdminPage - 1) * adminRequestPageSize;
  const paginatedAdminRequests = adminRequestsList.slice(adminStart, adminStart + adminRequestPageSize);

  // MY LEAVE HISTORY PAGINATION CALCULATION
  const myRequestsList = myRequests || [];
  const myTotalPages = Math.max(1, Math.ceil(myRequestsList.length / myHistoryPageSize));
  const safeMyPage = Math.min(myHistoryPage, myTotalPages);
  const myStart = (safeMyPage - 1) * myHistoryPageSize;
  const paginatedMyRequests = myRequestsList.slice(myStart, myStart + myHistoryPageSize);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarMonthLabel = calendarMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const monthStart = new Date(calendarYear, calendarMonthIndex, 1);
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const leadingBlankDays = monthStart.getDay();
  const calendarCells = [
    ...Array.from({ length: leadingBlankDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(calendarYear, calendarMonthIndex, index + 1)),
  ];
  const visibleTeamCalendarRequests = (teamCalendarRequests || []).filter((row) =>
    ["approved", "pending"].includes(String(row?.status || "").toLowerCase())
  );
  const getCalendarDayRequests = (date) =>
    visibleTeamCalendarRequests.filter((row) => isDateWithinRange(date, row.startDate, row.endDate));
  const moveCalendarMonth = (offset) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 antialiased font-sans">
      {!embeddedAdmin && <Navbar />}
      
      <div className="max-w-[1500px] mx-auto p-4 md:p-6 lg:p-8 space-y-7">
      
        {!isSuperAdmin && (
          <div className={isSupervisor ? "grid grid-cols-1 gap-5 xl:grid-cols-2" : "w-full xl:w-1/2"}>
          <form onSubmit={handleApply} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Apply Leave</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                >
                  <option value="L">Leave</option>
                  <option value="BL">BL (Birthday Leave)</option>
                  <option value="LWP">LWP (Leave Without Pay)</option>
                  <option value="FL">FL (Force Leave)</option> {/* FL ADDED */}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                <div className="mt-1">
                  <StyledDatePicker
                    value={leaveForm.startDate}
                    onChange={(value) => setLeaveForm((prev) => ({ ...prev, startDate: value }))}
                    placeholder="Select start date"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Session</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={leaveForm.startSession}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, startSession: e.target.value }))}
                >
                  <option value="full">Full Day</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                <div className="mt-1">
                  <StyledDatePicker
                    value={leaveForm.endDate}
                    onChange={(value) => setLeaveForm((prev) => ({ ...prev, endDate: value }))}
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Session</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={leaveForm.endSession}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, endSession: e.target.value }))}
                >
                  <option value="full">Full Day</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Clearly mention reason for leave"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={applying}
              className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applying ? "Submitting..." : "Submit Leave Request"}
            </button>
          </form>
              {isSupervisor && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-800">Team Leave Calendar</h2>
                        <p className="text-xs text-slate-500">Approved and pending team leave by date</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveCalendarMonth(-1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        title="Previous month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="min-w-[130px] text-center text-sm font-semibold text-slate-800">
                        {calendarMonthLabel}
                      </div>
                      <button
                        type="button"
                        onClick={() => moveCalendarMonth(1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        title="Next month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {calendarCells.map((date, index) => {
                      if (!date) {
                        return <div key={`blank-${index}`} className="min-h-[78px] rounded-lg bg-slate-50/60" />;
                      }
                      const dayRequests = getCalendarDayRequests(date);
                      const isToday = toDateOnly(new Date())?.getTime() === date.getTime();

                      return (
                        <div
                          key={date.toISOString()}
                          className={`min-h-[78px] rounded-lg border p-1.5 text-left ${
                            dayRequests.length
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-100 bg-white"
                          } ${isToday ? "ring-2 ring-indigo-200" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${isToday ? "text-indigo-700" : "text-slate-700"}`}>
                              {date.getDate()}
                            </span>
                            {dayRequests.length > 0 && (
                              <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {dayRequests.length}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            {dayRequests.slice(0, 2).map((row) => (
                              <div
                                key={`${row._id}-${date.toISOString()}`}
                                className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  row.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                                title={`${row.userId?.pseudoName || row.userId?.realName || row.userId?.username || "Employee"} - ${getLeaveTypeLabel(row.leaveType)} (${row.status})`}
                              >
                                {row.userId?.pseudoName || row.userId?.realName || row.userId?.username || "Employee"}
                              </div>
                            ))}
                            {dayRequests.length > 2 && (
                              <div className="text-[10px] font-medium text-slate-500">+{dayRequests.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {loadingTeamCalendarRequests ? (
                    <p className="mt-3 text-xs text-slate-500">Loading team leave calendar...</p>
                  ) : visibleTeamCalendarRequests.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-500">No approved or pending team leave found.</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Pending</span>
                    </div>
                  )}
                </div>
              )}
            </div>
        )}

        {!isSuperAdmin && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock3 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">My Leave History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-4">Session</th>
                    <th className="py-3 px-4 whitespace-nowrap">Date Range</th>
                    <th className="py-3 px-4 w-[180px]">Leave Reason</th>
                    <th className="py-3 px-4">Applied By</th>
                    <th className="py-3 px-4 text-center">Requested</th>
                    <th className="py-3 px-4 text-center">Charged</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5">Reviewed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedMyRequests.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-3.5 px-5 font-semibold text-slate-800">{getLeaveTypeLabel(row.leaveType)}</td>
                      <td className="py-3.5 px-4 text-slate-600 capitalize">
                        {String(row.startSession || "full").replace("_", " ")} to {String(row.endSession || "full").replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-700">{formatDate(row.startDate)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{formatDate(row.endDate)}</div>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        {renderExpandableText(row.reason, "Leave Reason")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {getAppliedByText(row)}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700">{row.requestedDays ?? "-"}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{row.chargedDays ?? "-"}</td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusChipClass(row.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                          {row.status || "pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">
                        {row.reviewedBy?.pseudoName || row.reviewedBy?.realName || row.reviewedBy?.username || "-"}
                        {row.reviewedAt ? <div className="text-xs text-slate-400 mt-0.5">{formatDate(row.reviewedAt)}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loadingRequests && myRequestsList.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400 italic">No leave requests yet.</p>
              )}
            </div>

            {/* PAGINATION FOR MY LEAVE HISTORY */}
            {myRequestsList.length > 0 && (
              <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-medium text-slate-500">
                  Showing <span className="text-slate-700">{myStart + 1}</span> to{" "}
                  <span className="text-slate-700">
                    {Math.min(myStart + myHistoryPageSize, myRequestsList.length)}
                  </span>{" "}
                  of <span className="text-slate-700">{myRequestsList.length}</span> entries
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMyHistoryPage((prev) => Math.max(prev - 1, 1))}
                    disabled={safeMyPage === 1}
                    className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: myTotalPages }, (_, index) => {
                    const pageNum = index + 1;
                    if (myTotalPages <= 7) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setMyHistoryPage(pageNum)}
                          className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
                            safeMyPage === pageNum
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 1 || pageNum === myTotalPages || Math.abs(pageNum - safeMyPage) <= 1) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setMyHistoryPage(pageNum)}
                          className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
                            safeMyPage === pageNum
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 2 && safeMyPage > 3) {
                      return <span key="ellipsis-start" className="text-slate-400">…</span>;
                    }
                    if (pageNum === myTotalPages - 1 && safeMyPage < myTotalPages - 2) {
                      return <span key="ellipsis-end" className="text-slate-400">…</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setMyHistoryPage((prev) => Math.min(prev + 1, myTotalPages))}
                    disabled={safeMyPage === myTotalPages}
                    className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {canViewTeamLeave && (
          <>
        {/* STATS ANALYTICS CARDS */}
        {isSuperAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Employees</p>
              <p className="text-3xl font-bold text-slate-800 mt-1.5">{stats.totalEmployees ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</p>
              <p className="text-3xl font-bold text-amber-600 mt-1.5">{stats.pendingRequests ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock3 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Requests</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1.5">{stats.approvedRequests ?? 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          </div>
        )}

        {isSuperAdmin && (
          <form onSubmit={handleApplyOnBehalf} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Apply Leave for Employee</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Employee</label>
                <div className="relative mt-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={behalfEmployeeSearch}
                    onChange={(e) => setBehalfEmployeeSearch(e.target.value)}
                    placeholder="Name, employee ID, department..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={behalfForm.employeeId}
                  onChange={(e) => setBehalfForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                >
                  <option value="">Select employee</option>
                  {behalfEmployeeOptions.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {(emp.name || emp.username || "Employee")} {emp.empId ? `(${emp.empId})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Type</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={behalfForm.leaveType}
                  onChange={(e) => setBehalfForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                >
                  <option value="L">Leave</option>
                  <option value="BL">BL (Birthday Leave)</option>
                  <option value="LWP">LWP (Leave Without Pay)</option>
                  <option value="FL">FL (Force Leave)</option> {/* FL ADDED */}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
                <div className="mt-1">
                  <StyledDatePicker
                    value={behalfForm.startDate}
                    onChange={(value) => setBehalfForm((prev) => ({ ...prev, startDate: value }))}
                    placeholder="Select start date"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Session</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={behalfForm.startSession}
                  onChange={(e) => setBehalfForm((prev) => ({ ...prev, startSession: e.target.value }))}
                >
                  <option value="full">Full Day</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
                <div className="mt-1">
                  <StyledDatePicker
                    value={behalfForm.endDate}
                    onChange={(value) => setBehalfForm((prev) => ({ ...prev, endDate: value }))}
                    placeholder="Select end date"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">End Session</label>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={behalfForm.endSession}
                  onChange={(e) => setBehalfForm((prev) => ({ ...prev, endSession: e.target.value }))}
                >
                  <option value="full">Full Day</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason / Remarks</label>
                <input
                  type="text"
                  value={behalfForm.reason}
                  onChange={(e) => setBehalfForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Clearly mention reason for leave"
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={applyingOnBehalf}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyingOnBehalf ? "Submitting..." : "Submit Leave for Employee"}
            </button>
          </form>
        )}

        {/* SECTION: LEAVE REQUESTS QUEUE */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">
                {isSupervisor ? "Team Leave Requests" : "Leave Requests Queue"}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
              
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name or ID..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4 whitespace-nowrap">Date Range</th>
                  <th className="py-3 px-4 w-[180px]">Leave Reason</th>
                  <th className="py-3 px-4">Applied By</th>
                  <th className="py-3 px-4 text-center">Charged</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Reviewed By</th>
                  <th className="py-3 px-4 w-[200px]">Decision Remark</th>
                  {canReviewLeave && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedAdminRequests.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/50 transition duration-150 group">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800">{row.userId?.pseudoName || row.userId?.username || "Employee"}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{row.userId?.empId || "-"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-semibold">{getLeaveTypeLabel(row.leaveType)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 capitalize">
                      {String(row.startSession || "full").replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{formatDate(row.startDate)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{formatDate(row.endDate)}</div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      {renderExpandableText(row.reason, "Leave Reason")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {getAppliedByText(row)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{row.chargedDays}</td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusChipClass(row.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {row.reviewedBy?.pseudoName || "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      {canReviewLeave && row.status === "pending" ? (
                        <input
                          type="text"
                          value={reviewRemarks[row._id] || ""}
                          onChange={(e) => setReviewRemarks((prev) => ({ ...prev, [row._id]: e.target.value }))}
                          placeholder="Type review remark..."
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-slate-50/50 rounded-md text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      ) : (
                        renderExpandableText(row.reviewComment, "Decision Remark")
                      )}
                    </td>
                    {canReviewLeave && (
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {row.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReview(row, "approve")}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-md transition shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReview(row, "reject")}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium text-xs rounded-md transition"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : isSuperAdmin && ["approved", "rejected"].includes(String(row.status || "").toLowerCase()) ? (
                        <button
                          onClick={() => handleReview(row, "reset")}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-md transition"
                        >
                          Reset
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Processed</span>
                      )}
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
              {adminRequestsList.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400 italic">
                  No requests found for selected filters.
                </p>
              )}
          </div>

          {/* PAGINATION FOR ADMIN REQUESTS */}
          {adminRequestsList.length > 0 && (
            <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-medium text-slate-500">
                Showing <span className="text-slate-700">{adminStart + 1}</span> to{" "}
                <span className="text-slate-700">
                  {Math.min(adminStart + adminRequestPageSize, adminRequestsList.length)}
                </span>{" "}
                of <span className="text-slate-700">{adminRequestsList.length}</span> entries
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAdminRequestPage((prev) => Math.max(prev - 1, 1))}
                  disabled={safeAdminPage === 1}
                  className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: adminTotalPages }, (_, index) => {
                  const pageNum = index + 1;
                  if (adminTotalPages <= 7) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setAdminRequestPage(pageNum)}
                        className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
                          safeAdminPage === pageNum
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === 1 || pageNum === adminTotalPages || Math.abs(pageNum - safeAdminPage) <= 1) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setAdminRequestPage(pageNum)}
                        className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
                          safeAdminPage === pageNum
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === 2 && safeAdminPage > 3) {
                    return <span key="ellipsis-start" className="text-slate-400">…</span>;
                  }
                  if (pageNum === adminTotalPages - 1 && safeAdminPage < adminTotalPages - 2) {
                    return <span key="ellipsis-end" className="text-slate-400">…</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => setAdminRequestPage((prev) => Math.min(prev + 1, adminTotalPages))}
                  disabled={safeAdminPage === adminTotalPages}
                  className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION: BALANCE MATRIX ACCORDION */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">
                {isSupervisor ? "Team Remaining Leave" : "Current Leave Balance"}
              </h2>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={employeeSearch}
                onChange={handleEmployeeSearchChange}
                placeholder="Quick filter team..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-5">Employee Name</th>
                  <th className="py-3 px-4">Pseudo Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-5 text-right">Current Leave Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedEmployees.map((row) => (
                  <tr key={row._id || row.userId} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{row.name || row.pseudoName}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{row.empId || "-"}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {row.pseudoName || row.name || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                        {row.department || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-bold text-slate-800">
                      <span className="bg-slate-100 rounded-lg px-3 py-1 text-sm">{row.currentLeaveBalance ?? 0}</span>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 italic">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* DYNAMIC PAGINATION CONTROLS FOOTER */}
          {filteredEmployees.length > 0 && (
            <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-medium text-slate-500">
                Showing <span className="text-slate-700">{employeeStart + 1}</span> to{" "}
                <span className="text-slate-700">
                  {Math.min(employeeStart + employeePageSize, filteredEmployees.length)}
                </span>{" "}
                of <span className="text-slate-700">{filteredEmployees.length}</span> entries
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setEmployeePage((prev) => Math.max(prev - 1, 1))}
                  disabled={safeEmployeePage === 1}
                  className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: employeeTotalPages }, (_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setEmployeePage(pageNum)}
                      className={`inline-flex items-center justify-center min-w-[32px] h-8 text-xs font-semibold rounded-md transition ${
                        safeEmployeePage === pageNum
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setEmployeePage((prev) => Math.min(prev + 1, employeeTotalPages))}
                  disabled={safeEmployeePage === employeeTotalPages}
                  className="inline-flex items-center justify-center p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

      </div>
      
      {/* TEXT EXPANSION DIALOG OVERLAY */}
      {expandedText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">{expandedText.label}</h3>
              <button onClick={() => setExpandedText(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto">
              {expandedText.value}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;