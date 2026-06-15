

// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { CalendarDays, CheckCircle2, Clock3, Eye, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
// import { toast } from "react-toastify";
// import Navbar from "./Navbar.jsx";
// import StyledDatePicker from "../components/StyledDatePicker.jsx";
// import {
//   applyLeave,
//   clearLeaveMessage,
//   fetchAdminLeaveDashboard,
//   fetchAdminLeaveRequests,
//   fetchMyLeaveRequests,
//   fetchMyLeaveSummary,
//   reviewLeaveRequest,
// } from "../features/slices/leaveSlice.js";

// const formatDate = (value) => {
//   if (!value) return "-";
//   const str = String(value);
//   if (str.includes('T')) {
//     // ISO string, adjust for IST
//     const d = new Date(str);
//     if (Number.isNaN(d.getTime())) return "-";
//     d.setHours(d.getHours() + 5.5);
//     return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "2-digit" });
//   } else {
//     // Assume YYYY-MM-DD or other
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
//   if (key === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
//   if (key === "rejected") return "bg-rose-100 text-rose-700 border-rose-200";
//   if (key === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
//   return "bg-slate-100 text-slate-700 border-slate-200";
// };

// const STATUS_PREVIEW_ORDER = ["pending", "approved", "rejected"];

// const getStatusPreviewMeta = (key) => {
//   if (key === "approved") {
//     return {
//       label: "Approved",
//       Icon: CheckCircle2,
//       circleClass: "border-emerald-300 bg-emerald-500 text-white",
//       mutedCircleClass: "border-emerald-200 bg-white text-emerald-300",
//       ringClass: "ring-emerald-100",
//       cardClass: "border-emerald-300 bg-emerald-100",
//       accentCardClass: "border-emerald-300 bg-emerald-200 text-emerald-900",
//       mutedCardClass: "border-emerald-300 bg-emerald-100",
//       mutedAccentCardClass: "border-emerald-300 bg-emerald-200 text-emerald-700",
//       subCardClass: "border-emerald-200 bg-emerald-50 text-slate-700",
//       mutedBadgeClass: "border-emerald-200 bg-white text-emerald-600",
//       connectorClass: "bg-emerald-300",
//     };
//   }

//   if (key === "rejected") {
//     return {
//       label: "Rejected",
//       Icon: XCircle,
//       circleClass: "border-rose-300 bg-rose-500 text-white",
//       mutedCircleClass: "border-rose-200 bg-white text-rose-300",
//       ringClass: "ring-rose-100",
//       cardClass: "border-rose-300 bg-rose-100",
//       accentCardClass: "border-rose-300 bg-rose-200 text-rose-900",
//       mutedCardClass: "border-rose-300 bg-rose-100",
//       mutedAccentCardClass: "border-rose-300 bg-rose-200 text-rose-700",
//       subCardClass: "border-rose-200 bg-rose-50 text-slate-700",
//       mutedBadgeClass: "border-rose-200 bg-white text-rose-600",
//       connectorClass: "bg-rose-300",
//     };
//   }

//   return {
//     label: "Pending",
//     Icon: Clock3,
//     circleClass: "border-amber-300 bg-amber-400 text-slate-900",
//     mutedCircleClass: "border-amber-200 bg-white text-amber-300",
//     ringClass: "ring-amber-100",
//     cardClass: "border-amber-300 bg-amber-100",
//     accentCardClass: "border-amber-300 bg-amber-200 text-amber-900",
//     mutedCardClass: "border-amber-300 bg-amber-100",
//     mutedAccentCardClass: "border-amber-300 bg-amber-200 text-amber-700",
//     subCardClass: "border-amber-200 bg-amber-50 text-slate-700",
//     mutedBadgeClass: "border-amber-200 bg-white text-amber-600",
//     connectorClass: "bg-amber-300",
//   };
// };

// const formatDateTime = (value) => {
//   if (!value) return "-";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "-";
//   return date.toLocaleString("en-IN", {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//     month: "short",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const LeaveManagement = ({ embeddedAdmin = false }) => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const {
//     mySummary,
//     myRequests,
//     adminDashboard,
//     adminRequests,
//     loadingSummary,
//     loadingRequests,
//     loadingAdminDashboard,
//     loadingAdminRequests,
//     applying,
//     reviewing,
//     error,
//     message,
//   } = useSelector((state) => state.leave);

//   const isAdminView = ["HR", "superAdmin", "admin"].includes(user?.accountType);
//   const isSuperAdmin = user?.accountType === "superAdmin";
//   const [leaveForm, setLeaveForm] = useState({
//     leaveType: "EL",
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
//   const [statusPreview, setStatusPreview] = useState(null);

//   useEffect(() => {
//     if (isAdminView) {
//       dispatch(fetchAdminLeaveDashboard());
//       dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
//     } else {
//       dispatch(fetchMyLeaveSummary());
//       dispatch(fetchMyLeaveRequests());
//     }
//   }, [dispatch, isAdminView]);

//   useEffect(() => {
//     if (!isAdminView) return;
//     const timer = setTimeout(() => {
//       dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
//     }, 350);
//     return () => clearTimeout(timer);
//   }, [dispatch, isAdminView, requestFilter, search]);

//   useEffect(() => {
//     if (error) toast.error(error);
//     if (message) {
//       toast.success(message);
//       dispatch(clearLeaveMessage());
//     }
//   }, [dispatch, error, message]);

//   useEffect(() => {
//     setEmployeePage(1);
//   }, [employeeSearch, employeePageSize]);

//   const summaryStats = mySummary?.stats || {};
//   const config = mySummary?.config || adminDashboard?.config || {};

//   const handleApply = async (e) => {
//     e.preventDefault();
//     if (!leaveForm.startDate || !leaveForm.endDate) {
//       toast.error("Please select start and end dates");
//       return;
//     }
//     if (!String(leaveForm.reason || "").trim() || String(leaveForm.reason || "").trim().length < 5) {
//       toast.error("Please enter your leave reason ");
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
//       dispatch(fetchMyLeaveSummary());
//       dispatch(fetchMyLeaveRequests());
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
//       dispatch(fetchAdminLeaveDashboard());
//       dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
//     }
//   };

//   const renderExpandableText = (value, label, widthClass = "w-[180px]") => {
//     const text = String(value || "").trim() || "-";
//     const canExpand = text !== "-";

//     return (
//       <button
//         type="button"
//         onClick={() => canExpand && setExpandedText({ label, value: text })}
//         className={`block ${widthClass} truncate text-left ${
//           canExpand ? "cursor-pointer text-slate-700 hover:text-blue-700 hover:underline" : "cursor-default text-slate-500"
//         }`}
//         title={canExpand ? "Click to view full text" : text}
//       >
//         {text}
//       </button>
//     );
//   };

//   const openStatusPreview = (row) => {
//     const currentStatus = String(row?.status || "pending").trim().toLowerCase();
//     const requesterName =
//       row?.userId?.pseudoName ||
//       row?.userId?.realName ||
//       row?.userId?.username ||
//       user?.pseudoName ||
//       user?.realName ||
//       user?.username ||
//       "-";
//     const reviewerName =
//       row?.reviewedBy?.pseudoName ||
//       row?.reviewedBy?.realName ||
//       row?.reviewedBy?.username ||
//       "-";
//     const leaveReason = String(row?.reason || "").trim() || "-";

//     const visibleKeys = ["pending"];
//     if (currentStatus === "approved") visibleKeys.push("approved");
//     if (currentStatus === "rejected") visibleKeys.push("rejected");

