import api from "../../api.js";

const BASE = "/api/v1/employee-exit";

export const employeeExitApi = {
  dashboard: () => api.get(`${BASE}/dashboard`),
  list: (params = {}) => api.get(BASE, { params }),
  pending: (params = {}) => api.get(`${BASE}/pending`, { params }),
  completed: (params = {}) => api.get(`${BASE}/completed`, { params }),
  details: (id) => api.get(`${BASE}/${id}`),
  auditLogs: (id) => api.get(`${BASE}/${id}/audit-logs`),
  initiate: (payload) => api.post(`${BASE}/initiate`, payload),
  itClearance: (id, payload) => api.post(`${BASE}/${id}/it-clearance`, payload),
  hrClearance: (id, payload) => api.post(`${BASE}/${id}/hr-clearance`, payload),
  accountsClearance: (id, payload) => api.post(`${BASE}/${id}/accounts-clearance`, payload),
  finalApproval: (id, payload) => api.post(`${BASE}/${id}/final-approval`, payload),
  revoke: (id, payload) => api.post(`${BASE}/${id}/revoke`, payload),
};

export const EXIT_STATUS_LABELS = {
  notice_period: "Notice Period",
  it_verification_pending: "IT Verification Pending",
  it_cleared: "IT Cleared",
  hr_clearance_pending: "HR Clearance Pending",
  hr_cleared: "HR Cleared",
  accounts_clearance_pending: "Accounts FNF Pending",
  accounts_cleared: "Accounts Cleared",
  superadmin_approval_pending: "SuperAdmin Approval Pending",
  waiting_for_last_working_day: "Waiting For Last Working Day",
  exit_completed: "Exit Completed",
  exit_revoked: "Exit Revoked",
};

export const EXIT_TYPE_LABELS = {
  voluntary: "Voluntary Separation",
  involuntary: "Involuntary Separation",
};

export const formatExitDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const formatExitDateTime = (value) => {
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

export const getExitEmployeeName = (employee = {}) =>
  employee?.realName || employee?.pseudoName || employee?.username || "Employee";

export const getStatusClass = (status = "") => {
  if (status === "exit_completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "exit_revoked") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "waiting_for_last_working_day") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  if (status === "superadmin_approval_pending") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "accounts_clearance_pending") return "border-teal-200 bg-teal-50 text-teal-700";
  if (status === "hr_clearance_pending") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "it_verification_pending") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};
