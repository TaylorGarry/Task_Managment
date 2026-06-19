import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Search } from "lucide-react";
import ExitDashboard from "./ExitDashboard.jsx";
import {
  EXIT_STATUS_LABELS,
  EXIT_TYPE_LABELS,
  employeeExitApi,
  formatExitDate,
  getExitEmployeeName,
  getStatusClass,
} from "../services/employeeExitService.js";
import api from "../../api.js";
import { isHrDepartment, isSuperAdmin, normalizeDepartment } from "../utils/roleAccess.js";

const emptyForm = {
  employeeId: "",
  exitType: "voluntary",
  resignationDate: "",
  lastWorkingDate: "",
  reason: "",
  remarks: "",
};

const exitReasonOptions = {
  voluntary: [
    "Career change",
    "Relocation",
    "Higher studies",
    "Personal/family reasons",
    "Better opportunity elsewhere",
  ],
  involuntary: [
    "Absconding",
    "Performance-Based Termination",
    "Disciplinary Termination",
    "Training Failure",
  ],
};

const getEmployeeListFromResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.employees)) return payload.employees;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.employees)) return payload.data.employees;
  return [];
};

const statusOptions = [
  ["all", "All"],
  ["it_verification_pending", "IT Pending"],
  ["hr_clearance_pending", "HR Pending"],
  ["accounts_clearance_pending", "Accounts FNF Pending"],
  ["superadmin_approval_pending", "SuperAdmin Pending"],
  ["waiting_for_last_working_day", "Waiting Last Day"],
  ["exit_completed", "Completed"],
  ["exit_revoked", "Revoked"],
];

const duplicateExitMessage = "Exit process has already been initialized for this employee";

const activeExitStatuses = [
  "notice_period",
  "it_verification_pending",
  "it_cleared",
  "hr_clearance_pending",
  "hr_cleared",
  "accounts_clearance_pending",
  "accounts_cleared",
  "superadmin_approval_pending",
  "waiting_for_last_working_day",
];

const getExitEmployeeId = (exit = {}) => String(exit?.employeeId?._id || exit?.employeeId || "");