//     setStatusPreview({
//       activeKey: currentStatus === "approved" || currentStatus === "rejected" ? currentStatus : "pending",
//       currentKey: currentStatus === "approved" || currentStatus === "rejected" ? currentStatus : "pending",
//       visibleKeys,
//       sections: {
//         pending: {
//           title: "Pending Status",
//           status: "pending",
//           actionLabel: "Pending Since",
//           actionDate: formatDateTime(row?.createdAt),
//           nameLabel: "Name",
//           nameValue: requesterName,
//           detailLabel: "Leave Reason",
//           detailValue: leaveReason,
//         },
//         approved: {
//           title: "Approved Status",
//           status: "approved",
//           actionLabel: "Approved On",
//           actionDate: currentStatus === "approved" ? formatDateTime(row?.reviewedAt) : "-",
//           actorLabel: "Approved By",
//           actor: currentStatus === "approved" ? reviewerName : "-",
//           detailLabel: "Decision Remark",
//           detailValue:
//             currentStatus === "approved"
//               ? String(row?.reviewComment || "").trim() || "-"
//               : "-",
//         },
//         rejected: {
//           title: "Rejected Status",
//           status: "rejected",
//           actionLabel: "Rejected On",
//           actionDate: currentStatus === "rejected" ? formatDateTime(row?.reviewedAt) : "-",
//           actorLabel: "Rejected By",
//           actor: currentStatus === "rejected" ? reviewerName : "-",
//           detailLabel: "Decision Remark",
//           detailValue:
//             currentStatus === "rejected"
//               ? String(row?.reviewComment || "").trim() || "-"
//               : "-",
//         },
//       },
//     });
//   };

//   const renderEmployeeView = () => (
//     <div className="min-h-screen crm-page">
//       {!embeddedAdmin ? <Navbar /> : null}
//       <div className={`${!embeddedAdmin ? "pt-0" : "pt-0"} px-4 md:px-6 pb-10`}>
//         <div className="max-w-[1300px] mx-auto space-y-6">
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
//             <form onSubmit={handleApply} className="xl:col-span-2 crm-card p-5">
//               <div className="flex items-center gap-2 crm-title">
//                 <CalendarDays className="w-5 h-5 text-blue-600" />
//                 Apply Leave
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//                 <div>
//                   <label className="text-xs font-semibold crm-muted">Leave Type</label>
//                   <select
//                     className="mt-1 crm-select"
//                     value={leaveForm.leaveType}
//                     onChange={(e) => setLeaveForm((p) => ({ ...p, leaveType: e.target.value }))}
//                   >
//                     <option value="EL">EL</option>
//                     <option value="CL">CL</option>
//                     <option value="ML">SL</option>
//                     <option value="LWP">LWP</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-semibold crm-muted">Start Date</label>
//                   <div className="mt-1">
//                     <StyledDatePicker
//                       value={leaveForm.startDate}
//                       onChange={(value) => setLeaveForm((p) => ({ ...p, startDate: value }))}
//                       placeholder="Select start date"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-xs font-semibold crm-muted">Start Session</label>
//                   <select
//                     className="mt-1 crm-select"
//                     value={leaveForm.startSession}
//                     onChange={(e) => setLeaveForm((p) => ({ ...p, startSession: e.target.value }))}
//                   >
//                     <option value="full">Full Day</option>
//                     <option value="first_half">First Half</option>
//                     <option value="second_half">Second Half</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-semibold crm-muted">End Date</label>
//                   <div className="mt-1">
//                     <StyledDatePicker
//                       value={leaveForm.endDate}
//                       onChange={(value) => setLeaveForm((p) => ({ ...p, endDate: value }))}
//                       placeholder="Select end date"
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label className="text-xs font-semibold crm-muted">End Session</label>
//                   <select
//                     className="mt-1 crm-select"
//                     value={leaveForm.endSession}
//                     onChange={(e) => setLeaveForm((p) => ({ ...p, endSession: e.target.value }))}
//                   >
//                     <option value="full">Full Day</option>
//                     <option value="first_half">First Half</option>
//                     <option value="second_half">Second Half</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-semibold crm-muted">Reason</label>
//                   <input
//                     type="text"
//                     value={leaveForm.reason}
//                     onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
//                     placeholder="Clearly mention reason for leave"
//                     className="mt-1 crm-input"
//                   />
//                 </div>
//               </div>
//               <p className="mt-3 text-xs crm-muted">
//                 Example: Mon (full) to Wed (first half) = 2.5 days. Single-day half leave: set same date and choose first/second half.
//               </p>
//               <button
//                 type="submit"
//                 disabled={applying}
//                 className="mt-4 w-full py-2.5 crm-btn-primary disabled:opacity-50"
//               >
//                 {applying ? "Submitting..." : "Submit Leave Request"}
//               </button>
//             </form>

//             <div className="crm-card p-5">
//               <div className="flex items-center gap-2 crm-title">
//                 <ShieldCheck className="w-5 h-5 text-emerald-600" />
//                 Eligibility
//               </div>
//               <div className="mt-4 space-y-3 text-sm">
//                 <div className="crm-soft-card p-3">
//                   <p className="crm-muted">Pending Requests</p>
//                   <p className="text-xl font-semibold">{summaryStats.pendingRequests ?? 0}</p>
//                 </div>
//                 <div className="crm-soft-card p-3">
//                   <p className="crm-muted">Probation Status</p>
//                   <p className="font-semibold">
//                     {summaryStats.probationCompleted ? "Passed" : "Under 90-Day Probation"}
//                   </p>
//                   <p className="text-xs crm-muted mt-1">Ends: {formatDate(summaryStats.probationEndDate)}</p>
//                 </div>
//                 <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
//                   One-time approval limit: {config?.APPROVAL_MAX_DAYS ?? 6} days
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="crm-card p-5">
//             <div className="flex items-center gap-2 crm-title mb-4">
//               <Clock3 className="w-5 h-5 text-violet-600" />
//               My Leave History
//             </div>
//             <div className="overflow-x-auto">
//               <table className="crm-table text-sm">
//                 <thead>
// 	                    <tr className="text-left text-slate-500 border-b">
// 	                      <th className="py-2 pr-4">Type</th>
// 	                      <th className="py-2 pr-4">Session</th>
// 	                      <th className="py-2 pr-4">Date Range</th>
//                       <th className="py-2 pr-4 w-[180px]">Leave Reason</th>
// 	                      <th className="py-2 pr-4">Requested</th>
// 	                      <th className="py-2 pr-4">Sandwich</th>
//                       <th className="py-2 pr-4">Charged</th>
//                       <th className="py-2 pr-4">Status</th>
//                       <th className="py-2 pr-4">Reviewed By</th>
//                       <th className="py-2 pr-0 text-center w-[56px]">View</th>
// 	                    </tr>
//                 </thead>
//                 <tbody>
//                   {(myRequests || []).map((row) => (
//                     <tr key={row._id} className="border-b border-slate-100">
//                       <td className="py-2 pr-4 font-medium text-slate-800">{row.leaveType}</td>
//                       <td className="py-2 pr-4 text-slate-600">
//                         {String(row.startSession || "full").replace("_", " ")} → {String(row.endSession || "full").replace("_", " ")}
//                       </td>
// 	                      <td className="py-2 pr-4 text-slate-600">
// 	                        {formatDate(row.startDate)} - {formatDate(row.endDate)}
// 	                      </td>
//                         <td className="py-2 pr-4 text-slate-700 align-top">
//                           {renderExpandableText(row.reason, "Leave Reason")}
//                         </td>
// 	                      <td className="py-2 pr-4 text-slate-700">{row.requestedDays}</td>
// 	                      <td className="py-2 pr-4 text-slate-700">{row.sandwichDays}</td>
// 	                      <td className="py-2 pr-4 text-slate-700">{row.chargedDays}</td>
//                       <td className="py-2 pr-4">
//                         <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.status)}`}>
// 	                          {row.status}
// 	                        </span>
// 	                      </td>
//                         <td className="py-2 pr-4 text-slate-600">
//                           {row.reviewedBy?.pseudoName || row.reviewedBy?.realName || row.reviewedBy?.username || "-"}
//                           {row.reviewedAt ? (
//                             <div className="text-xs text-slate-500">{formatDate(row.reviewedAt)}</div>
//                           ) : null}
//                         </td>
//                         <td className="py-2 pr-0 text-center">
//                           <button
//                             type="button"
//                             onClick={() => openStatusPreview(row)}
//                             className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
//                             title="View leave status details"
//                           >
//                             <Eye className="h-4 w-4" />
//                           </button>
//                         </td>
// 	                    </tr>
// 	                  ))}
//                 </tbody>
//               </table>
//               {!loadingRequests && (myRequests || []).length === 0 ? (
//                 <p className="text-sm crm-muted py-4">No leave requests yet.</p>
//               ) : null}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const renderAdminView = () => {
//     const stats = adminDashboard?.stats || {};
//     const employees = adminDashboard?.employees || [];
    
