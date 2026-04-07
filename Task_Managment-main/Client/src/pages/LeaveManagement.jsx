import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CalendarDays, CheckCircle2, Clock3, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
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
  const raw = String(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  }
  const y = Number(match[1]);
  const m = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(Date.UTC(y, m, day));
  return d.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getStatusChipClass = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "approved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (key === "rejected") return "bg-rose-100 text-rose-700 border-rose-200";
  if (key === "pending") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
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
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "EL",
    startDate: "",
    endDate: "",
    startSession: "full",
    endSession: "full",
    reason: "",
  });
  const [requestFilter, setRequestFilter] = useState("pending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isAdminView) {
      dispatch(fetchAdminLeaveDashboard());
      dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
    } else {
      dispatch(fetchMyLeaveSummary());
      dispatch(fetchMyLeaveRequests());
    }
  }, [dispatch, isAdminView]);

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

  const summaryStats = mySummary?.stats || {};
  const config = mySummary?.config || adminDashboard?.config || {};

  const handleApply = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error("Please select start and end dates");
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
    const result = await dispatch(
      reviewLeaveRequest({
        requestId: row._id,
        action,
        comment: "",
      })
    );
    if (reviewLeaveRequest.fulfilled.match(result)) {
      dispatch(fetchAdminLeaveDashboard());
      dispatch(fetchAdminLeaveRequests({ status: requestFilter, search }));
    }
  };

  const renderEmployeeView = () => (
    <div className="min-h-screen crm-page">
      {!embeddedAdmin ? <Navbar /> : null}
      <div className={`${!embeddedAdmin ? "pt-0" : "pt-0"} px-4 md:px-6 pb-10`}>
        <div className="max-w-[1300px] mx-auto space-y-6">
          {/* <div className="rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-sky-600 p-6 text-white shadow-lg">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Leave Management Dashboard</h1>
            <p className="text-blue-100 mt-1">Welcome back, {user?.realName || user?.username}</p>
          </div> */}

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
                    <option value="EL">EL</option>
                    <option value="CL">CL</option>
                    <option value="ML">ML</option>
                    <option value="LWP">LWP</option>
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
                    placeholder="Short reason for leave"
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

            <div className="crm-card p-5">
              <div className="flex items-center gap-2 crm-title">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Eligibility
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="crm-soft-card p-3">
                  <p className="crm-muted">Pending Requests</p>
                  <p className="text-xl font-semibold">{summaryStats.pendingRequests ?? 0}</p>
                </div>
                <div className="crm-soft-card p-3">
                  <p className="crm-muted">Probation Status</p>
                  <p className="font-semibold">
                    {summaryStats.probationCompleted ? "Passed" : "Under 90-Day Probation"}
                  </p>
                  <p className="text-xs crm-muted mt-1">Ends: {formatDate(summaryStats.probationEndDate)}</p>
                </div>
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-xs text-indigo-900">
                  One-time approval limit: {config?.APPROVAL_MAX_DAYS ?? 6} days
                </div>
              </div>
            </div>
          </div>

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
                      <th className="py-2 pr-4">Requested</th>
                    <th className="py-2 pr-4">Sandwich</th>
                    <th className="py-2 pr-4">Charged</th>
                    <th className="py-2 pr-4">Status</th>
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
                      <td className="py-2 pr-4 text-slate-700">{row.requestedDays}</td>
                      <td className="py-2 pr-4 text-slate-700">{row.sandwichDays}</td>
                      <td className="py-2 pr-4 text-slate-700">{row.chargedDays}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.status)}`}>
                          {row.status}
                        </span>
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

    return (
      <div className="crm-page min-h-screen">
        <div className="pt-6 px-4 md:px-6 pb-10">
          <div className="max-w-[1400px] mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
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
                      <th className="py-2 pr-4">Charged</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adminRequests || []).map((row) => (
                      <tr key={row._id} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-800">{row.userId?.realName || row.userId?.username}</div>
                          <div className="text-xs text-slate-500">{row.userId?.empId || row.userId?.username}</div>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.leaveType}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          {String(row.startSession || "full").replace("_", " ")} → {String(row.endSession || "full").replace("_", " ")}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">
                          {formatDate(row.startDate)} - {formatDate(row.endDate)}
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.chargedDays}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusChipClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {row.status === "pending" ? (
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
              <div className="flex items-center gap-2 crm-title mb-4">
                <UserRound className="w-5 h-5 text-violet-600" />
                Employee Leave Buckets
              </div>
              <div className="overflow-x-auto">
                <table className="crm-table text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2 pr-4">Employee</th>
                      <th className="py-2 pr-4">Department</th>
                      <th className="py-2 pr-4">Probation</th>
                      <th className="py-2 pr-4">EL</th>
                      <th className="py-2 pr-4">CL</th>
                      <th className="py-2 pr-4">ML</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((row) => (
                      <tr key={row.userId} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-800">{row.name}</div>
                          <div className="text-xs text-slate-500">{row.empId || row.username}</div>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.department || "-"}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              row.probationCompleted
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }`}
                          >
                            {row.probationCompleted ? "Passed" : "In Probation"}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">{row.balance?.available?.EL ?? 0}</td>
                        <td className="py-2 pr-4 text-slate-700">{row.balance?.available?.CL ?? 0}</td>
                        <td className="py-2 pr-4 text-slate-700">{row.balance?.available?.ML ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const topLoader = loadingSummary || loadingRequests || loadingAdminDashboard || loadingAdminRequests;

  return (
    <>
      {topLoader ? (
        <div className="fixed right-4 top-20 z-50 rounded-xl border border-blue-200 bg-white/95 px-3 py-2 text-xs text-blue-700 shadow-sm">
          Loading leave data...
        </div>
      ) : null}
      {isAdminView ? renderAdminView() : renderEmployeeView()}
    </>
  );
};

export default LeaveManagement;