const EmployeeExitList = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboard, setDashboard] = useState({});
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeExitEmployeeIds, setActiveExitEmployeeIds] = useState(() => new Set());

  const role = useMemo(() => {
    if (isSuperAdmin(user)) return "superAdmin";
    if (isHrDepartment(user)) return "HR";
    if (normalizeDepartment(user?.department) === "IT") return "IT";
    return "employee";
  }, [user]);

  const canInitiate = role === "HR";

  const loadEmployees = useCallback(async () => {
    if (!canInitiate) return;
    try {
      const res = await api.get("/api/v1/employees");
      const list = getEmployeeListFromResponse(res.data);
      setEmployees(
        list.filter(
          (item) =>
            item?.isActive !== false &&
            String(item?.accountType || "").trim() !== "superAdmin"
        )
      );
    } catch {
      setEmployees([]);
    }
  }, [canInitiate]);

  const loadActiveExitEmployeeIds = useCallback(async () => {
    if (!canInitiate) {
      setActiveExitEmployeeIds(new Set());
      return;
    }

    try {
      const responses = await Promise.all(
        activeExitStatuses.map((activeStatus) =>
          employeeExitApi.list({ page: 1, limit: 100, status: activeStatus })
        )
      );
      const ids = new Set();
      responses.forEach((res) => {
        const items = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
        items.forEach((exit) => {
          const employeeId = getExitEmployeeId(exit);
          if (employeeId) ids.add(employeeId);
        });
      });
      setActiveExitEmployeeIds(ids);
    } catch {
      setActiveExitEmployeeIds(new Set());
    }
  }, [canInitiate]);

  const loadData = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true);
      const params = { page, limit: pagination.limit, status, search };
      const [dashboardRes, listRes] = await Promise.all([
        employeeExitApi.dashboard(),
        employeeExitApi.list(params),
      ]);
      setDashboard(dashboardRes.data?.data || {});
      setRows(Array.isArray(listRes.data?.data?.items) ? listRes.data.data.items : []);
      setPagination(listRes.data?.data?.pagination || { page, limit: 20, total: 0, totalPages: 1 });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load employee exits");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => loadData(1), 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    loadEmployees();
    loadActiveExitEmployeeIds();
  }, [loadActiveExitEmployeeIds, loadEmployees]);

  const openInitiateModal = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setForm(emptyForm);
  };

  const submitInitiate = async () => {
    const validReasons = exitReasonOptions[form.exitType] || [];
    if (
      !form.employeeId ||
      !form.exitType ||
      !form.resignationDate ||
      !form.lastWorkingDate ||
      !validReasons.includes(form.reason)
    ) {
      toast.error("Employee, exit type, dates, and policy reason are required");
      return;
    }
    if (activeExitEmployeeIds.has(String(form.employeeId))) {
      toast.error(duplicateExitMessage);
      return;
    }

    try {
      setSaving(true);
      await employeeExitApi.initiate(form);
      toast.success("Employee exit initiated");
      setActiveExitEmployeeIds((prev) => new Set(prev).add(String(form.employeeId)));
      closeModal();
      await loadData(1);
      await loadActiveExitEmployeeIds();
    } catch (error) {
      const message =
        error?.response?.status === 409
          ? duplicateExitMessage
          : error?.response?.data?.message || "Failed to initiate exit";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeeChange = (employeeId) => {
    if (activeExitEmployeeIds.has(String(employeeId))) {
      toast.error(duplicateExitMessage);
    }
    setForm((prev) => ({ ...prev, employeeId }));
  };

  const handleExitTypeChange = (exitType) => {
    setForm((prev) => ({ ...prev, exitType, reason: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">HR Operations</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Employee Exit Management</h1>
          </div>
          {canInitiate ? (
            <button
              type="button"
              onClick={openInitiateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Initiate Exit
            </button>
          ) : null}
        </div>

        <ExitDashboard dashboard={dashboard} />

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Exit Type</th>
                  <th className="px-3 py-3">Resignation</th>
                  <th className="px-3 py-3">Last Working Day</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const employee = row.employeeId || {};
                  return (
                    <tr key={row._id} className="align-top hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">{getExitEmployeeName(employee)}</p>
                        <p className="text-xs text-slate-500">{employee.empId || employee.username || "-"}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{employee.department || "-"}</td>
                      <td className="px-3 py-3 text-slate-600">{EXIT_TYPE_LABELS[row.exitType] || "-"}</td>
                      <td className="px-3 py-3 text-slate-600">{formatExitDate(row.resignationDate)}</td>
                      <td className="px-3 py-3 text-slate-600">{formatExitDate(row.lastWorkingDate)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(row.status)}`}>
                          {EXIT_STATUS_LABELS[row.status] || row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link to={`/employee-exits/${row._id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && !rows.length ? <p className="py-6 text-center text-sm text-slate-500">No employee exits found.</p> : null}
            {loading ? <p className="py-6 text-center text-sm text-slate-500">Loading employee exits...</p> : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>Showing page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadData(Math.max(1, pagination.page - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => loadData(Math.min(pagination.totalPages, pagination.page + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Initiate Employee Exit</h2>
                <p className="text-sm text-slate-500">Employee access stays active until final completion.</p>
              </div>
              <button type="button" onClick={closeModal} className="text-sm font-semibold text-slate-600">Close</button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Employee
                <select
                  value={form.employeeId}
                  onChange={(event) => handleEmployeeChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {getExitEmployeeName(employee)} {employee.empId ? `(${employee.empId})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Exit Type
                <select
                  value={form.exitType}
                  onChange={(event) => handleExitTypeChange(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {Object.entries(EXIT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Resignation Date
                <input
                  type="date"
                  value={form.resignationDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, resignationDate: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Last Working Date
                <input
                  type="date"
                  value={form.lastWorkingDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, lastWorkingDate: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Policy Reason
                <select
                  value={form.reason}
                  onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Select reason</option>
                  {(exitReasonOptions[form.exitType] || []).map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Remarks
                <textarea
                  value={form.remarks}
                  onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="button" onClick={submitInitiate} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Initiating..." : "Initiate Exit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EmployeeExitList;