//     const filteredEmployees = employees.filter(emp => {
//       if (!employeeSearch.trim()) return true;
//       const searchTerm = employeeSearch.toLowerCase();
//       return (
//         (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
//         (emp.empId && emp.empId.toLowerCase().includes(searchTerm)) ||
//         (emp.username && emp.username.toLowerCase().includes(searchTerm))
//       );
//     });
//     const employeeTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
//     const safeEmployeePage = Math.min(employeePage, employeeTotalPages);
//     const employeeStart = (safeEmployeePage - 1) * employeePageSize;
//     const paginatedEmployees = filteredEmployees.slice(employeeStart, employeeStart + employeePageSize);

//     return (
//       <div className="crm-page min-h-screen">
//         <div className="pt-6 px-4 md:px-6 pb-10">
//           <div className="max-w-[1400px] mx-auto space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="crm-card p-4">
//                 <p className="text-xs uppercase tracking-wide crm-muted">Total Employees</p>
//                 <p className="text-3xl font-semibold mt-1">{stats.totalEmployees ?? 0}</p>
//               </div>
//               <div className="crm-card p-4">
//                 <p className="text-xs uppercase tracking-wide crm-muted">Pending Requests</p>
//                 <p className="text-3xl font-semibold text-amber-600 mt-1">{stats.pendingRequests ?? 0}</p>
//               </div>
//               <div className="crm-card p-4">
//                 <p className="text-xs uppercase tracking-wide crm-muted">Approved Requests</p>
//                 <p className="text-3xl font-semibold text-emerald-600 mt-1">{stats.approvedRequests ?? 0}</p>
//               </div>
//             </div>

//             <div className="crm-card p-5">
//               <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
//                 <div className="flex items-center gap-2 crm-title">
//                   <Clock3 className="w-5 h-5 text-blue-600" />
//                   Leave Requests Queue
//                 </div>
//                 <div className="flex flex-col sm:flex-row gap-2">
//                   <select
//                     value={requestFilter}
//                     onChange={(e) => setRequestFilter(e.target.value)}
//                     className="crm-select text-sm"
//                   >
//                     <option value="pending">Pending</option>
//                     <option value="approved">Approved</option>
//                     <option value="rejected">Rejected</option>
//                     <option value="all">All</option>
//                   </select>
//                   <div className="relative">
//                     <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
//                     <input
//                       value={search}
//                       onChange={(e) => setSearch(e.target.value)}
//                       placeholder="Search employee"
//                       className="crm-input pl-9 pr-3 py-2 text-sm"
//                     />
//                   </div>
//                 </div>
//               </div>
//               <div className="overflow-x-auto mt-4">
//                 <table className="crm-table text-sm">
//                   <thead>
// 	                    <tr className="text-left text-slate-500 border-b"> 
// 	                      <th className="py-2 pr-4">Employee</th>
// 	                      <th className="py-2 pr-4">Type</th>
// 	                      <th className="py-2 pr-4">Session</th>
// 	                      <th className="py-2 pr-4">Date Range</th>
//                       <th className="py-2 pr-4 w-[180px]">Leave Reason</th>
// 	                      <th className="py-2 pr-4">Charged</th>
// 	                      <th className="py-2 pr-4">Status</th>
//                       <th className="py-2 pr-4">Reviewed By</th>
//                       <th className="py-2 pr-4 w-[180px]">Decision Remark</th>
// 	                      <th className="py-2 pr-4">Actions</th>
// 	                    </tr>
//                   </thead>
//                   <tbody>
//                     {(adminRequests || []).map((row) => (
//                       <tr key={row._id} className="border-b border-slate-100">
//                         <td className="py-2 pr-4">
//                           <div className="font-medium text-slate-800">{row.userId?.pseudoName || row.userId?.username}</div>
//                           <div className="text-xs text-slate-500">{row.userId?.empId || row.userId?.username}</div>
//                         </td>
//                         <td className="py-2 pr-4 text-slate-700">{row.leaveType}</td>
//                         <td className="py-2 pr-4 text-slate-600">
//                           {String(row.startSession || "full").replace("_", " ")} → {String(row.endSession || "full").replace("_", " ")}
//                         </td>
// 	                        <td className="py-2 pr-4 text-slate-600">
// 	                          {formatDate(row.startDate)} - {formatDate(row.endDate)}
// 	                        </td>
//                           <td className="py-2 pr-4 text-slate-700 align-top">
//                             {renderExpandableText(row.reason, "Leave Reason")}
//                           </td>
// 	                        <td className="py-2 pr-4 text-slate-700">{row.chargedDays}</td>
// 	                        <td className="py-2 pr-4">
//                           <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.status)}`}>
// 	                            {row.status}
// 	                          </span>
// 	                        </td>
//                           <td className="py-2 pr-4 text-slate-600">
//                             {row.reviewedBy?.pseudoName || row.reviewedBy?.realName || row.reviewedBy?.username || "-"}
//                             {row.reviewedAt ? (
//                               <div className="text-xs text-slate-500">{formatDate(row.reviewedAt)}</div>
//                             ) : null}
//                           </td>
//                           <td className="py-2 pr-4 text-slate-700 align-top">
//                             {renderExpandableText(row.reviewComment, "Decision Remark")}
//                           </td>
// 	                        <td className="py-2 pr-4">
// 	                          {row.status === "pending" ? (
// 	                            <div className="flex flex-col gap-2 min-w-[240px]">
//                                 <input
//                                   value={reviewRemarks[row._id] || ""}
//                                   onChange={(e) =>
//                                     setReviewRemarks((prev) => ({ ...prev, [row._id]: e.target.value }))
//                                   }
//                                   placeholder="Remark for approve/reject"
//                                   className="crm-input py-1.5 text-xs"
//                                 />
//                                 <div className="flex items-center gap-2">
// 	                              <button
// 	                                onClick={() => handleReview(row, "approve")}
// 	                                disabled={reviewing}
//                                 className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1.5 text-xs hover:bg-emerald-700 disabled:opacity-50"
//                               >
//                                 <CheckCircle2 className="w-3.5 h-3.5" />
//                                 Approve
//                               </button>
//                               <button
//                                 onClick={() => handleReview(row, "reject")}
//                                 disabled={reviewing}
//                                 className="inline-flex items-center gap-1 rounded-lg bg-rose-600 text-white px-2.5 py-1.5 text-xs hover:bg-rose-700 disabled:opacity-50"
//                               >
// 	                                <XCircle className="w-3.5 h-3.5" />
// 	                                Reject
// 	                              </button>
//                                 </div>
// 	                            </div>
// 	                          ) : isSuperAdmin && ["approved", "rejected"].includes(row.status) ? (
//                               <button
//                                 onClick={() => handleReview(row, "reset")}
//                                 disabled={reviewing}
//                                 className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
//                               >
//                                 Reset
//                               </button>
//                             ) : (
// 	                            <span className="text-xs text-slate-400">Reviewed</span>
//                           )}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//                 {!loadingAdminRequests && (adminRequests || []).length === 0 ? (
//                   <p className="text-sm crm-muted py-4">No requests found for selected filters.</p>
//                 ) : null}
//               </div>
//             </div>

//             <div className="crm-card p-5">
//               <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between mb-4">
//                 <div className="flex items-center gap-2 crm-title">
//                   <UserRound className="w-5 h-5 text-violet-600" />
//                   Employee Leave Buckets
//                 </div>
//                 <div className="relative">
//                   <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
//                   <input
//                     value={employeeSearch}
//                     onChange={(e) => setEmployeeSearch(e.target.value)}
//                     // placeholder="Search by name, e"
//                     className="crm-input pl-9 pr-3 py-2 text-sm w-full md:w-64"
//                   />
//                 </div>
//               </div>
// 	              <div className="overflow-x-auto">
// 	                <table className="crm-table text-sm">
//                   <thead>
//                     <tr className="text-left text-slate-500 border-b">
//                       <th className="py-2 pr-4">Employee</th>
//                       <th className="py-2 pr-4">Pseudo Name</th>
//                       <th className="py-2 pr-4">Department</th>
//                       <th className="py-2 pr-4">Probation</th>
//                       <th className="py-2 pr-4">EL</th>
//                       <th className="py-2 pr-4">CL</th>
//                       <th className="py-2 pr-4">SL</th>
//                     </tr>
//                   </thead>
// 	                  <tbody>
// 	                    {paginatedEmployees.map((row) => (
// 	                      <tr key={row.userId} className="border-b border-slate-100">
//                         <td className="py-2 pr-4">
//                           <div className="font-medium text-slate-800">{row.name}</div>
//                           <div className="text-xs text-slate-500">{row.empId || row.username}</div>
//                         </td>
//                         <td className="py-2 pr-4 text-slate-700">{row.username || "-"}</td>
//                         <td className="py-2 pr-4 text-slate-700">{row.department || "-"}</td>
//                         <td className="py-2 pr-4">
//                           <span
//                             className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
//                               row.probationCompleted
//                                 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
//                                 : "bg-amber-100 text-amber-700 border-amber-200"
//                             }`}
//                           >
//                             {row.probationCompleted ? "Passed" : "In Probation"}
//                           </span>
//                         </td>
//                         <td className="py-2 pr-4 text-slate-700">{row.balance?.available?.EL ?? 0}</td>
//                         <td className="py-2 pr-4 text-slate-700">{row.balance?.available?.CL ?? 0}</td>
//                         <td className="py-2 pr-4 text-slate-700">{row.balance?.available?.ML ?? 0}</td>
//                       </tr>
//                     ))}
// 	                  </tbody>
// 	                </table>
//                   {filteredEmployees.length === 0 ? (
//                     <p className="text-sm crm-muted py-4 text-center">
//                       {employeeSearch ? `No employees found matching "${employeeSearch}"` : "No employee leave bucket data found."}
//                     </p>
//                   ) : (
//                     <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
//                       <p className="text-sm crm-muted">
//                         Showing {employeeStart + 1}-
//                         {Math.min(employeeStart + employeePageSize, filteredEmployees.length)} of {filteredEmployees.length}
//                       </p>
//                       <div className="flex items-center gap-2">
//                         <select
//                           value={employeePageSize}
//                           onChange={(e) => setEmployeePageSize(Number(e.target.value))}
//                           className="crm-select text-sm !w-auto"
//                         >
//                           <option value={10}>10 / page</option>
//                           <option value={20}>20 / page</option>
//                           <option value={30}>30 / page</option>
//                           <option value={50}>50 / page</option>
//                         </select>
//                         <button
//                           onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
//                           disabled={safeEmployeePage <= 1}
//                           className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
//                         >
//                           Prev
//                         </button>
//                         <span className="text-sm text-slate-700">
//                           Page {safeEmployeePage} / {employeeTotalPages}
//                         </span>
//                         <button
//                           onClick={() => setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))}
//                           disabled={safeEmployeePage >= employeeTotalPages}
//                           className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
//                         >
//                           Next
//                         </button>
//                       </div>
//                     </div>
//                   )}
// 	              </div>
// 	            </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const topLoader = loadingSummary || loadingRequests || loadingAdminDashboard || loadingAdminRequests;

//   return (
//     <>
//       {topLoader ? (
//         <div className="fixed right-4 top-20 z-50 rounded-xl border border-blue-200 bg-white/95 px-3 py-2 text-xs text-blue-700 shadow-sm">
//           Loading leave data...
//         </div>
//       ) : null}
//       {expandedText ? (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
//           onClick={() => setExpandedText(null)}
//         >
//           <div
//             className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                   {expandedText.label}
//                 </p>
//                 <p className="mt-1 text-sm font-semibold text-slate-800">Full text preview</p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setExpandedText(null)}
//                 className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
//               >
//                 Close
//               </button>
//             </div>
//             <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
//               {expandedText.value}
//             </div>
//           </div>
//         </div>
//       ) : null}
//       {statusPreview ? (
//         <div
//           className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4"
//           onClick={() => setStatusPreview(null)}
//         >
//           <div
//             className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl md:p-6"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                   Leave Status
//                 </p>
//                 <p className="mt-1 text-sm font-semibold text-slate-800">
//                   My Leave History Status Flow
//                 </p>
//               </div>
//               <button
//                 type="button"
//                 onClick={() => setStatusPreview(null)}
//                 className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
//               >
//                 Close
//               </button>
//             </div>
//             {(() => {
//               const visibleStatusKeys = statusPreview.visibleKeys || ["pending"];
//               const visibleStatusCount = visibleStatusKeys.length;
//               const gridColsClass =
//                 visibleStatusCount === 1
//                   ? "md:grid-cols-1"
//                   : visibleStatusCount === 2
//                   ? "md:grid-cols-2"
//                   : "md:grid-cols-3";
//               const lineClass =
//                 visibleStatusCount === 2
//                   ? "left-1/4 right-1/4"
//                   : "left-[16.666%] right-[16.666%]";

//               return (
//                 <div className="mt-6">
//                   {visibleStatusCount > 1 ? (
//                     <div className="relative hidden px-10 md:block">
//                       <div className={`absolute ${lineClass} top-7 h-px bg-slate-300`} />
//                     </div>
//                   ) : null}
//                   <div className={`grid grid-cols-1 gap-4 ${gridColsClass} md:gap-6`}>
//                     {visibleStatusKeys.map((key) => {
//                   const section = statusPreview.sections?.[key];
//                   const meta = getStatusPreviewMeta(key);
//                   const Icon = meta.Icon;
//                   const isVisible = true;
//                   const isActive = statusPreview.activeKey === key;
//                   const isCurrentStatus = statusPreview.currentKey === key;

//                   return (
//                     <div key={key} className="flex flex-col items-center">
//                       <button
//                         type="button"
//                         onClick={() => {
//                           if (!isVisible) return;
//                           setStatusPreview((prev) => ({ ...prev, activeKey: key }));
//                         }}
//                         className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 transition ${
//                           isVisible ? meta.circleClass : meta.mutedCircleClass
//                         } ${isActive ? `ring-4 ring-offset-2 ${meta.ringClass}` : ""} ${
//                           isVisible ? "cursor-pointer shadow-lg" : "cursor-default opacity-80"
//                         } ${isCurrentStatus ? "animate-pulse" : ""}`}
//                         title={meta.label}
//                       >
//                         <Icon className="h-6 w-6" />
//                       </button>
//                       <div className={`h-6 w-px ${isVisible ? meta.connectorClass : "bg-slate-200"}`} />
//                       <div
//                         className={`w-full rounded-[24px] border p-4 text-left shadow-sm transition ${
//                           isVisible ? meta.cardClass : meta.mutedCardClass
//                         } ${isActive ? "shadow-lg" : ""}`}
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <div>
//                             <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
//                               {section?.title}
//                             </p>
//                             <p className="mt-1 text-base font-semibold text-slate-800">{meta.label}</p>
//                           </div>
//                           <span
//                             className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
//                               isVisible
//                                 ? getStatusChipClass(section?.status)
//                                 : meta.mutedBadgeClass
//                             }`}
//                           >
//                             {isVisible ? section?.status : "waiting"}
//                           </span>
//                         </div>

//                         <div className="mt-4 space-y-3 text-sm">
//                           <div
//                             className={`rounded-2xl border px-3 py-3 ${
//                               isVisible ? meta.accentCardClass : meta.mutedAccentCardClass
//                             }`}
//                           >
//                             <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">
//                               {section?.actionLabel}
//                             </p>
//                             <p className="mt-1 font-medium">
//                               {isVisible ? section?.actionDate : "Awaiting update"}
//                             </p>
//                           </div>

//                           {section?.nameLabel ? (
//                             <div className={`rounded-2xl border px-3 py-3 ${meta.subCardClass}`}>
//                               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
//                                 {section?.nameLabel}
//                               </p>
//                               <p className="mt-1 font-medium">
//                                 {isVisible ? section?.nameValue : "-"}
//                               </p>
//                             </div>
//                           ) : null}

//                           {section?.actorLabel ? (
//                             <div className={`rounded-2xl border px-3 py-3 ${meta.subCardClass}`}>
//                               <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
//                                 {section?.actorLabel}
//                               </p>
//                               <p className="mt-1 font-medium">
//                                 {isVisible ? section?.actor : "-"}
//                               </p>
//                             </div>
//                           ) : null}

//                           <div className={`min-h-[110px] rounded-2xl border px-3 py-3 ${meta.subCardClass}`}>
//                             <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
//                               {section?.detailLabel || "Decision Remark"}
//                             </p>
//                             <p
//                               className={`mt-2 whitespace-pre-wrap break-words text-sm ${
//                                 isVisible ? "text-slate-700" : "text-slate-400"
//                               }`}
//                             >
//                               {isVisible
//                                 ? section?.detailValue
//                                 : "No decision recorded yet."}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//                   </div>
//                 </div>
//               );
//             })()}
//           </div>
//         </div>
//       ) : null}
//       {isAdminView ? renderAdminView() : renderEmployeeView()}
//     </>
//   );
// };

// export default LeaveManagement;

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, CheckCircle2, Clock3, Eye, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "./Navbar.jsx";
import StyledDatePicker from "../components/StyledDatePicker.jsx";
import {
  applyLeave,
  clearLeaveMessage,
  fetchAdminLeaveDashboard,
  fetchAdminLeaveRequests,
  fetchMyLeaveRequests,
  fetchMyLeaveSummary,
  reviewLeaveRequest,
} from "../features/slices/leaveSlice.js";

const formatDate = (value) => {
  if (!value) return "-";
  const str = String(value);
  if (str.includes('T')) {
    // ISO string, adjust for IST
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return "-";
    d.setHours(d.getHours() + 5.5);
    return d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "2-digit" });
  } else {
    // Assume YYYY-MM-DD or other
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
  if (key === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (key === "rejected") return "bg-rose-100 text-rose-700 border-rose-200";
  if (key === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const STATUS_PREVIEW_ORDER = ["pending", "approved", "rejected"];

const getStatusPreviewMeta = (key) => {
  if (key === "approved") {
    return {
      label: "Approved",
      Icon: CheckCircle2,
      circleClass: "border-emerald-300 bg-emerald-500 text-white",
      mutedCircleClass: "border-emerald-200 bg-white text-emerald-300",
      ringClass: "ring-emerald-100",
      cardClass: "border-emerald-300 bg-emerald-100",
      accentCardClass: "border-emerald-300 bg-emerald-200 text-emerald-900",
      mutedCardClass: "border-emerald-300 bg-emerald-100",
      mutedAccentCardClass: "border-emerald-300 bg-emerald-200 text-emerald-700",
      subCardClass: "border-emerald-200 bg-emerald-50 text-slate-700",
      mutedBadgeClass: "border-emerald-200 bg-white text-emerald-600",
      connectorClass: "bg-emerald-300",
    };
  }

  if (key === "rejected") {
    return {
      label: "Rejected",
      Icon: XCircle,
      circleClass: "border-rose-300 bg-rose-500 text-white",
      mutedCircleClass: "border-rose-200 bg-white text-rose-300",
      ringClass: "ring-rose-100",
      cardClass: "border-rose-300 bg-rose-100",
      accentCardClass: "border-rose-300 bg-rose-200 text-rose-900",
      mutedCardClass: "border-rose-300 bg-rose-100",
      mutedAccentCardClass: "border-rose-300 bg-rose-200 text-rose-700",
      subCardClass: "border-rose-200 bg-rose-50 text-slate-700",
      mutedBadgeClass: "border-rose-200 bg-white text-rose-600",
      connectorClass: "bg-rose-300",
    };
  }

  return {
    label: "Pending",
    Icon: Clock3,
    circleClass: "border-amber-300 bg-amber-400 text-slate-900",
    mutedCircleClass: "border-amber-200 bg-white text-amber-300",
    ringClass: "ring-amber-100",
    cardClass: "border-amber-300 bg-amber-100",
    accentCardClass: "border-amber-300 bg-amber-200 text-amber-900",
    mutedCardClass: "border-amber-300 bg-amber-100",
    mutedAccentCardClass: "border-amber-300 bg-amber-200 text-amber-700",
    subCardClass: "border-amber-200 bg-amber-50 text-slate-700",
    mutedBadgeClass: "border-amber-200 bg-white text-amber-600",
    connectorClass: "bg-amber-300",
  };
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const LeaveManagement = ({ embeddedAdmin = false }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    mySummary,
    myRequests,
    adminDashboard,
    adminRequests,
    loadingSummary,
    loadingRequests,
    loadingAdminDashboard,
    loadingAdminRequests,
    applying,
    reviewing,
    error,
    message,
  } = useSelector((state) => state.leave);

  const isAdminView = ["HR", "superAdmin", "admin"].includes(user?.accountType);
  const canViewTeamBalances = isAdminView || user?.roleType === "supervisor" || user?.isTeamLeader;
  const isSuperAdmin = user?.accountType === "superAdmin";
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "L",
    startDate: "",
    endDate: "",
    startSession: "full",
    endSession: "full",
    reason: "",
  });
  const [requestFilter, setRequestFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(10);
  const [reviewRemarks, setReviewRemarks] = useState({});
  const [expandedText, setExpandedText] = useState(null);
  const [statusPreview, setStatusPreview] = useState(null);
  const [teamLeaveDateFilter, setTeamLeaveDateFilter] = useState("");

  useEffect(() => {
    if (isAdminView) {
      dispatch(fetchAdminLeaveDashboard());
    } else if (canViewTeamBalances) {
      dispatch(fetchMyLeaveRequests());
      dispatch(fetchAdminLeaveDashboard());
      dispatch(fetchAdminLeaveRequests({ status: "approved" }));
    } else {
      dispatch(fetchMyLeaveSummary());
      dispatch(fetchMyLeaveRequests());
    }
  }, [dispatch, isAdminView, canViewTeamBalances]);

  useEffect(() => {
    if (!isAdminView) return;
    const timer = setTimeout(() => {
      dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
    }, 350);
    return () => clearTimeout(timer);
  }, [dispatch, isAdminView, requestFilter, search]);

  useEffect(() => {
    if (error) toast.error(error);
    if (message) {
      toast.success(message);
      dispatch(clearLeaveMessage());
    }
  }, [dispatch, error, message]);

  useEffect(() => {
    setEmployeePage(1);
  }, [employeeSearch, employeePageSize]);

  const summaryStats = mySummary?.stats || {};
  const config = mySummary?.config || adminDashboard?.config || {};
  const currentLeaveBalance =
    mySummary?.currentLeaveBalance ??
    mySummary?.balance?.currentLeaveBalance ??
    mySummary?.balance?.currentAvailable ??
    0;
  const approvedTeamLeaves = (adminRequests || []).filter((row) => String(row.status || "").toLowerCase() === "approved");
  const filteredTeamLeaves = teamLeaveDateFilter
    ? approvedTeamLeaves.filter((row) => {
        const filterDate = new Date(`${teamLeaveDateFilter}T00:00:00`);
        if (Number.isNaN(filterDate.getTime())) return true;
        const start = new Date(row.startDate);
        const end = new Date(row.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
        const from = start <= end ? start : end;
        const to = start <= end ? end : start;
        const day = new Date(filterDate);
        return day >= from && day <= to;
      })
    : approvedTeamLeaves;

  const handleApply = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (!String(leaveForm.reason || "").trim() || String(leaveForm.reason || "").trim().length < 5) {
      toast.error("Please enter your leave reason ");
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
      dispatch(fetchMyLeaveSummary());
      dispatch(fetchMyLeaveRequests());
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
      dispatch(fetchAdminLeaveDashboard());
      dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
    }
  };

  const renderExpandableText = (value, label, widthClass = "w-[180px]") => {
    const text = String(value || "").trim() || "-";
    const canExpand = text !== "-";

    return (
      <button
        type="button"
        onClick={() => canExpand && setExpandedText({ label, value: text })}
        className={`block ${widthClass} truncate text-left ${
          canExpand ? "cursor-pointer text-slate-700 hover:text-blue-700 hover:underline" : "cursor-default text-slate-500"
        }`}
        title={canExpand ? "Click to view full text" : text}
      >
        {text}
      </button>
    );
  };

  const openStatusPreview = (row) => {
    const currentStatus = String(row?.status || "pending").trim().toLowerCase();
    const requesterName =
      row?.userId?.pseudoName ||
      row?.userId?.realName ||
      row?.userId?.username ||
      user?.pseudoName ||
      user?.realName ||
      user?.username ||
      "-";
    const reviewerName =
      row?.reviewedBy?.pseudoName ||
      row?.reviewedBy?.realName ||
      row?.reviewedBy?.username ||
      "-";
    const leaveReason = String(row?.reason || "").trim() || "-";

    const visibleKeys = ["pending"];
    if (currentStatus === "approved") visibleKeys.push("approved");
    if (currentStatus === "rejected") visibleKeys.push("rejected");

    setStatusPreview({
      activeKey: currentStatus === "approved" || currentStatus === "rejected" ? currentStatus : "pending",
      currentKey: currentStatus === "approved" || currentStatus === "rejected" ? currentStatus : "pending",
      visibleKeys,
      sections: {
        pending: {
          title: "Pending Status",
          status: "pending",
          actionLabel: "Pending Since",
          actionDate: formatDateTime(row?.createdAt),
          nameLabel: "Name",
          nameValue: requesterName,
          detailLabel: "Leave Reason",
          detailValue: leaveReason,
        },
        approved: {
          title: "Approved Status",
          status: "approved",
          actionLabel: "Approved On",
          actionDate: currentStatus === "approved" ? formatDateTime(row?.reviewedAt) : "-",
          actorLabel: "Approved By",
          actor: currentStatus === "approved" ? reviewerName : "-",
          detailLabel: "Decision Remark",
          detailValue:
            currentStatus === "approved"
              ? String(row?.reviewComment || "").trim() || "-"
              : "-",
        },
        rejected: {
          title: "Rejected Status",
          status: "rejected",
          actionLabel: "Rejected On",
          actionDate: currentStatus === "rejected" ? formatDateTime(row?.reviewedAt) : "-",
          actorLabel: "Rejected By",
          actor: currentStatus === "rejected" ? reviewerName : "-",
          detailLabel: "Decision Remark",
          detailValue:
            currentStatus === "rejected"
              ? String(row?.reviewComment || "").trim() || "-"
              : "-",
        },
      },
    });
  };

  const renderEmployeeView = () => (
    <div className="min-h-screen crm-page">
      {!embeddedAdmin ? <Navbar /> : null}
      <div className={`${!embeddedAdmin ? "pt-0" : "pt-0"} px-4 md:px-6 pb-10`}>
        <div className="max-w-[1300px] mx-auto space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <form onSubmit={handleApply} className="xl:col-span-2 crm-card p-5">
              <div className="flex items-center gap-2 crm-title">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Apply Leave
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-semibold crm-muted">Leave Type</label>
                  <select
                    className="mt-1 crm-select"
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, leaveType: e.target.value }))}
                  >
                    <option value="BL">BL (Birthday Leave)</option>
                    <option value="L">L (Leave)</option>
                    <option value="LWP">LWP (Leave Without Pay)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold crm-muted">Start Date</label>
                  <div className="mt-1">
                    <StyledDatePicker
                      value={leaveForm.startDate}
                      onChange={(value) => setLeaveForm((p) => ({ ...p, startDate: value }))}
                      placeholder="Select start date"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold crm-muted">Start Session</label>
                  <select
                    className="mt-1 crm-select"
                    value={leaveForm.startSession}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, startSession: e.target.value }))}
                  >
                    <option value="full">Full Day</option>
                    <option value="first_half">First Half</option>
                    <option value="second_half">Second Half</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold crm-muted">End Date</label>
                  <div className="mt-1">
                    <StyledDatePicker
                      value={leaveForm.endDate}
                      onChange={(value) => setLeaveForm((p) => ({ ...p, endDate: value }))}
                      placeholder="Select end date"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold crm-muted">End Session</label>
                  <select
                    className="mt-1 crm-select"
                    value={leaveForm.endSession}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, endSession: e.target.value }))}
                  >
                    <option value="full">Full Day</option>
                    <option value="first_half">First Half</option>
                    <option value="second_half">Second Half</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold crm-muted">Reason</label>
                  <input
                    type="text"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Clearly mention reason for leave"
                    className="mt-1 crm-input"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs crm-muted">
                Example: Mon (full) to Wed (first half) = 2.5 days. Single-day half leave: set same date and choose first/second half.
              </p>
              <button
                type="submit"
                disabled={applying}
                className="mt-4 w-full py-2.5 crm-btn-primary disabled:opacity-50"
              >
                {applying ? "Submitting..." : "Submit Leave Request"}
              </button>
            </form>

            {isAdminView ? (
            <div className="crm-card p-5">
              <div className="flex items-center gap-2 crm-title">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Current Leave Balance
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="crm-soft-card p-3">
                  <p className="crm-muted">Current Balance</p>
                  <p className="text-2xl font-semibold">{currentLeaveBalance}</p>
                </div>
                <div className="crm-soft-card p-3">
                  <p className="crm-muted">Pending Requests</p>
                  <p className="font-semibold">
                    {summaryStats.pendingRequests ?? 0}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
                  One-time approval limit: {config?.APPROVAL_MAX_DAYS ?? 6} days
                </div>
              </div>
            </div>
            ) : canViewTeamBalances ? (
            <div className="crm-card p-5">
              <div className="flex items-center gap-2 crm-title mb-4">
                <UserRound className="w-5 h-5 text-violet-600" />
                Team Approved Leaves
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold crm-muted">Choose Date</label>
                <div className="mt-1">
                  <StyledDatePicker
                    value={teamLeaveDateFilter}
                    onChange={setTeamLeaveDateFilter}
                    placeholder="Filter by approved leave date"
                  />
                </div>
                {teamLeaveDateFilter ? (
                  <button
                    type="button"
                    onClick={() => setTeamLeaveDateFilter("")}
                    className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                  >
                    Clear filter
                  </button>
                ) : null}
              </div>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {filteredTeamLeaves.length ? (
                  filteredTeamLeaves.map((row) => (
                    <div key={row._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="font-medium text-slate-800">
                        {row.userId?.pseudoName || row.userId?.realName || row.userId?.username || "-"}
                      </p>
                      <p className="text-xs font-medium text-violet-600">{row.leaveType || "-"}</p>
                      <p className="text-sm text-slate-600">
                        {formatDate(row.startDate)}
                        {formatDate(row.startDate) !== formatDate(row.endDate) ? ` - ${formatDate(row.endDate)}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm crm-muted">
                    {teamLeaveDateFilter ? "No approved leave found for selected date." : "No approved team leave found."}
                  </p>
                )}
              </div>
            </div>
            ) : null}
          </div>

          {canViewTeamBalances && (adminDashboard?.employees || []).length ? (
            <div className="crm-card p-5">
              <div className="flex items-center gap-2 crm-title mb-4">
                <UserRound className="w-5 h-5 text-violet-600" />
                Team Current Leave Balance
              </div>
              <div className="overflow-x-auto">
                <table className="crm-table text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">Employee</th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Current Leave Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adminDashboard?.employees || []).map((row) => (
                      <tr key={row.userId} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-800">{row.name}</div>
                          <div className="text-xs text-slate-500">{row.empId || row.username}</div>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.department || "-"}</td>
                        <td className="py-2 pr-4 text-slate-700">{row.currentLeaveBalance ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="crm-card p-5">
            <div className="flex items-center gap-2 crm-title mb-4">
              <Clock3 className="w-5 h-5 text-violet-600" />
              My Leave History
            </div>
            <div className="overflow-x-auto">
              <table className="crm-table text-sm">
                <thead>
	                    <tr className="text-left text-slate-500 border-b">
	                      <th className="py-2 pr-4">Type</th>
	                      <th className="py-2 pr-4">Session</th>
	                      <th className="py-2 pr-4">Date Range</th>
                      <th className="py-2 pr-4 w-[180px]">Leave Reason</th>
	                      <th className="py-2 pr-4">Requested</th>
	                      <th className="py-2 pr-4">Sandwich</th>
                      <th className="py-2 pr-4">Charged</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Reviewed By</th>
                      <th className="py-2 pr-0 text-center w-[56px]">View</th>
	                    </tr>
                </thead>
                <tbody>
                  {(myRequests || []).map((row) => (
                    <tr key={row._id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-800">{row.leaveType}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        {String(row.startSession || "full").replace("_", " ")} → {String(row.endSession || "full").replace("_", " ")}
                      </td>
	                      <td className="py-2 pr-4 text-slate-600">
	                        {formatDate(row.startDate)} - {formatDate(row.endDate)}
	                      </td>
                        <td className="py-2 pr-4 text-slate-700 align-top">
                          {renderExpandableText(row.reason, "Leave Reason")}
                        </td>
	                      <td className="py-2 pr-4 text-slate-700">{row.requestedDays}</td>
	                      <td className="py-2 pr-4 text-slate-700">{row.sandwichDays}</td>
	                      <td className="py-2 pr-4 text-slate-700">{row.chargedDays}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.status)}`}>
	                          {row.status}
	                        </span>
	                      </td>
                        <td className="py-2 pr-4 text-slate-600">
                          {row.reviewedBy?.pseudoName || row.reviewedBy?.realName || row.reviewedBy?.username || "-"}
                          {row.reviewedAt ? (
                            <div className="text-xs text-slate-500">{formatDate(row.reviewedAt)}</div>
                          ) : null}
                        </td>
                        <td className="py-2 pr-0 text-center">
                          <button
                            type="button"
                            onClick={() => openStatusPreview(row)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            title="View leave status details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
	                    </tr>
	                  ))}
                </tbody>
              </table>
              {!loadingRequests && (myRequests || []).length === 0 ? (
                <p className="text-sm crm-muted py-4">No leave requests yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminView = () => {
    const stats = adminDashboard?.stats || {};
    const employees = adminDashboard?.employees || [];
    
    const filteredEmployees = employees.filter(emp => {
      if (!employeeSearch.trim()) return true;
      const searchTerm = employeeSearch.toLowerCase();
      return (
        (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
        (emp.empId && emp.empId.toLowerCase().includes(searchTerm)) ||
        (emp.username && emp.username.toLowerCase().includes(searchTerm))
      );
    });
    const employeeTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeePageSize));
    const safeEmployeePage = Math.min(employeePage, employeeTotalPages);
    const employeeStart = (safeEmployeePage - 1) * employeePageSize;
    const paginatedEmployees = filteredEmployees.slice(employeeStart, employeeStart + employeePageSize);

    return (
      <div className="crm-page min-h-screen">
        <div className="pt-6 px-4 md:px-6 pb-10">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="crm-card p-4">
                <p className="text-xs uppercase tracking-wide crm-muted">Total Employees</p>
                <p className="text-3xl font-semibold mt-1">{stats.totalEmployees ?? 0}</p>
              </div>
              <div className="crm-card p-4">
                <p className="text-xs uppercase tracking-wide crm-muted">Pending Requests</p>
                <p className="text-3xl font-semibold text-amber-600 mt-1">{stats.pendingRequests ?? 0}</p>
              </div>
              <div className="crm-card p-4">
                <p className="text-xs uppercase tracking-wide crm-muted">Approved Requests</p>
                <p className="text-3xl font-semibold text-emerald-600 mt-1">{stats.approvedRequests ?? 0}</p>
              </div>
            </div>

            <div className="crm-card p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                <div className="flex items-center gap-2 crm-title">
                  <Clock3 className="w-5 h-5 text-blue-600" />
                  Leave Requests Queue
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={requestFilter}
                    onChange={(e) => setRequestFilter(e.target.value)}
                    className="crm-select text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All</option>
                  </select>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search employee"
                      className="crm-input pl-9 pr-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="crm-table text-sm">
                  <thead>
	                    <tr className="text-left text-slate-500 border-b"> 
	                      <th className="py-2 pr-4">Employee</th>
	                      <th className="py-2 pr-4">Type</th>
	                      <th className="py-2 pr-4">Session</th>
	                      <th className="py-2 pr-4">Date Range</th>
                      <th className="py-2 pr-4 w-[180px]">Leave Reason</th>
	                      <th className="py-2 pr-4">Charged</th>
	                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Reviewed By</th>
                      <th className="py-2 pr-4 w-[180px]">Decision Remark</th>
	                      <th className="py-2 pr-4">Actions</th>
	                    </tr>
                  </thead>
                  <tbody>
                    {(adminRequests || []).map((row) => (
                      <tr key={row._id} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-800">{row.userId?.pseudoName || row.userId?.username}</div>
                          <div className="text-xs text-slate-500">{row.userId?.empId || row.userId?.username}</div>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.leaveType}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          {String(row.startSession || "full").replace("_", " ")} → {String(row.endSession || "full").replace("_", " ")}
                        </td>
	                        <td className="py-2 pr-4 text-slate-600">
	                          {formatDate(row.startDate)} - {formatDate(row.endDate)}
	                        </td>
                          <td className="py-2 pr-4 text-slate-700 align-top">
                            {renderExpandableText(row.reason, "Leave Reason")}
                          </td>
	                        <td className="py-2 pr-4 text-slate-700">{row.chargedDays}</td>
	                        <td className="py-2 pr-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.status)}`}>
	                            {row.status}
	                          </span>
	                        </td>
                          <td className="py-2 pr-4 text-slate-600">
                            {row.reviewedBy?.pseudoName || row.reviewedBy?.realName || row.reviewedBy?.username || "-"}
                            {row.reviewedAt ? (
                              <div className="text-xs text-slate-500">{formatDate(row.reviewedAt)}</div>
                            ) : null}
                          </td>
                          <td className="py-2 pr-4 text-slate-700 align-top">
                            {renderExpandableText(row.reviewComment, "Decision Remark")}
                          </td>
	                        <td className="py-2 pr-4">
	                          {row.status === "pending" ? (
	                            <div className="flex flex-col gap-2 min-w-[240px]">
                                <input
                                  value={reviewRemarks[row._id] || ""}
                                  onChange={(e) =>
                                    setReviewRemarks((prev) => ({ ...prev, [row._id]: e.target.value }))
                                  }
                                  placeholder="Remark for approve/reject"
                                  className="crm-input py-1.5 text-xs"
                                />
                                <div className="flex items-center gap-2">
	                              <button
	                                onClick={() => handleReview(row, "approve")}
	                                disabled={reviewing}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-2.5 py-1.5 text-xs hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(row, "reject")}
                                disabled={reviewing}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 text-white px-2.5 py-1.5 text-xs hover:bg-rose-700 disabled:opacity-50"
                              >
	                                <XCircle className="w-3.5 h-3.5" />
	                                Reject
	                              </button>
                                </div>
	                            </div>
	                          ) : isSuperAdmin && ["approved", "rejected"].includes(row.status) ? (
                              <button
                                onClick={() => handleReview(row, "reset")}
                                disabled={reviewing}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Reset
                              </button>
                            ) : (
	                            <span className="text-xs text-slate-400">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loadingAdminRequests && (adminRequests || []).length === 0 ? (
                  <p className="text-sm crm-muted py-4">No requests found for selected filters.</p>
                ) : null}
              </div>
            </div>

            <div className="crm-card p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between mb-4">
                <div className="flex items-center gap-2 crm-title">
                  <UserRound className="w-5 h-5 text-violet-600" />
                  Current Leave Balance
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    // placeholder="Search by name, e"
                    className="crm-input pl-9 pr-3 py-2 text-sm w-full md:w-64"
                  />
                </div>
              </div>
	              <div className="overflow-x-auto">
	                <table className="crm-table text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">Employee</th>
                      <th className="py-2 pr-4">Pseudo Name</th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Current Leave Balance</th>
                    </tr>
                  </thead>
	                  <tbody>
	                    {paginatedEmployees.map((row) => (
	                      <tr key={row.userId} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-800">{row.name}</div>
                          <div className="text-xs text-slate-500">{row.empId || row.username}</div>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.username || "-"}</td>
                        <td className="py-2 pr-4 text-slate-700">{row.department || "-"}</td>
                        <td className="py-2 pr-4 text-slate-700">{row.currentLeaveBalance ?? 0}</td>
                      </tr>
                    ))}
	                  </tbody>
	                </table>
                  {filteredEmployees.length === 0 ? (
                    <p className="text-sm crm-muted py-4 text-center">
                      {employeeSearch ? `No employees found matching "${employeeSearch}"` : "No employee leave balance data found."}
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm crm-muted">
                        Showing {employeeStart + 1}-
                        {Math.min(employeeStart + employeePageSize, filteredEmployees.length)} of {filteredEmployees.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          value={employeePageSize}
                          onChange={(e) => setEmployeePageSize(Number(e.target.value))}
                          className="crm-select text-sm !w-auto"
                        >
                          <option value={10}>10 / page</option>
                          <option value={20}>20 / page</option>
                          <option value={30}>30 / page</option>
                          <option value={50}>50 / page</option>
                        </select>
                        <button
                          onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                          disabled={safeEmployeePage <= 1}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <span className="text-sm text-slate-700">
                          Page {safeEmployeePage} / {employeeTotalPages}
                        </span>
                        <button
                          onClick={() => setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))}
                          disabled={safeEmployeePage >= employeeTotalPages}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
	              </div>
	            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {expandedText ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setExpandedText(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {expandedText.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">Full text preview</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedText(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">
              {expandedText.value}
            </div>
          </div>
        </div>
      ) : null}
      {statusPreview ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setStatusPreview(null)}
        >
          <div
            className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Leave Status
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  My Leave History Status Flow
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusPreview(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            {(() => {
              const visibleStatusKeys = statusPreview.visibleKeys || ["pending"];
              const visibleStatusCount = visibleStatusKeys.length;
              const gridColsClass =
                visibleStatusCount === 1
                  ? "md:grid-cols-1"
                  : visibleStatusCount === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-3";
              const lineClass =
                visibleStatusCount === 2
                  ? "left-1/4 right-1/4"
                  : "left-[16.666%] right-[16.666%]";

              return (
                <div className="mt-6">
                  {visibleStatusCount > 1 ? (
                    <div className="relative hidden px-10 md:block">
                      <div className={`absolute ${lineClass} top-7 h-px bg-slate-300`} />
                    </div>
                  ) : null}
                  <div className={`grid grid-cols-1 gap-4 ${gridColsClass} md:gap-6`}>
                    {visibleStatusKeys.map((key) => {
                  const section = statusPreview.sections?.[key];
                  const meta = getStatusPreviewMeta(key);
                  const Icon = meta.Icon;
                  const isVisible = true;
                  const isActive = statusPreview.activeKey === key;
                  const isCurrentStatus = statusPreview.currentKey === key;

                  return (
                    <div key={key} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isVisible) return;
                          setStatusPreview((prev) => ({ ...prev, activeKey: key }));
                        }}
                        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 transition ${
                          isVisible ? meta.circleClass : meta.mutedCircleClass
                        } ${isActive ? `ring-4 ring-offset-2 ${meta.ringClass}` : ""} ${
                          isVisible ? "cursor-pointer shadow-lg" : "cursor-default opacity-80"
                        } ${isCurrentStatus ? "animate-pulse" : ""}`}
                        title={meta.label}
                      >
                        <Icon className="h-6 w-6" />
                      </button>
                      <div className={`h-6 w-px ${isVisible ? meta.connectorClass : "bg-slate-200"}`} />
                      <div
                        className={`w-full rounded-[24px] border p-4 text-left shadow-sm transition ${
                          isVisible ? meta.cardClass : meta.mutedCardClass
                        } ${isActive ? "shadow-lg" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {section?.title}
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-800">{meta.label}</p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                              isVisible
                                ? getStatusChipClass(section?.status)
                                : meta.mutedBadgeClass
                            }`}
                          >
                            {isVisible ? section?.status : "waiting"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3 text-sm">
                          <div
                            className={`rounded-2xl border px-3 py-3 ${
                              isVisible ? meta.accentCardClass : meta.mutedAccentCardClass
                            }`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">
                              {section?.actionLabel}
                            </p>
                            <p className="mt-1 font-medium">
                              {isVisible ? section?.actionDate : "Awaiting update"}
                            </p>
                          </div>

                          {section?.nameLabel ? (
                            <div className={`rounded-2xl border px-3 py-3 ${meta.subCardClass}`}>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {section?.nameLabel}
                              </p>
                              <p className="mt-1 font-medium">
                                {isVisible ? section?.nameValue : "-"}
                              </p>
                            </div>
                          ) : null}

                          {section?.actorLabel ? (
                            <div className={`rounded-2xl border px-3 py-3 ${meta.subCardClass}`}>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {section?.actorLabel}
                              </p>
                              <p className="mt-1 font-medium">
                                {isVisible ? section?.actor : "-"}
                              </p>
                            </div>
                          ) : null}

                          <div className={`min-h-[110px] rounded-2xl border px-3 py-3 ${meta.subCardClass}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              {section?.detailLabel || "Decision Remark"}
                            </p>
                            <p
                              className={`mt-2 whitespace-pre-wrap break-words text-sm ${
                                isVisible ? "text-slate-700" : "text-slate-400"
                              }`}
                            >
                              {isVisible
                                ? section?.detailValue
                                : "No decision recorded yet."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
      {isAdminView ? renderAdminView() : renderEmployeeView()}
    </>
  );
};

export default LeaveManagement;
